export type PlanCode = 'BASIC' | 'STANDARD' | 'PREMIUM';

export type SchoolStatus = 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'SUSPENDED' | 'CANCELLED';

export type FeatureKey =
  | 'EMAIL_NOTIFICATIONS'
  | 'SMS_NOTIFICATIONS'
  | 'ONLINE_PAYMENTS'
  | 'MESSAGING'
  | 'TRANSPORT_TRACKING'
  | 'LIBRARY'
  | 'ANALYTICS'
  | 'MAX_STUDENTS';

export type PlatformRole = 'PLATFORM_ADMIN';

export type SignupRequestStatus = 'NEW' | 'APPROVED' | 'REJECTED';

export type AuditAction =
  | 'SIGNUP_REQUEST_APPROVED'
  | 'SIGNUP_REQUEST_REJECTED'
  | 'SCHOOL_STATUS_CHANGED'
  | 'SUBSCRIPTION_PLAN_CHANGED';

export interface PlatformAuthResponse {
  accessToken: string;
  refreshToken: string;
  platformRole: PlatformRole;
  mfaEnrolled: boolean;
}

export interface MfaEnrollResponse {
  secret: string;
  otpAuthUri: string;
}

export interface SignupRequestDto {
  id: string;
  schoolName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  desiredPlan: PlanCode;
  wantsEmail: boolean;
  wantsSms: boolean;
  status: SignupRequestStatus;
  createdAt: string;
}

export interface ProvisionResultDto {
  schoolId: string;
  schoolSlug: string;
  adminEmail: string;
}

export interface SchoolAdminDto {
  id: string;
  name: string;
  slug: string;
  status: SchoolStatus;
  createdAt: string;
}

export interface EntitlementDto {
  featureKey: FeatureKey;
  enabled: boolean;
  limitValue: number | null;
  currentUsage: number | null;
}

export interface SubscriptionAdminDto {
  schoolId: string;
  schoolName: string;
  planCode: PlanCode;
  planName: string;
  status: SchoolStatus;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  trialEndsAt: string | null;
  entitlements: EntitlementDto[];
}

export interface PlatformAnalyticsDto {
  totalSchools: number;
  schoolsByStatus: Partial<Record<SchoolStatus, number>>;
  schoolsByPlan: Partial<Record<PlanCode, number>>;
  totalActiveStudents: number;
  totalEmailsSentThisMonth: number;
  totalSmsSentThisMonth: number;
}

export interface PlatformSettingsDto {
  autoApproveSignups: boolean;
  paymentInstructions: string | null;
}

// --- Manual billing (Phase MT-5) ---
export type PaymentMethod = 'DEMAND_DRAFT' | 'CHEQUE' | 'NEFT';

export type PaymentClaimStatus = 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED';

export interface PlatformPaymentDto {
  id: string;
  schoolId: string;
  schoolName: string;
  amount: number;
  method: PaymentMethod;
  referenceNumber: string;
  periodStart: string;
  periodEnd: string;
  status: PaymentClaimStatus;
  submittedByEmail: string;
  submittedAt: string;
  verifiedAt: string | null;
  notes: string | null;
}

export interface SchoolUsageDto {
  schoolId: string;
  activeStudentCount: number;
  maxStudentsLimit: number | null;
  emailsSentThisMonth: number;
  smsSentThisMonth: number;
}

export interface AuditLogDto {
  id: string;
  actorEmail: string;
  action: AuditAction;
  targetSchoolId: string | null;
  summary: string;
  createdAt: string;
}

// --- Spring Data Page<T> (subset we actually use) ---
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number; // current page index (0-based)
  first: boolean;
  last: boolean;
  numberOfElements: number;
}
