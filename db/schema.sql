-- =====================================================================
--  Archifex / أرشيفكس — PostgreSQL 16 schema
--  Multi-tenant document management & archiving platform
--
--  Requirements:
--    - PostgreSQL 16+
--    - extensions: pgcrypto, citext, pg_trgm, vector (pgvector >= 0.7), ltree
--
--  Conventions:
--    * UUID primary keys (gen_random_uuid)
--    * tenant_id on every business table + RLS
--    * bilingual columns: *_ar / *_en
--    * soft delete via deleted_at where recovery matters
--    * timestamps are timestamptz (UTC)
--    * money is numeric(18,2), never float
--
--  Run as the migration/owner role, NOT as the application role.
--  The application role must be a non-owner without BYPASSRLS.
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS ltree;

-- =====================================================================
-- 1. ENUMS
-- =====================================================================

CREATE TYPE tenant_kind          AS ENUM ('education', 'corporate', 'government', 'hybrid');
CREATE TYPE tenant_status        AS ENUM ('trial', 'active', 'suspended', 'closed');
CREATE TYPE member_status        AS ENUM ('invited', 'active', 'suspended');
CREATE TYPE sector_kind          AS ENUM ('education', 'corporate', 'government', 'shared');
CREATE TYPE document_status      AS ENUM ('draft', 'processing', 'needs_review', 'active', 'archived', 'disposed');
CREATE TYPE confidentiality_level AS ENUM ('public', 'internal', 'confidential', 'restricted');
CREATE TYPE ocr_status           AS ENUM ('pending', 'running', 'done', 'failed', 'skipped');
CREATE TYPE job_status           AS ENUM ('queued', 'running', 'succeeded', 'failed', 'dead');
CREATE TYPE extraction_source    AS ENUM ('ocr', 'llm', 'rule', 'manual', 'import');
CREATE TYPE permission_level     AS ENUM ('view', 'download', 'edit', 'manage');
CREATE TYPE acl_subject_type     AS ENUM ('user', 'role', 'department');
CREATE TYPE link_relation        AS ENUM ('related', 'supersedes', 'attachment', 'reference', 'duplicate');
CREATE TYPE student_status       AS ENUM ('applicant', 'enrolled', 'graduated', 'withdrawn', 'suspended');
CREATE TYPE degree_level         AS ENUM ('diploma', 'bachelor', 'master', 'doctorate', 'other');
CREATE TYPE gender_kind          AS ENUM ('male', 'female', 'unspecified');
CREATE TYPE project_status       AS ENUM ('planned', 'active', 'on_hold', 'completed', 'cancelled');
CREATE TYPE contract_status      AS ENUM ('draft', 'active', 'expired', 'terminated', 'renewed');
CREATE TYPE workflow_status      AS ENUM ('draft', 'running', 'approved', 'rejected', 'cancelled', 'expired');
CREATE TYPE task_status          AS ENUM ('pending', 'in_progress', 'approved', 'rejected', 'skipped', 'expired');
CREATE TYPE signature_status     AS ENUM ('draft', 'sent', 'viewed', 'signed', 'declined', 'expired', 'voided');
CREATE TYPE retention_action     AS ENUM ('review', 'archive', 'destroy');

-- =====================================================================
-- 2. HELPER FUNCTIONS
-- =====================================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- Tenant context is set by the API at the start of every transaction:
--   SET LOCAL app.tenant_id = '<uuid>';
--   SET LOCAL app.user_id   = '<uuid>';
CREATE OR REPLACE FUNCTION app_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('app.tenant_id', true), '')::uuid
$$;

CREATE OR REPLACE FUNCTION app_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('app.user_id', true), '')::uuid
$$;

-- =====================================================================
-- 3. TENANCY, IDENTITY & ORGANIZATION
-- =====================================================================

