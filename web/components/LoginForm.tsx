"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

interface LoginFormProps {
  nextPath: string;
}

export function LoginForm({ nextPath }: LoginFormProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const safeNext = nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/dashboard";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!isSupabaseConfigured()) {
      setError("لم يتم ربط Supabase بعد. أضف متغيرات البيئة ثم أعد تشغيل التطبيق.");
      return;
    }

    if (password.length < 8) {
      setError("كلمة المرور يجب أن تكون 8 أحرف على الأقل.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();

      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName.trim(),
              organization_name: organizationName.trim(),
              locale: "ar",
            },
          },
        });

        if (signUpError) {
          setError(signUpError.message);
          return;
        }

        if (!data.session) {
          setSuccess("تم إنشاء الحساب. تحقق من بريدك الإلكتروني لتأكيد الحساب ثم سجّل الدخول.");
          return;
        }

        router.replace("/dashboard");
        router.refresh();
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      router.replace(safeNext);
      router.refresh();
    } catch {
      setError("تعذر الاتصال بخدمة المصادقة. تحقق من إعدادات Supabase.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-card">
      <div className="auth-heading">
        <span className="eyebrow">{mode === "login" ? "بوابة العملاء" : "تجربة 30 يوماً"}</span>
        <h1>{mode === "login" ? "تسجيل الدخول إلى Archifex" : "أنشئ مساحة أرشيف مستقلة"}</h1>
        <p>
          {mode === "login"
            ? "ادخل إلى مساحة مؤسستك المعزولة. كل استعلام محمي بـ RLS ولا يرى بيانات أي عميل آخر."
            : "كل مؤسسة تحصل على مساحة معزولة وفترة تجربة مجانية 30 يوماً تبدأ فور التسجيل."}
        </p>
      </div>

      <form className="auth-form" onSubmit={submit}>
        {mode === "signup" ? (
          <>
            <label>
              <span>اسم المؤسسة</span>
              <input
                value={organizationName}
                onChange={(event) => setOrganizationName(event.target.value)}
                placeholder="مثال: شركة الأفق للاستشارات"
                required
                minLength={2}
                maxLength={160}
                autoComplete="organization"
              />
            </label>
            <label>
              <span>الاسم الكامل</span>
              <input
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="الاسم الكامل"
                required
                autoComplete="name"
              />
            </label>
          </>
        ) : null}

        <label>
          <span>البريد الإلكتروني</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@company.com"
            required
            autoComplete="email"
            dir="ltr"
          />
        </label>

        <label>
          <span>كلمة المرور</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="8 أحرف على الأقل"
            required
            minLength={8}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            dir="ltr"
          />
        </label>

        <button className="button button-gold auth-submit" type="submit" disabled={loading}>
          {loading
            ? "جارٍ المعالجة..."
            : mode === "login"
              ? "دخول المساحة"
              : "إنشاء المساحة والتجربة"}
        </button>

        {error ? <p className="form-error" role="alert">{error}</p> : null}
        {success ? <p className="form-success" role="status">{success}</p> : null}
      </form>

      <div className="auth-switch">
        <span>{mode === "login" ? "مؤسسة جديدة على Archifex؟" : "لديك حساب بالفعل؟"}</span>
        <button
          type="button"
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setError(null);
            setSuccess(null);
          }}
        >
          {mode === "login" ? "ابدأ التجربة المجانية" : "تسجيل الدخول"}
        </button>
      </div>

      <p className="auth-legal">
        بالتسجيل أنت توافق على سياسة الاستخدام. تتم إدارة البيانات داخل مساحة معزولة تابعة لمؤسستك.
      </p>
    </div>
  );
}
