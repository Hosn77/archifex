"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function signOut() {
    if (!isSupabaseConfigured()) {
      router.replace("/login");
      return;
    }

    setLoading(true);
    try {
      await createClient().auth.signOut();
      router.replace("/login");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button className="button button-ghost button-small" type="button" onClick={signOut} disabled={loading}>
      {loading ? "جارٍ الخروج..." : "تسجيل الخروج"}
    </button>
  );
}