CREATE TABLE tenants (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            citext NOT NULL UNIQUE,
  name_ar         text NOT NULL,
  name_en         text NOT NULL,
  kind            tenant_kind NOT NULL DEFAULT 'corporate',
  status          tenant_status NOT NULL DEFAULT 'trial',
  plan            text NOT NULL DEFAULT 'starter',
  default_locale  text NOT NULL DEFAULT 'ar' CHECK (default_locale IN ('ar', 'en')),
  timezone        text NOT NULL DEFAULT 'Asia/Riyadh',
  logo_key        text,
  settings        jsonb NOT NULL DEFAULT '{}'::jsonb,
  storage_quota_bytes bigint NOT NULL DEFAULT 53687091200,   -- 50 GiB
  ocr_page_quota  integer NOT NULL DEFAULT 100000,
  ai_token_quota  bigint NOT NULL DEFAULT 20000000,
  trial_ends_at   timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE tenant_domains (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  domain      citext NOT NULL UNIQUE,
  is_primary  boolean NOT NULL DEFAULT false,
  verified_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE departments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  parent_id   uuid REFERENCES departments(id) ON DELETE RESTRICT,
  code        text NOT NULL,
  name_ar     text NOT NULL,
  name_en     text NOT NULL,
  kind        text NOT NULL DEFAULT 'department',  -- department | faculty | college | division
  path        ltree NOT NULL,
  manager_id  uuid,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT departments_tenant_code_key UNIQUE (tenant_id, code),
  CONSTRAINT departments_tenant_path_key UNIQUE (tenant_id, path)
);

CREATE TABLE roles (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  key          text NOT NULL,               -- admin | manager | editor | viewer | auditor | custom_*
  name_ar      text NOT NULL,
  name_en      text NOT NULL,
  description  text,
  permissions  jsonb NOT NULL DEFAULT '[]'::jsonb,  -- ["document:read", "workflow:act"]
  is_system    boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT roles_tenant_key_key UNIQUE (tenant_id, key)
);

CREATE TABLE users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         citext NOT NULL UNIQUE,
  full_name_ar  text NOT NULL,
  full_name_en  text NOT NULL,
  job_title     text,
  phone         text,
  locale        text NOT NULL DEFAULT 'ar' CHECK (locale IN ('ar', 'en')),
  avatar_key    text,
  idp_subject   text UNIQUE,                 -- OIDC "sub" / SAML NameID
  idp_provider  text,
  mfa_enabled   boolean NOT NULL DEFAULT false,
  last_login_at timestamptz,
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE memberships (
  tenant_id     uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id       uuid NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
  department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  title         text,
  status        member_status NOT NULL DEFAULT 'active',
  is_primary    boolean NOT NULL DEFAULT false,
  invited_by    uuid REFERENCES users(id) ON DELETE SET NULL,
  joined_at     timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, user_id)
);

ALTER TABLE departments
  ADD CONSTRAINT departments_manager_fk
  FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL;

