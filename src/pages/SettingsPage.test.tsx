import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsPage } from './SettingsPage';
import { settingsApi } from '@/api/settings';
import { renderWithProviders } from '@/test/utils';
import type { PlatformSettingsDto } from '@/types';

vi.mock('@/api/settings', () => ({
  settingsApi: {
    get: vi.fn(),
    update: vi.fn(),
  },
}));

const mockedGet = vi.mocked(settingsApi.get);
const mockedUpdate = vi.mocked(settingsApi.update);

const baseSettings: PlatformSettingsDto = {
  autoApproveSignups: false,
  paymentInstructions: 'Pay to: Acme Corp',
};

describe('SettingsPage', () => {
  it('renders the toggle state and payment instructions from the fetched settings', async () => {
    mockedGet.mockResolvedValue(baseSettings);
    renderWithProviders(<SettingsPage />);

    const checkbox = await screen.findByRole('checkbox');
    expect(checkbox).not.toBeChecked();
    expect(screen.getByDisplayValue('Pay to: Acme Corp')).toBeInTheDocument();
  });

  it('toggling auto-approve calls update() with only that field', async () => {
    mockedGet.mockResolvedValue(baseSettings);
    mockedUpdate.mockResolvedValue({ ...baseSettings, autoApproveSignups: true });
    const user = userEvent.setup();
    renderWithProviders(<SettingsPage />);

    const checkbox = await screen.findByRole('checkbox');
    await user.click(checkbox);

    await waitFor(() => expect(mockedUpdate).toHaveBeenCalledWith({ autoApproveSignups: true }));
    expect(mockedUpdate).toHaveBeenCalledTimes(1);
  });

  it('saving payment instructions calls update() with only that field and shows a saved confirmation', async () => {
    mockedGet.mockResolvedValue(baseSettings);
    mockedUpdate.mockResolvedValue({ ...baseSettings, paymentInstructions: 'New instructions' });
    const user = userEvent.setup();
    renderWithProviders(<SettingsPage />);

    const textarea = await screen.findByDisplayValue('Pay to: Acme Corp');
    await user.clear(textarea);
    await user.type(textarea, 'New instructions');
    await user.click(screen.getByRole('button', { name: 'Save instructions' }));

    await waitFor(() =>
      expect(mockedUpdate).toHaveBeenCalledWith({ paymentInstructions: 'New instructions' }),
    );
    expect(mockedUpdate).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('Saved.')).toBeInTheDocument();
  });

  it('editing the textarea after a save clears the "Saved." confirmation', async () => {
    mockedGet.mockResolvedValue(baseSettings);
    mockedUpdate.mockResolvedValue({ ...baseSettings, paymentInstructions: 'New instructions' });
    const user = userEvent.setup();
    renderWithProviders(<SettingsPage />);

    const textarea = await screen.findByDisplayValue('Pay to: Acme Corp');
    await user.type(textarea, ' more');
    await user.click(screen.getByRole('button', { name: 'Save instructions' }));
    expect(await screen.findByText('Saved.')).toBeInTheDocument();

    await user.type(textarea, '!');

    expect(screen.queryByText('Saved.')).not.toBeInTheDocument();
  });

  it('shows a top-level error banner when a mutation fails', async () => {
    mockedGet.mockResolvedValue(baseSettings);
    mockedUpdate.mockRejectedValue(new Error('Settings are locked'));
    const user = userEvent.setup();
    renderWithProviders(<SettingsPage />);

    const checkbox = await screen.findByRole('checkbox');
    await user.click(checkbox);

    expect(await screen.findByRole('alert')).toHaveTextContent('Settings are locked');
  });

  it('renders an empty textarea when paymentInstructions is null', async () => {
    mockedGet.mockResolvedValue({ autoApproveSignups: false, paymentInstructions: null });
    renderWithProviders(<SettingsPage />);

    await screen.findByRole('checkbox');
    expect(screen.getByPlaceholderText(/Pay to:/)).toHaveValue('');
  });

  it('surfaces a load error with a retry affordance', async () => {
    mockedGet.mockRejectedValue(new Error('cannot load settings'));
    renderWithProviders(<SettingsPage />);

    expect(await screen.findByText('cannot load settings')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });
});
