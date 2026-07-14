import { fireEvent, render, screen } from '@testing-library/react';

import { PaginationControls } from '@/components/dashboard/PaginationControls';

describe('PaginationControls', () => {
  it('renders pagination controls when results exceed page size', () => {
    render(
      <PaginationControls
        currentPage={2}
        totalPages={3}
        totalCount={250}
        pageSize={100}
        hasNextPage
        hasPreviousPage
        onPageChange={jest.fn()}
        onNextPage={jest.fn()}
        onPreviousPage={jest.fn()}
      />
    );

    expect(screen.getByText(/Showing/)).toBeInTheDocument();
    expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();
  });

  it('calls navigation handlers', () => {
    const onNextPage = jest.fn();
    const onPreviousPage = jest.fn();
    const onPageChange = jest.fn();

    render(
      <PaginationControls
        currentPage={2}
        totalPages={5}
        totalCount={500}
        pageSize={100}
        hasNextPage
        hasPreviousPage
        onPageChange={onPageChange}
        onNextPage={onNextPage}
        onPreviousPage={onPreviousPage}
      />
    );

    fireEvent.click(screen.getByLabelText('Next page'));
    fireEvent.click(screen.getByLabelText('Previous page'));

    expect(onNextPage).toHaveBeenCalledTimes(1);
    expect(onPreviousPage).toHaveBeenCalledTimes(1);
  });

  it('supports jumping to a specific page', () => {
    const onPageChange = jest.fn();

    render(
      <PaginationControls
        currentPage={1}
        totalPages={5}
        totalCount={500}
        pageSize={100}
        hasNextPage
        hasPreviousPage={false}
        onPageChange={onPageChange}
        onNextPage={jest.fn()}
        onPreviousPage={jest.fn()}
      />
    );

    fireEvent.change(screen.getByLabelText('Jump to page'), {
      target: { value: '4' },
    });

    expect(onPageChange).toHaveBeenCalledWith(4);
  });

  it('returns null when all results fit on one page', () => {
    const { container } = render(
      <PaginationControls
        currentPage={1}
        totalPages={1}
        totalCount={50}
        pageSize={100}
        hasNextPage={false}
        hasPreviousPage={false}
        onPageChange={jest.fn()}
        onNextPage={jest.fn()}
        onPreviousPage={jest.fn()}
      />
    );

    expect(container.firstChild).toBeNull();
  });
});