CREATE TABLE notifications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind       text NOT NULL,                 -- document_ready | task_assigned | signature_signed | sla_breach
  title_ar   text NOT NULL,
  title_en   text NOT NULL,
  body_ar    text,
  body_en    text,
  link       text,
  is_read    boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE saved_searches (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name_ar    text NOT NULL,
  name_en    text NOT NULL,
  query      jsonb NOT NULL,
  is_shared  boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE api_keys (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name         text NOT NULL,
  key_prefix   text NOT NULL,
  key_hash     bytea NOT NULL,
  scopes       text[] NOT NULL DEFAULT '{}',
  created_by   uuid REFERENCES users(id) ON DELETE SET NULL,
  last_used_at timestamptz,
  expires_at   timestamptz,
  revoked_at   timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT api_keys_prefix_key UNIQUE (key_prefix)
);

CREATE TABLE webhooks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  url         text NOT NULL,
  secret_encrypted bytea NOT NULL,
  events      text[] NOT NULL DEFAULT '{}',
  is_active   boolean NOT NULL DEFAULT true,
  created_by  uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- =====================================================================
-- 4. EDUCATION DOMAIN
-- =====================================================================

CREATE TABLE academic_years (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  code       text NOT NULL,                 -- 2025-2026
  name_ar    text NOT NULL,
  name_en    text NOT NULL,
  starts_on  date NOT NULL,
  ends_on    date NOT NULL,
  is_current boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT academic_years_tenant_code_key UNIQUE (tenant_id, code)
);

CREATE TABLE programs (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  department_id  uuid NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
  code           text NOT NULL,
  name_ar        text NOT NULL,
  name_en        text NOT NULL,
  degree_level   degree_level NOT NULL DEFAULT 'bachelor',
  duration_years numeric(3,1),
  total_credits  integer,
  is_active      boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT programs_tenant_code_key UNIQUE (tenant_id, code)
);

CREATE TABLE students (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  student_no       text NOT NULL,
  full_name_ar     text NOT NULL,
  full_name_en     text NOT NULL,
  national_id_hash bytea,                   -- hashed, never plaintext
  date_of_birth    date,
  gender           gender_kind NOT NULL DEFAULT 'unspecified',
  email            citext,
  phone            text,
  program_id       uuid REFERENCES programs(id) ON DELETE SET NULL,
  department_id    uuid REFERENCES departments(id) ON DELETE SET NULL,
  status           student_status NOT NULL DEFAULT 'enrolled',
  enrollment_date  date,
  graduation_date  date,
  gpa              numeric(4,2) CHECK (gpa IS NULL OR (gpa >= 0 AND gpa <= 5)),
  total_credits    integer,
  metadata         jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT students_tenant_no_key UNIQUE (tenant_id, student_no)
);

-- =====================================================================
-- 5. CORPORATE DOMAIN
-- =====================================================================

CREATE TABLE clients (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  code        text NOT NULL,
  name_ar     text NOT NULL,
  name_en     text NOT NULL,
  industry    text,
  tax_number  text,
  contact_name  text,
  contact_email citext,
  contact_phone text,
  status      text NOT NULL DEFAULT 'active',
  metadata    jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT clients_tenant_code_key UNIQUE (tenant_id, code)
);

CREATE TABLE projects (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  client_id   uuid REFERENCES clients(id) ON DELETE SET NULL,
  code        text NOT NULL,
  name_ar     text NOT NULL,
  name_en     text NOT NULL,
  manager_id  uuid REFERENCES users(id) ON DELETE SET NULL,
  status      project_status NOT NULL DEFAULT 'planned',
  starts_on   date,
  ends_on     date,
  budget      numeric(18,2),
  currency    char(3) NOT NULL DEFAULT 'SAR',
  metadata    jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT projects_tenant_code_key UNIQUE (tenant_id, code)
);

-- =====================================================================
-- 6. DOCUMENT TYPES, FOLDERS & DOCUMENTS
-- =====================================================================

CREATE TABLE document_types (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id          uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  key                text NOT NULL,          -- academic_transcript | contract | invoice ...
  name_ar            text NOT NULL,
  name_en            text NOT NULL,
  sector             sector_kind NOT NULL DEFAULT 'shared',
  description        text,
  required_fields    jsonb NOT NULL DEFAULT '[]'::jsonb,
  ai_schema          jsonb NOT NULL DEFAULT '{}'::jsonb,
  retention_months   integer CHECK (retention_months IS NULL OR retention_months > 0),
  requires_signature boolean NOT NULL DEFAULT false,
  requires_review    boolean NOT NULL DEFAULT true,
  is_system          boolean NOT NULL DEFAULT false,
  is_active          boolean NOT NULL DEFAULT true,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT document_types_tenant_key_key UNIQUE (tenant_id, key)
);

CREATE TABLE folders (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  parent_id  uuid REFERENCES folders(id) ON DELETE RESTRICT,
  name_ar    text NOT NULL,
  name_en    text NOT NULL,
  path       ltree NOT NULL,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT folders_tenant_path_key UNIQUE (tenant_id, path)
);

CREATE TABLE documents (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type_id          uuid REFERENCES document_types(id) ON DELETE SET NULL,
  folder_id        uuid REFERENCES folders(id) ON DELETE SET NULL,
  doc_number       text,
  title_ar         text NOT NULL,
  title_en         text,
  description      text,
  status           document_status NOT NULL DEFAULT 'draft',
  confidentiality  confidentiality_level NOT NULL DEFAULT 'internal',
  language         char(2) NOT NULL DEFAULT 'ar' CHECK (language IN ('ar', 'en')),
  department_id    uuid REFERENCES departments(id) ON DELETE SET NULL,
  project_id       uuid REFERENCES projects(id) ON DELETE SET NULL,
  client_id        uuid REFERENCES clients(id) ON DELETE SET NULL,
  student_id       uuid REFERENCES students(id) ON DELETE SET NULL,
  owner_id         uuid REFERENCES users(id) ON DELETE SET NULL,
  current_version_id uuid,                  -- FK added after document_versions
  tags             text[] NOT NULL DEFAULT '{}',
  ai_summary_ar    text,
  ai_summary_en    text,
  classification_confidence numeric(4,3)
    CHECK (classification_confidence IS NULL OR (classification_confidence >= 0 AND classification_confidence <= 1)),
  ai_processed_at  timestamptz,
  metadata         jsonb NOT NULL DEFAULT '{}'::jsonb,
  doc_date         date,
  expires_at       date,
  retention_until  date,
  legal_hold       boolean NOT NULL DEFAULT false,
  page_count       integer NOT NULL DEFAULT 0,
  size_bytes       bigint NOT NULL DEFAULT 0,
  checksum         char(64),                -- SHA-256 of the original file
  created_by       uuid REFERENCES users(id) ON DELETE SET NULL,
  updated_by       uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  deleted_at       timestamptz
);

CREATE UNIQUE INDEX documents_tenant_number_key
  ON documents (tenant_id, doc_number)
  WHERE doc_number IS NOT NULL;

CREATE TABLE document_versions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  document_id    uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version_no     integer NOT NULL CHECK (version_no > 0),
  storage_key    text NOT NULL,
  mime_type      text NOT NULL,
  size_bytes     bigint NOT NULL DEFAULT 0,
  checksum       char(64) NOT NULL,
  page_count     integer NOT NULL DEFAULT 0,
  is_original    boolean NOT NULL DEFAULT false,
  ocr_status     ocr_status NOT NULL DEFAULT 'pending',
  processing_error text,
  created_by     uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT document_versions_no_key UNIQUE (document_id, version_no)
);

