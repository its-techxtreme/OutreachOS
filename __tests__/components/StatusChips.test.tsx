import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { StatusChips } from '@/components/dashboard/StatusChips';

describe('StatusChips', () => {
  it('renders all statuses and fires onChange', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<StatusChips value="New" onChange={onChange} />);

    expect(screen.getByTestId('status-chips')).toBeInTheDocument();
    await user.click(screen.getByTestId('status-chip-Called'));
    expect(onChange).toHaveBeenCalledWith('Called');
  });
});
