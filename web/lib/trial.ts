import type { Workspace } from "./types";

export interface TrialState {
  canWrite: boolean;
  isActiveSubscription: boolean;
  isTrialing: boolean;
  trialExpired: boolean;
  daysLeft: number;
  endsAt: Date;
  label: string;
}

export function getTrialState(workspace: Workspace, now = new Date()): TrialState {
  const endsAt = new Date(workspace.trial_ends_at);
  const isActiveSubscription = workspace.subscription_status === "active";
  const isTrialing = workspace.subscription_status === "trialing";
  const trialExpired = isTrialing && now.getTime() > endsAt.getTime();
  const canWrite =
    isActiveSubscription ||
    (isTrialing && now.getTime() <= endsAt.getTime());
  const daysLeft = isTrialing
    ? Math.max(0, Math.ceil((endsAt.getTime() - now.getTime()) / 86_400_000))
    : 0;

  let label = "الاشتراك غير نشط";
  if (isActiveSubscription) label = "اشتراك نشط";
  else if (isTrialing && !trialExpired) label = `تجربة مجانية — ${daysLeft} يوم متبقٍ`;
  else if (trialExpired) label = "انتهت التجربة المجانية";

  return {
    canWrite,
    isActiveSubscription,
    isTrialing,
    trialExpired,
    daysLeft,
    endsAt,
    label,
  };
}

export function formatArabicDate(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}