ALTER TABLE documents
  ADD CONSTRAINT documents_current_version_fk
  FOREIGN KEY (current_version_id) REFERENCES document_versions(id) ON DELETE SET NULL;

CREATE TABLE document_pages (
  id              bigserial PRIMARY KEY,
  tenant_id       uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  version_id      uuid NOT NULL REFERENCES document_versions(id) ON DELETE CASCADE,
  page_no         integer NOT NULL CHECK (page_no > 0),
  width_pt        numeric(8,2),
  height_pt       numeric(8,2),
  rotation        smallint NOT NULL DEFAULT 0,
  ocr_text        text,
  ocr_confidence  numeric(4,3) CHECK (ocr_confidence IS NULL OR (ocr_confidence >= 0 AND ocr_confidence <= 1)),
  layout          jsonb NOT NULL DEFAULT '{}'::jsonb,  -- blocks, tables, stamps, signatures
  thumb_key       text,
  image_key       text,
  embedding       vector(1024),
  created_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT document_pages_no_key UNIQUE (version_id, page_no)
);

-- Denormalized search surface: one row per document, rebuilt by the indexer.
CREATE TABLE document_search (
  document_id uuid PRIMARY KEY REFERENCES documents(id) ON DELETE CASCADE,
  tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  content     text NOT NULL DEFAULT '',
  tsv         tsvector GENERATED ALWAYS AS (to_tsvector('simple', coalesce(content, ''))) STORED,
  embedding   vector(1024),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE extracted_fields (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  document_id    uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version_id     uuid NOT NULL REFERENCES document_versions(id) ON DELETE CASCADE,
  field_key      text NOT NULL,
  value_text     text,
  value_json     jsonb,
  value_type     text NOT NULL DEFAULT 'string',
  confidence     numeric(4,3) NOT NULL DEFAULT 0 CHECK (confidence >= 0 AND confidence <= 1),
  page_no        integer,
  bbox           jsonb,                     -- {x,y,w,h} normalized 0..1
  source         extraction_source NOT NULL DEFAULT 'llm',
  model_version  text,
  verified_by    uuid REFERENCES users(id) ON DELETE SET NULL,
  verified_at    timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE document_tags (
  tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  tag         text NOT NULL,
  confidence  numeric(4,3),
  source      extraction_source NOT NULL DEFAULT 'manual',
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (document_id, tag)
);

CREATE TABLE document_acl (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  subject_type acl_subject_type NOT NULL,
  subject_id  uuid NOT NULL,
  permission  permission_level NOT NULL DEFAULT 'view',
  expires_at  timestamptz,
  granted_by  uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT document_acl_unique UNIQUE (document_id, subject_type, subject_id, permission)
);

CREATE TABLE document_shares (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  document_id   uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  token_hash    bytea NOT NULL UNIQUE,
  permission    permission_level NOT NULL DEFAULT 'view',
  password_hash text,
  expires_at    timestamptz NOT NULL,
  max_views     integer,
  view_count    integer NOT NULL DEFAULT 0,
  last_access_at timestamptz,
  created_by    uuid REFERENCES users(id) ON DELETE SET NULL,
  revoked_at    timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE document_links (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  from_document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  to_document_id   uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  relation         link_relation NOT NULL DEFAULT 'related',
  created_by       uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT document_links_unique UNIQUE (from_document_id, to_document_id, relation),
  CONSTRAINT document_links_no_self CHECK (from_document_id <> to_document_id)
);

CREATE TABLE contracts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  client_id   uuid REFERENCES clients(id) ON DELETE SET NULL,
  project_id  uuid REFERENCES projects(id) ON DELETE SET NULL,
  document_id uuid REFERENCES documents(id) ON DELETE SET NULL,
  contract_no text NOT NULL,
  title_ar    text NOT NULL,
  title_en    text,
  contract_value numeric(18,2),
  currency    char(3) NOT NULL DEFAULT 'SAR',
  starts_on   date,
  ends_on     date,
  status      contract_status NOT NULL DEFAULT 'draft',
  signed_at   timestamptz,
  metadata    jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT contracts_tenant_no_key UNIQUE (tenant_id, contract_no)
);

CREATE TABLE retention_policies (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  document_type_id  uuid REFERENCES document_types(id) ON DELETE CASCADE,
  name_ar           text NOT NULL,
  name_en           text NOT NULL,
  retention_months  integer NOT NULL CHECK (retention_months > 0),
  action            retention_action NOT NULL DEFAULT 'review',
  legal_basis       text,
  is_active         boolean NOT NULL DEFAULT true,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- =====================================================================
-- 7. PROCESSING JOBS
-- =====================================================================

CREATE TABLE processing_jobs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  document_id  uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version_id   uuid REFERENCES document_versions(id) ON DELETE CASCADE,
  stage        text NOT NULL,               -- ingest | scan | normalize | ocr | classify | extract | embed | index
  status       job_status NOT NULL DEFAULT 'queued',
  attempts     smallint NOT NULL DEFAULT 0,
  priority     smallint NOT NULL DEFAULT 5,
  worker_id    text,
  error        text,
  metrics      jsonb NOT NULL DEFAULT '{}'::jsonb,
  started_at   timestamptz,
  finished_at  timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT processing_jobs_stage_key UNIQUE (version_id, stage)
);

-- =====================================================================
-- 8. WORKFLOWS & SIGNATURES
-- =====================================================================

CREATE TABLE workflow_templates (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  key              text NOT NULL,
  name_ar          text NOT NULL,
  name_en          text NOT NULL,
  document_type_id uuid REFERENCES document_types(id) ON DELETE SET NULL,
  definition       jsonb NOT NULL,
  version          integer NOT NULL DEFAULT 1,
  is_active        boolean NOT NULL DEFAULT true,
  created_by       uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT workflow_templates_key UNIQUE (tenant_id, key, version)
);

CREATE TABLE workflow_instances (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  template_id  uuid NOT NULL REFERENCES workflow_templates(id) ON DELETE RESTRICT,
  document_id  uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  status       workflow_status NOT NULL DEFAULT 'running',
  current_step text,
  started_by   uuid REFERENCES users(id) ON DELETE SET NULL,
  started_at   timestamptz NOT NULL DEFAULT now(),
  due_at       timestamptz,
  completed_at timestamptz,
  context      jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE workflow_tasks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  instance_id uuid NOT NULL REFERENCES workflow_instances(id) ON DELETE CASCADE,
  step_key    text NOT NULL,
  name_ar     text NOT NULL,
  name_en     text NOT NULL,
  assignee_id uuid REFERENCES users(id) ON DELETE SET NULL,
  role_id     uuid REFERENCES roles(id) ON DELETE SET NULL,
  status      task_status NOT NULL DEFAULT 'pending',
  decision    text,
  comment     text,
  due_at      timestamptz,
  acted_at    timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE signatures (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id          uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  document_id        uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version_id         uuid NOT NULL REFERENCES document_versions(id) ON DELETE CASCADE,
  task_id            uuid REFERENCES workflow_tasks(id) ON DELETE SET NULL,
  signer_id          uuid REFERENCES users(id) ON DELETE SET NULL,
  signer_email       citext NOT NULL,
  signer_name        text NOT NULL,
  status             signature_status NOT NULL DEFAULT 'draft',
  provider           text NOT NULL DEFAULT 'internal',   -- internal | documenso | other
  envelope_id        text,
  document_hash      bytea,                  -- SHA-256 of signed version (null until generated)
  signature_key      text,                   -- object key of signature image / signed PDF
  certificate_serial text,
  signed_at          timestamptz,
  ip                 inet,
  user_agent         text,
  metadata           jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE signature_events (
  id           bigserial PRIMARY KEY,
  tenant_id    uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  signature_id uuid NOT NULL REFERENCES signatures(id) ON DELETE CASCADE,
  event_type   text NOT NULL,               -- created | sent | viewed | signed | declined | voided
  payload      jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip           inet,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- =====================================================================
-- 9. AUDIT (append-only, partitioned by month)
-- =====================================================================

CREATE TABLE audit_events (
  id          bigserial,
  tenant_id   uuid NOT NULL,
  actor_id    uuid,
  actor_type  text NOT NULL DEFAULT 'user',   -- user | system | api_key
  action      text NOT NULL,                  -- document.view, document.update, role.change ...
  entity_type text NOT NULL,
  entity_id   uuid,
  before_state jsonb,
  after_state  jsonb,
  ip          inet,
  user_agent  text,
  request_id  text,
  prev_hash   bytea,                         -- previous event hash for this tenant (app writes under advisory lock)
  event_hash  bytea,                         -- sha256(prev_hash || canonical event payload)
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Monthly partitions for 2026. Extend with the maintenance job.
DO $$
DECLARE
  m date;
  part_name text;
BEGIN
  FOR m IN
    SELECT generate_series(date '2026-01-01', date '2026-12-01', interval '1 month')::date
  LOOP
    part_name := format('audit_events_%s', to_char(m, 'YYYY_MM'));
    EXECUTE format(
      'CREATE TABLE IF NOT EXISTS %I PARTITION OF audit_events FOR VALUES FROM (%L) TO (%L)',
      part_name, m, m + interval '1 month'
    );
  END LOOP;
END;
$$;

CREATE TABLE audit_events_default PARTITION OF audit_events DEFAULT;

-- Defense in depth: even the table owner cannot rewrite history.
-- Retention is enforced by dropping whole partitions, never by DELETE.
CREATE OR REPLACE FUNCTION forbid_audit_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'audit_events is append-only (attempted %)', TG_OP
    USING ERRCODE = 'insufficient_privilege';
END;
$$;

CREATE TRIGGER audit_events_append_only
  BEFORE UPDATE OR DELETE ON audit_events
  FOR EACH ROW EXECUTE FUNCTION forbid_audit_mutation();

-- =====================================================================
-- 10. UPDATED_AT TRIGGERS
-- =====================================================================

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'tenants', 'departments', 'roles', 'users', 'memberships', 'saved_searches', 'webhooks',
    'programs', 'students', 'clients', 'projects', 'document_types', 'folders', 'documents',
    'extracted_fields', 'contracts', 'retention_policies', 'workflow_templates',
    'workflow_instances', 'workflow_tasks', 'signatures'
  ]
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%I_updated_at ON %I', t, t);
    EXECUTE format(
      'CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION set_updated_at()', t, t
    );
  END LOOP;
END;
$$;

-- =====================================================================
-- 11. INDEXES
-- =====================================================================

-- Organization
CREATE INDEX memberships_user_idx       ON memberships (user_id);
CREATE INDEX memberships_role_idx       ON memberships (tenant_id, role_id);
CREATE INDEX departments_parent_idx     ON departments (parent_id);
CREATE INDEX departments_path_gist      ON departments USING gist (path);
CREATE INDEX departments_manager_idx    ON departments (manager_id);

-- Documents
CREATE INDEX documents_tenant_status_idx ON documents (tenant_id, status, updated_at DESC);
CREATE INDEX documents_tenant_dept_idx   ON documents (tenant_id, department_id);
CREATE INDEX documents_tenant_type_idx   ON documents (tenant_id, type_id);
CREATE INDEX documents_tenant_owner_idx  ON documents (tenant_id, owner_id);
CREATE INDEX documents_tenant_student_idx ON documents (tenant_id, student_id) WHERE student_id IS NOT NULL;
CREATE INDEX documents_tenant_project_idx ON documents (tenant_id, project_id) WHERE project_id IS NOT NULL;
CREATE INDEX documents_tenant_client_idx  ON documents (tenant_id, client_id) WHERE client_id IS NOT NULL;
CREATE INDEX documents_retention_idx      ON documents (tenant_id, retention_until)
  WHERE retention_until IS NOT NULL AND legal_hold = false;
CREATE INDEX documents_tags_gin           ON documents USING gin (tags);
CREATE INDEX documents_metadata_gin       ON documents USING gin (metadata jsonb_path_ops);
CREATE INDEX documents_title_trgm         ON documents USING gin (title_ar gin_trgm_ops, title_en gin_trgm_ops);
CREATE INDEX documents_active_idx         ON documents (tenant_id, updated_at DESC) WHERE deleted_at IS NULL;

-- Versions & pages
CREATE INDEX document_versions_doc_idx    ON document_versions (document_id, version_no DESC);
CREATE UNIQUE INDEX document_versions_original_key
  ON document_versions (document_id) WHERE is_original;
CREATE INDEX document_versions_ocr_idx    ON document_versions (tenant_id, ocr_status) WHERE ocr_status <> 'done';
CREATE INDEX document_pages_version_idx   ON document_pages (version_id, page_no);
CREATE INDEX document_pages_embedding_idx ON document_pages
  USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);

-- Search
CREATE INDEX document_search_tsv_gin      ON document_search USING gin (tsv);
CREATE INDEX document_search_content_trgm ON document_search USING gin (content gin_trgm_ops);
CREATE INDEX document_search_embedding_idx ON document_search
  USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);

-- Extracted data
CREATE INDEX extracted_fields_doc_idx     ON extracted_fields (document_id, field_key);
CREATE INDEX extracted_fields_version_idx ON extracted_fields (version_id);
CREATE INDEX extracted_fields_review_idx  ON extracted_fields (tenant_id)
  WHERE verified_at IS NULL;
CREATE INDEX document_acl_doc_idx         ON document_acl (document_id);
CREATE INDEX document_acl_subject_idx     ON document_acl (tenant_id, subject_type, subject_id);
CREATE INDEX document_links_from_idx      ON document_links (from_document_id);
CREATE INDEX document_links_to_idx        ON document_links (to_document_id);

-- Education / corporate
CREATE INDEX students_tenant_program_idx  ON students (tenant_id, program_id);
CREATE INDEX students_tenant_status_idx   ON students (tenant_id, status);
CREATE INDEX students_name_trgm           ON students USING gin (full_name_ar gin_trgm_ops, full_name_en gin_trgm_ops);
CREATE INDEX programs_dept_idx            ON programs (department_id);
CREATE INDEX contracts_tenant_client_idx  ON contracts (tenant_id, client_id);
CREATE INDEX contracts_tenant_end_idx     ON contracts (tenant_id, ends_on);
CREATE INDEX projects_client_idx          ON projects (client_id);

-- Workflows & signatures
CREATE INDEX workflow_instances_doc_idx   ON workflow_instances (document_id);
CREATE INDEX workflow_instances_status_idx ON workflow_instances (tenant_id, status);
CREATE INDEX workflow_tasks_assignee_idx  ON workflow_tasks (tenant_id, assignee_id, status);
CREATE INDEX workflow_tasks_instance_idx  ON workflow_tasks (instance_id);
CREATE INDEX signatures_document_idx      ON signatures (document_id);
CREATE INDEX signatures_signer_idx        ON signatures (tenant_id, signer_id);
CREATE INDEX signature_events_signature_idx ON signature_events (signature_id, created_at);

-- Notifications, jobs, audit
CREATE INDEX notifications_user_idx       ON notifications (tenant_id, user_id, is_read, created_at DESC);
CREATE INDEX processing_jobs_status_idx   ON processing_jobs (status, priority, created_at)
  WHERE status IN ('queued', 'failed');
CREATE INDEX processing_jobs_doc_idx      ON processing_jobs (document_id);
CREATE INDEX audit_events_tenant_time_idx ON audit_events (tenant_id, created_at DESC);
CREATE INDEX audit_events_entity_idx      ON audit_events (tenant_id, entity_type, entity_id, created_at DESC);
CREATE INDEX audit_events_actor_idx       ON audit_events (tenant_id, actor_id, created_at DESC);
CREATE INDEX audit_events_request_idx     ON audit_events (request_id);

-- =====================================================================
-- 12. ROW LEVEL SECURITY
-- =====================================================================
-- The API sets app.tenant_id per transaction. Every table that carries a
-- tenant_id gets the same isolation policy, including partitions of audit.
-- Tables without tenant_id: tenants (id), users (global identity), extensions.

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT DISTINCT c.table_name
    FROM information_schema.columns c
    JOIN information_schema.tables t
      ON t.table_schema = c.table_schema AND t.table_name = c.table_name
    WHERE c.table_schema = 'public'
      AND c.column_name = 'tenant_id'
      AND t.table_type = 'BASE TABLE'
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', r.table_name);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', r.table_name);
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I', r.table_name);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I
         USING (tenant_id = app_tenant_id())
         WITH CHECK (tenant_id = app_tenant_id())',
      r.table_name
    );
  END LOOP;
END;
$$;

-- Allow a signed-in user to enumerate their own memberships across tenants,
-- which powers the workspace switcher. All other rows stay tenant-scoped.
CREATE POLICY memberships_self_read ON memberships
  FOR SELECT
  USING (user_id = app_user_id());

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants FORCE ROW LEVEL SECURITY;
CREATE POLICY tenants_isolation ON tenants
  USING (
    id = app_tenant_id()
    OR EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.tenant_id = tenants.id
        AND m.user_id = app_user_id()
        AND m.status = 'active'
    )
  )
  WITH CHECK (id = app_tenant_id());

