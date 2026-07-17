import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SignupQueuePage } from './SignupQueuePage';
import { signupRequestsApi } from '@/api/signupRequests';
import { renderWithProviders } from '@/test/utils';
import type { Page, SignupRequestDto } from '@/types';

vi.mock('@/api/signupRequests', () => ({
  signupRequestsApi: {
    list: vi.fn(),
    get: vi.fn(),
    approve: vi.fn(),
    reject: vi.fn(),
  },
}));

const mockedList = vi.mocked(signupRequestsApi.list);
const mockedApprove = vi.mocked(signupRequestsApi.approve);
const mockedReject = vi.mocked(signupRequestsApi.reject);

function pageOf(content: SignupRequestDto[]): Page<SignupRequestDto> {
  return {
    content,
    totalElements: content.length,
    totalPages: 1,
    size: 20,
    number: 0,
    first: true,
    last: true,
    numberOfElements: content.length,
  };
}

const newRequest: SignupRequestDto = {
  id: 'sr-1',
  schoolName: 'Acme School',
  contactName: 'Jane Doe',
  contactEmail: 'jane@acme.example',
  contactPhone: null,
  desiredPlan: 'STANDARD',
  wantsEmail: true,
  wantsSms: false,
  status: 'NEW',
  createdAt: '2026-01-01T00:00:00Z',
};

describe('SignupQueuePage', () => {
  it('shows an empty state when there are no requests', async () => {
    mockedList.mockResolvedValue(pageOf([]));
    renderWithProviders(<SignupQueuePage />);

    expect(await screen.findByText('No signup requests yet')).toBeInTheDocument();
  });

  it('renders the request list with plan, channels, and status', async () => {
    mockedList.mockResolvedValue(pageOf([newRequest]));
    renderWithProviders(<SignupQueuePage />);

    expect(await screen.findByText('Acme School')).toBeInTheDocument();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('jane@acme.example')).toBeInTheDocument();
    expect(screen.getByText('STANDARD')).toBeInTheDocument();
    expect(screen.getByText('NEW')).toBeInTheDocument();
  });

  it('does not render Approve/Reject actions for non-NEW requests', async () => {
    mockedList.mockResolvedValue(pageOf([{ ...newRequest, status: 'APPROVED' }]));
    renderWithProviders(<SignupQueuePage />);

    await screen.findByText('Acme School');
    expect(screen.queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reject' })).not.toBeInTheDocument();
  });

  it('opens the approve modal pre-filled with the desired plan and calls approve() on confirm', async () => {
    mockedList.mockResolvedValue(pageOf([newRequest]));
    mockedApprove.mockResolvedValue({
      schoolId: 'sch-1',
      schoolSlug: 'acme',
      adminEmail: 'jane@acme.example',
    });
    const user = userEvent.setup();
    renderWithProviders(<SignupQueuePage />);

    await user.click(await screen.findByRole('button', { name: 'Approve' }));

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Approve Acme School')).toBeInTheDocument();
    expect(within(dialog).getByLabelText(/Plan/)).toHaveValue('STANDARD');

    await user.click(within(dialog).getByRole('button', { name: 'Provision school' }));

    await waitFor(() =>
      expect(mockedApprove).toHaveBeenCalledWith('sr-1', 'STANDARD', true),
    );
  });

  it('shows the mutation error inside the approve modal on failure', async () => {
    mockedList.mockResolvedValue(pageOf([newRequest]));
    mockedApprove.mockRejectedValue(new Error('School slug already taken'));
    const user = userEvent.setup();
    renderWithProviders(<SignupQueuePage />);

    await user.click(await screen.findByRole('button', { name: 'Approve' }));
    await user.click(screen.getByRole('button', { name: 'Provision school' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('School slug already taken');
  });

  it('calls reject() directly without a confirmation modal', async () => {
    mockedList.mockResolvedValue(pageOf([newRequest]));
    mockedReject.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderWithProviders(<SignupQueuePage />);

    await user.click(await screen.findByRole('button', { name: 'Reject' }));

    await waitFor(() => expect(mockedReject).toHaveBeenCalledWith('sr-1'));
  });

  it('surfaces a list-load error with a retry affordance', async () => {
    mockedList.mockRejectedValue(new Error('network down'));
    renderWithProviders(<SignupQueuePage />);

    expect(await screen.findByText('network down')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });
});
