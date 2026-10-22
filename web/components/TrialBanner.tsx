import Link from "next/link";
import type { TrialState } from "@/lib/trial";
import { formatArabicDate } from "@/lib/trial";

interface TrialBannerProps {
  trial: TrialState;
}

export function TrialBanner({ trial }: TrialBannerProps) {
  if (trial.isActiveSubscription) {
    return (
      <div className="trial-banner trial-banner-active" role="status">
        <span className="trial-dot" aria-hidden="true" />
        <div>
          <strong>اشتراك Archifex نشط</strong>
          <p>لديك وصول كامل للمساحة: الرفع، الفهرسة، التنظيم والقراءة.</p>
        </div>
      </div>
    );
  }

  if (trial.trialExpired) {
    return (
      <div className="trial-banner trial-banner-expired" role="alert">
        <span className="trial-dot" aria-hidden="true" />
        <div>
          <strong>انتهت فترة التجربة المجانية</strong>
          <p>
            القراءة والتصدير ما زالا متاحين، لكن الرفع وتعديل البيانات مقيدان حتى تفعيل الاشتراك.
            انتهت التجربة في {formatArabicDate(trial.endsAt)}.
          </p>
        </div>
        <Link className="button button-gold button-small" href="/settings#billing">
          ترقية المساحة
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
