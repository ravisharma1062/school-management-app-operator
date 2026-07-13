import type { ReactNode } from 'react';
import type { SchoolStatus, SignupRequestStatus } from '@/types';

type Tone = 'gray' | 'green' | 'red' | 'yellow' | 'blue' | 'purple';

const tones: Record<Tone, string> = {
  gray: 'bg-slate-100 text-slate-700 ring-slate-200',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  red: 'bg-red-50 text-red-700 ring-red-200',
  yellow: 'bg-amber-50 text-amber-700 ring-amber-200',
  blue: 'bg-sky-50 text-sky-700 ring-sky-200',
  purple: 'bg-purple-50 text-purple-700 ring-purple-200',
};

const dots: Record<Tone, string> = {
  gray: 'bg-slate-400',
  green: 'bg-emerald-500',
  red: 'bg-red-500',
  yellow: 'bg-amber-500',
  blue: 'bg-sky-500',
  purple: 'bg-purple-500',
};

export function Badge({ tone = 'gray', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${tones[tone]}`}
    >
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${dots[tone]}`} />
      {children}
    </span>
  );
}

const schoolStatusTone: Record<SchoolStatus, Tone> = {
  TRIAL: 'blue',
  ACTIVE: 'green',
  PAST_DUE: 'yellow',
  SUSPENDED: 'red',
  CANCELLED: 'gray',
};

export function SchoolStatusBadge({ status }: { status: SchoolStatus }) {
  return <Badge tone={schoolStatusTone[status]}>{status.replace('_', ' ')}</Badge>;
}

const signupStatusTone: Record<SignupRequestStatus, Tone> = {
  NEW: 'blue',
  APPROVED: 'green',
  REJECTED: 'red',
};

export function SignupStatusBadge({ status }: { status: SignupRequestStatus }) {
  return <Badge tone={signupStatusTone[status]}>{status}</Badge>;
}