-- users is a global identity table. Access is granted through memberships,
-- so it is readable only inside a tenant context where a membership exists.
-- Login/SSO resolution happens in the auth service through a dedicated,
-- narrowly scoped role before a tenant context is established.
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;
CREATE POLICY users_same_tenant ON users
  USING (
    EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.user_id = users.id AND m.tenant_id = app_tenant_id()
    )
  )
  WITH CHECK (true);

-- =====================================================================
-- 13. DEFAULT ROLES HELPER
-- =====================================================================

-- Call inside a transaction where app.tenant_id = p_tenant (RLS applies).
CREATE OR REPLACE FUNCTION create_default_roles(p_tenant uuid)
RETURNS void
LANGUAGE sql
AS $$
  INSERT INTO roles (tenant_id, key, name_ar, name_en, permissions, is_system)
  VALUES
    (p_tenant, 'admin',   'مدير النظام', 'Administrator',
      '["*"]'::jsonb, true),
    (p_tenant, 'manager', 'مدير',        'Manager',
      '["document:read","document:create","document:update","document:archive","document:approve","workflow:read","workflow:start","workflow:act","user:read","report:read","share:create"]'::jsonb, true),
    (p_tenant, 'editor',  'محرر',        'Editor',
      '["document:read","document:create","document:update","workflow:read","workflow:act","share:create"]'::jsonb, true),
    (p_tenant, 'viewer',  'مستعرض',      'Viewer',
      '["document:read","workflow:read"]'::jsonb, true),
    (p_tenant, 'auditor', 'مدقق',        'Auditor',
      '["document:read","audit:read","report:read"]'::jsonb, true)
  ON CONFLICT (tenant_id, key) DO NOTHING;
