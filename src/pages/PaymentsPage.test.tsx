import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PaymentsPage } from './PaymentsPage';
import { paymentsApi } from '@/api/payments';
import { renderWithProviders } from '@/test/utils';
import type { PlatformPaymentDto } from '@/types';

vi.mock('@/api/payments', () => ({
  paymentsApi: {
    listPending: vi.fn(),
    verify: vi.fn(),
    reject: vi.fn(),
  },
}));

const mockedListPending = vi.mocked(paymentsApi.listPending);
const mockedVerify = vi.mocked(paymentsApi.verify);
const mockedReject = vi.mocked(paymentsApi.reject);

const claim: PlatformPaymentDto = {
  id: 'pay-1',
  schoolId: 'sch-1',
  schoolName: 'Acme School',
  amount: 25000,
  method: 'NEFT',
  referenceNumber: 'REF123',
  periodStart: '2026-01-01',
  periodEnd: '2026-01-31',
  status: 'PENDING_VERIFICATION',
  submittedByEmail: 'billing@acme.example',
  submittedAt: '2026-01-02T00:00:00Z',
  verifiedAt: null,
  notes: null,
};

describe('PaymentsPage', () => {
  it('shows an empty state when nothing is pending', async () => {
    mockedListPending.mockResolvedValue([]);
    renderWithProviders(<PaymentsPage />);

    expect(await screen.findByText('No payments awaiting verification')).toBeInTheDocument();
  });

  it('renders the pending claims list', async () => {
    mockedListPending.mockResolvedValue([claim]);
    renderWithProviders(<PaymentsPage />);

    expect(await screen.findByText('Acme School')).toBeInTheDocument();
    expect(screen.getByText('₹25,000')).toBeInTheDocument();
    expect(screen.getByText('NEFT')).toBeInTheDocument();
    expect(screen.getByText('REF123')).toBeInTheDocument();
    expect(screen.getByText('billing@acme.example')).toBeInTheDocument();
  });

  it('verify flow: opens modal, submits notes, calls verify() with the claim id and notes', async () => {
    mockedListPending.mockResolvedValue([claim]);
    mockedVerify.mockResolvedValue({ ...claim, status: 'VERIFIED' });
    const user = userEvent.setup();
    renderWithProviders(<PaymentsPage />);

    await user.click(await screen.findByRole('button', { name: 'Verify' }));

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Verify payment from Acme School')).toBeInTheDocument();

    await user.type(within(dialog).getByLabelText(/Notes/), 'Matches bank statement');
    await user.click(within(dialog).getByRole('button', { name: 'Confirm verification' }));

    await waitFor(() =>
      expect(mockedVerify).toHaveBeenCalledWith('pay-1', 'Matches bank statement'),
    );
    expect(mockedReject).not.toHaveBeenCalled();
  });

  it('reject flow: opens modal, submits a reason, calls reject() with the claim id and reason', async () => {
    mockedListPending.mockResolvedValue([claim]);
    mockedReject.mockResolvedValue({ ...claim, status: 'REJECTED' });
    const user = userEvent.setup();
    renderWithProviders(<PaymentsPage />);

    await user.click(await screen.findByRole('button', { name: 'Reject' }));

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Reject payment from Acme School')).toBeInTheDocument();

    await user.type(within(dialog).getByLabelText(/Reason/), "Reference doesn't match");
    await user.click(within(dialog).getByRole('button', { name: 'Confirm rejection' }));

    await waitFor(() =>
      expect(mockedReject).toHaveBeenCalledWith('pay-1', "Reference doesn't match"),
    );
    expect(mockedVerify).not.toHaveBeenCalled();
  });

  it('shows the mutation error inside the modal on failure and keeps it open', async () => {
    mockedListPending.mockResolvedValue([claim]);
    mockedVerify.mockRejectedValue(new Error('Claim already decided'));
    const user = userEvent.setup();
    renderWithProviders(<PaymentsPage />);

    await user.click(await screen.findByRole('button', { name: 'Verify' }));
    await user.click(screen.getByRole('button', { name: 'Confirm verification' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Claim already decided');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('closing the modal via Cancel does not call verify or reject', async () => {
    mockedListPending.mockResolvedValue([claim]);
    const user = userEvent.setup();
    renderWithProviders(<PaymentsPage />);

    await user.click(await screen.findByRole('button', { name: 'Verify' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(mockedVerify).not.toHaveBeenCalled();
  });
});
