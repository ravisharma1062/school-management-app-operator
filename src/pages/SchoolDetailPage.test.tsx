import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { render } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { SchoolDetailPage } from './SchoolDetailPage';
import { schoolsApi } from '@/api/schools';
import { subscriptionsApi } from '@/api/subscriptions';
import { createTestQueryClient } from '@/test/utils';
import type { SchoolAdminDto, SchoolUsageDto, SubscriptionAdminDto } from '@/types';

vi.mock('@/api/schools', () => ({
  schoolsApi: {
    list: vi.fn(),
    get: vi.fn(),
    updateStatus: vi.fn(),
    getUsage: vi.fn(),
  },
}));

vi.mock('@/api/subscriptions', () => ({
  subscriptionsApi: {
    get: vi.fn(),
    updatePlan: vi.fn(),
  },
}));

const mockedGetSchool = vi.mocked(schoolsApi.get);
const mockedUpdateStatus = vi.mocked(schoolsApi.updateStatus);
const mockedGetUsage = vi.mocked(schoolsApi.getUsage);
const mockedGetSubscription = vi.mocked(subscriptionsApi.get);
const mockedUpdatePlan = vi.mocked(subscriptionsApi.updatePlan);

const school: SchoolAdminDto = {
  id: 'sch-1',
  name: 'Acme School',
  slug: 'acme',
  status: 'ACTIVE',
  createdAt: '2026-01-01T00:00:00Z',
};

const subscription: SubscriptionAdminDto = {
  schoolId: 'sch-1',
  schoolName: 'Acme School',
  planCode: 'STANDARD',
  planName: 'Standard',
  status: 'ACTIVE',
  currentPeriodStart: '2026-01-01',
  currentPeriodEnd: '2026-02-01',
  trialEndsAt: null,
  entitlements: [
    { featureKey: 'MESSAGING', enabled: true, limitValue: null, currentUsage: null },
    { featureKey: 'MAX_STUDENTS', enabled: true, limitValue: 500, currentUsage: 120 },
  ],
};

const usage: SchoolUsageDto = {
  schoolId: 'sch-1',
  activeStudentCount: 120,
  maxStudentsLimit: 500,
  emailsSentThisMonth: 42,
  smsSentThisMonth: 7,
};

function renderAtSchool(id = 'sch-1') {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/schools/${id}`]}>
        <Routes>
          <Route path="/schools/:id" element={<SchoolDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('SchoolDetailPage', () => {
  it('renders school header, usage card, and entitlements once loaded', async () => {
    mockedGetSchool.mockResolvedValue(school);
    mockedGetSubscription.mockResolvedValue(subscription);
    mockedGetUsage.mockResolvedValue(usage);
    renderAtSchool();

    expect(await screen.findByRole('heading', { name: 'Acme School' })).toBeInTheDocument();
    expect(screen.getByText('Active students')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument(); // emails this month
    expect(screen.getByText('7')).toBeInTheDocument(); // sms this month
    expect(screen.getByText('MAX STUDENTS')).toBeInTheDocument();
    expect(screen.getByText('120 / 500')).toBeInTheDocument();
  });

  it('changing status calls updateStatus() with the selected value', async () => {
    mockedGetSchool.mockResolvedValue(school);
    mockedGetSubscription.mockResolvedValue(subscription);
    mockedGetUsage.mockResolvedValue(usage);
    mockedUpdateStatus.mockResolvedValue({ ...school, status: 'SUSPENDED' });
    const user = userEvent.setup();
    renderAtSchool();

    await screen.findByRole('heading', { name: 'Acme School' });
    await user.selectOptions(screen.getByLabelText(/New status/), 'SUSPENDED');
    await user.click(screen.getByRole('button', { name: 'Apply status change' }));

    await waitFor(() => expect(mockedUpdateStatus).toHaveBeenCalledWith('sch-1', 'SUSPENDED'));
  });

  it('the status Apply button is disabled until a different status is chosen', async () => {
    mockedGetSchool.mockResolvedValue(school);
    mockedGetSubscription.mockResolvedValue(subscription);
    mockedGetUsage.mockResolvedValue(usage);
    const user = userEvent.setup();
    renderAtSchool();

    await screen.findByRole('heading', { name: 'Acme School' });
    expect(screen.getByRole('button', { name: 'Apply status change' })).toBeDisabled();

    // Selecting the school's current status should also stay disabled.
    await user.selectOptions(screen.getByLabelText(/New status/), 'ACTIVE');
    expect(screen.getByRole('button', { name: 'Apply status change' })).toBeDisabled();
  });

  it('changing plan calls updatePlan() with the selected code', async () => {
    mockedGetSchool.mockResolvedValue(school);
    mockedGetSubscription.mockResolvedValue(subscription);
    mockedGetUsage.mockResolvedValue(usage);
    mockedUpdatePlan.mockResolvedValue({ ...subscription, planCode: 'PREMIUM' });
    const user = userEvent.setup();
    renderAtSchool();

    await screen.findByRole('heading', { name: 'Acme School' });
    await user.selectOptions(screen.getByLabelText(/Change plan/), 'PREMIUM');
    await user.click(screen.getByRole('button', { name: 'Change plan' }));

    await waitFor(() => expect(mockedUpdatePlan).toHaveBeenCalledWith('sch-1', 'PREMIUM'));
  });

  it('shows a status-change error banner on failure', async () => {
    mockedGetSchool.mockResolvedValue(school);
    mockedGetSubscription.mockResolvedValue(subscription);
    mockedGetUsage.mockResolvedValue(usage);
    mockedUpdateStatus.mockRejectedValue(new Error('Cannot suspend a school with an open invoice'));
    const user = userEvent.setup();
    renderAtSchool();

    await screen.findByRole('heading', { name: 'Acme School' });
    await user.selectOptions(screen.getByLabelText(/New status/), 'SUSPENDED');
    await user.click(screen.getByRole('button', { name: 'Apply status change' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Cannot suspend a school with an open invoice',
    );
  });

  it('renders an error state when the school fails to load', async () => {
    mockedGetSchool.mockRejectedValue(new Error('School not found'));
    mockedGetSubscription.mockResolvedValue(subscription);
    mockedGetUsage.mockResolvedValue(usage);
    renderAtSchool();

    expect(await screen.findByText('School not found')).toBeInTheDocument();
  });
});
