"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Category } from "@/lib/types";

interface DocumentCreateFormProps {
  categories: Category[];
  canWrite: boolean;
}

export function DocumentCreateForm({ categories, canWrite }: DocumentCreateFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          categoryId: categoryId || null,
        }),
      });

      const payload = (await response.json()) as { error?: string; code?: string };

      if (response.status === 402) {
        setError("انتهت التجربة المجانية. فعّل الاشتراك لإضافة مستندات جديدة.");
        return;
      }

      if (!response.ok) {
        setError(payload.error || "تعذر إنشاء المستند.");
        return;
      }

      setTitle("");
      setCategoryId("");
      setMessage("تم إنشاء سجل المستند داخل مساحة عملك.");
      router.refresh();
    } catch {
      setError("تعذر الاتصال بالخادم. حاول مرة أخرى.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="document-create" onSubmit={submit}>
      <div className="section-heading">
        <div>
          <span className="eyebrow">فهرسة سريعة</span>
          <h2>مستند جديد</h2>
        </div>
        <span className={`permission-pill${canWrite ? " permission-ok" : " permission-locked"}`}>
          {canWrite ? "الكتابة متاحة" : "الكتابة مقيدة"}
        </span>
      </div>

      {!canWrite ? (
        <p className="form-note form-note-locked">
          يمكنك تصفح الأرشيف، لكن إضافة المستندات وتعديل البيانات تتطلب اشتراكاً نشطاً.
          انتقل إلى الإعدادات لترقية المساحة.
        </p>
      ) : null}

      <label>
        <span>عنوان المستند</span>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="مثال: عقد توريد 2026"
          maxLength={240}
          required
          disabled={!canWrite || loading}
        />
      </label>

      <label>
        <span>التصنيف</span>
        <select
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
          disabled={!canWrite || loading}
        >
          <option value="">بدون تصنيف</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>

      <button className="button button-gold" type="submit" disabled={!canWrite || loading || !title.trim()}>
        {loading ? "جارٍ الحفظ..." : "إنشاء سجل المستند"}
      </button>

      {message ? <p className="form-success">{message}</p> : null}
      {error ? <p className="form-error">{error}</p> : null}
    </form>
  );
}
