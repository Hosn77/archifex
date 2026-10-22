import type { User } from "@supabase/supabase-js";

export type WorkspacePlan = "trial" | "starter" | "professional" | "enterprise";
export type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled";
export type WorkspaceRole = "owner" | "admin" | "editor" | "viewer";
export type DocumentStatus = "processing" | "active" | "archived";

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  trial_start_date: string;
  trial_ends_at: string;
  subscription_status: SubscriptionStatus;
  plan: WorkspacePlan;
  billing_customer_id: string | null;
  subscription_started_at: string | null;
  subscription_ends_at: string | null;
  last_renewed_at: string | null;
  billing_notes: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Provider-console view of a tenant. This is only ever produced by the
 * server-side admin API; browser sessions cannot query another workspace.
 */
export interface AdminWorkspace extends Workspace {
  owner_email: string | null;
  owner_name: string | null;
  member_count: number;
  document_count: number;
  can_write: boolean;
  access_label: string;
  days_left: number;
  subscription_days_left: number;
  subscription_expired: boolean;
}

export interface Membership {
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
  created_at: string;
}

export interface CurrentWorkspace {
  workspace: Workspace;
  membership: Membership;
  user: User;
}

export interface Category {
  id: string;
  workspace_id: string;
  name: string;
  slug: string;
  color: string;
  created_at: string;
}

export interface DocumentRecord {
  id: string;
  workspace_id: string;
  category_id: string | null;
  title: string;
  description: string | null;
  file_name: string | null;
  storage_bucket: string;
  storage_path: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  status: DocumentStatus;
  created_at: string;
  updated_at: string;
}
