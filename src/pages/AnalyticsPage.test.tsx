import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { AnalyticsPage } from './AnalyticsPage';
import { analyticsApi } from '@/api/analytics';
import { renderWithProviders } from '@/test/utils';
import type { PlatformAnalyticsDto } from '@/types';

vi.mock('@/api/analytics', () => ({
  analyticsApi: {
    get: vi.fn(),
  },
}));

const mockedGet = vi.mocked(analyticsApi.get);

const analytics: PlatformAnalyticsDto = {
  totalSchools: 12,
  schoolsByStatus: { ACTIVE: 9, TRIAL: 2, SUSPENDED: 1 },
  schoolsByPlan: { BASIC: 5, STANDARD: 4, PREMIUM: 3 },
  totalActiveStudents: 3456,
  totalEmailsSentThisMonth: 789,
  totalSmsSentThisMonth: 101,
};

describe('AnalyticsPage', () => {
  it('renders the top-line stat tiles', async () => {
    mockedGet.mockResolvedValue(analytics);
    renderWithProviders(<AnalyticsPage />);

    expect(await screen.findByText('12')).toBeInTheDocument();
    expect(screen.getByText('3456')).toBeInTheDocument();
    expect(screen.getByText('789')).toBeInTheDocument();
    expect(screen.getByText('101')).toBeInTheDocument();
  });

  it('renders the by-status and by-plan breakdowns', async () => {
    mockedGet.mockResolvedValue(analytics);
    renderWithProviders(<AnalyticsPage />);

    await screen.findByText('12');
    expect(screen.getByText('ACTIVE')).toBeInTheDocument();
    expect(screen.getByText('9')).toBeInTheDocument();
    expect(screen.getByText('TRIAL')).toBeInTheDocument();
    expect(screen.getByText('BASIC')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('surfaces a load error with a retry affordance', async () => {
    mockedGet.mockRejectedValue(new Error('analytics unavailable'));
    renderWithProviders(<AnalyticsPage />);

    expect(await screen.findByText('analytics unavailable')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });
});
