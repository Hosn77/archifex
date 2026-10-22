import Link from "next/link";
import type { TrialState } from "@/lib/trial";
import { formatArabicDate } from "@/lib/trial";

interface TrialBannerProps {
  trial: TrialState;
}

export function TrialBanner({ trial }: TrialBannerProps) {
  if (trial.isActiveSubscription && !trial.subscriptionExpired) {
    return (
      <div className="trial-banner trial-banner-active" role="status">
        <span className="trial-dot" aria-hidden="true" />
        <div>
          <strong>اشتراك Archifex نشط</strong>
          <p>
            لديك وصول كامل للمساحة: الرفع، الفهرسة، التنظيم والقراءة.
            {trial.subscriptionEndsAt
              ? ` ينتهي الاشتراك في ${formatArabicDate(trial.subscriptionEndsAt)}.`
              : " الاشتراك نشط دون تاريخ انتهاء محدد."}
          </p>
        </div>
      </div>
    );
  }

  if (trial.subscriptionExpired || trial.trialExpired || trial.subscriptionInactive) {
    const title = trial.subscriptionExpired
      ? "انتهى الاشتراك"
      : trial.trialExpired
        ? "انتهت فترة التجربة المجانية"
        : "الاشتراك غير نشط";

    return (
      <div className="trial-banner trial-banner-expired" role="alert">
        <span className="trial-dot" aria-hidden="true" />
        <div>
          <strong>{title}</strong>
          <p>
            القراءة والتصدير ما زالا متاحين، لكن الرفع وتعديل البيانات مقيدان حتى تجديد
            الاشتراك.
            {trial.subscriptionExpired && trial.subscriptionEndsAt
              ? ` انتهى الاشتراك في ${formatArabicDate(trial.subscriptionEndsAt)}.`
              : trial.trialExpired
                ? ` انتهت التجربة في ${formatArabicDate(trial.endsAt)}.`
                : ""}
          </p>
        </div>
        <Link className="button button-gold button-small" href="/settings#billing">
          تجديد الاشتراك
        </Link>
      </div>
    );
  }

  return (
    <div className="trial-banner trial-banner-trial" role="status">
      <span className="trial-dot" aria-hidden="true" />
      <div>
        <strong>{trial.label}</strong>
        <p>
          تجربتك المجانية تنتهي في {formatArabicDate(trial.endsAt)}. بعد ذلك تبقى القراءة متاحة
          وتُقيد عمليات الرفع والتعديل حتى تفعيل الاشتراك.
        </p>
      </div>
      <Link className="button button-ghost button-small" href="/settings#billing">
        تفاصيل الاشتراك
      </Link>
    </div>
  );
}