$$;

-- =====================================================================
-- 14. VIEWS
-- =====================================================================

CREATE VIEW v_document_overview
WITH (security_invoker = true)
AS
SELECT
  d.id,
  d.tenant_id,
  d.title_ar,
  d.title_en,
  d.doc_number,
  d.status,
  d.confidentiality,
  d.language,
  d.tags,
  d.page_count,
  d.size_bytes,
  d.doc_date,
  d.created_at,
  d.updated_at,
  dt.key  AS type_key,
  dt.name_ar AS type_name_ar,
  dt.name_en AS type_name_en,
  dep.name_ar AS department_name_ar,
  dep.name_en AS department_name_en,
  s.student_no,
  s.full_name_ar AS student_name_ar,
  c.name_ar AS client_name_ar,
  p.name_ar AS project_name_ar
FROM documents d
LEFT JOIN document_types dt ON dt.id = d.type_id
LEFT JOIN departments dep   ON dep.id = d.department_id
LEFT JOIN students s        ON s.id = d.student_id
LEFT JOIN clients c         ON c.id = d.client_id
LEFT JOIN projects p        ON p.id = d.project_id
WHERE d.deleted_at IS NULL;

CREATE VIEW v_pending_tasks
WITH (security_invoker = true)
AS
SELECT
  t.id,
  t.tenant_id,
  t.instance_id,
  t.step_key,
  t.name_ar,
  t.name_en,
  t.status,
  t.due_at,
  t.assignee_id,
  wi.document_id,
  d.title_ar AS document_title_ar,
  d.confidentiality
FROM workflow_tasks t
JOIN workflow_instances wi ON wi.id = t.instance_id
JOIN documents d           ON d.id = wi.document_id
WHERE t.status IN ('pending', 'in_progress')
  AND d.deleted_at IS NULL;

-- =====================================================================
-- 15. GRANTS (adjust role name to your environment)
-- =====================================================================
-- CREATE ROLE archifex_app LOGIN PASSWORD '***' NOBYPASSRLS;
-- GRANT USAGE ON SCHEMA public TO archifex_app;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO archifex_app;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO archifex_app;
-- ALTER DEFAULT PRIVILEGES IN SCHEMA public
--   GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO archifex_app;
-- REVOKE UPDATE, DELETE ON audit_events FROM archifex_app;  -- append-only
-- GRANT INSERT ON audit_events TO archifex_app;

-- =====================================================================
-- END OF SCHEMA
-- =====================================================================
