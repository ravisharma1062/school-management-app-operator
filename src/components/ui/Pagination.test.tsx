import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Pagination } from './Pagination';

describe('Pagination', () => {
  it('renders just a result count when there is one page or fewer', () => {
    render(<Pagination page={0} totalPages={1} totalElements={3} onPageChange={vi.fn()} />);
    expect(screen.getByText('3 results')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('uses singular "result" for a single element', () => {
    render(<Pagination page={0} totalPages={1} totalElements={1} onPageChange={vi.fn()} />);
    expect(screen.getByText('1 result')).toBeInTheDocument();
  });

  it('renders Previous/Next controls and page info across multiple pages', () => {
    render(<Pagination page={1} totalPages={5} totalElements={100} onPageChange={vi.fn()} />);
    expect(screen.getByText('Page 2 of 5 · 100 results')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled();
  });

  it('disables Previous on the first page and Next on the last page', () => {
    const { rerender } = render(
      <Pagination page={0} totalPages={3} totalElements={30} onPageChange={vi.fn()} />,
    );
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled();

    rerender(<Pagination page={2} totalPages={3} totalElements={30} onPageChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Previous' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });

  it('calls onPageChange with the adjacent page index', async () => {
    const onPageChange = vi.fn();
    const user = userEvent.setup();
    render(<Pagination page={1} totalPages={5} totalElements={100} onPageChange={onPageChange} />);

    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(onPageChange).toHaveBeenCalledWith(2);

    await user.click(screen.getByRole('button', { name: 'Previous' }));
    expect(onPageChange).toHaveBeenCalledWith(0);
  });
});
