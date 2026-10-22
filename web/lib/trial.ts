import type { Workspace } from "./types";

export interface TrialState {
  canWrite: boolean;
  isActiveSubscription: boolean;
  isTrialing: boolean;
  trialExpired: boolean;
  subscriptionInactive: boolean;
  subscriptionExpired: boolean;
  daysLeft: number;
  subscriptionDaysLeft: number;
  endsAt: Date;
  subscriptionEndsAt: Date | null;
  label: string;
}

export function getTrialState(workspace: Workspace, now = new Date()): TrialState {
  const endsAt = new Date(workspace.trial_ends_at);
  const subscriptionEndsAt = workspace.subscription_ends_at
    ? new Date(workspace.subscription_ends_at)
    : null;
  const subscriptionEndsTime =
    subscriptionEndsAt && Number.isFinite(subscriptionEndsAt.getTime())
      ? subscriptionEndsAt.getTime()
      : null;

  const isActiveSubscription = workspace.subscription_status === "active";
  const isTrialing = workspace.subscription_status === "trialing";
  const trialExpired = isTrialing && now.getTime() > endsAt.getTime();
  const subscriptionExpired =
    isActiveSubscription &&
    subscriptionEndsTime !== null &&
    now.getTime() > subscriptionEndsTime;
  const subscriptionInactive = !isActiveSubscription && !isTrialing;

  const canWrite =
    (isActiveSubscription && !subscriptionExpired) ||
    (isTrialing && now.getTime() <= endsAt.getTime());

  const daysLeft = isTrialing
    ? Math.max(0, Math.ceil((endsAt.getTime() - now.getTime()) / 86_400_000))
    : 0;
  const subscriptionDaysLeft =
    isActiveSubscription && subscriptionEndsTime !== null
      ? Math.max(0, Math.ceil((subscriptionEndsTime - now.getTime()) / 86_400_000))
      : 0;

  let label = "الاشتراك غير نشط";
  if (isActiveSubscription && subscriptionExpired) label = "انتهى الاشتراك";
  else if (isActiveSubscription) label = "اشتراك نشط";
  else if (trialExpired) label = "انتهت التجربة المجانية";
  else if (isTrialing) label = `تجربة مجانية — ${daysLeft} يوم متبقٍ`;

  return {
    canWrite,
    isActiveSubscription,
    isTrialing,
    trialExpired,
    subscriptionInactive,
    subscriptionExpired,
    daysLeft,
    subscriptionDaysLeft,
    endsAt,
    subscriptionEndsAt,
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
