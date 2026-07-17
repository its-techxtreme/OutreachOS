import { render, screen } from '@testing-library/react';

import { MascotCallout } from '@/components/mascots/MascotCallout';
import { MASCOTS } from '@/lib/mascots';

describe('MascotCallout', () => {
  it('renders mascot tip copy for tutorials and empty states', () => {
    render(
      <MascotCallout mascot="adventurer" title="Blank page — for now">
        Import a sheet to fill your vault.
      </MascotCallout>
    );

    expect(screen.getByTestId('mascot-callout')).toHaveAttribute(
      'data-mascot',
      'adventurer'
    );
    expect(screen.getByText(/Rio says/i)).toBeInTheDocument();
    expect(screen.getByText('Blank page — for now')).toBeInTheDocument();
    expect(
      screen.getByText('Import a sheet to fill your vault.')
    ).toBeInTheDocument();
    expect(screen.getByAltText(MASCOTS.adventurer.vibe)).toBeInTheDocument();
  });
});
