/**
 * @jest-environment jsdom
 */
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

import { DemoTutorialOverlay } from '@/components/dashboard/DemoTutorialOverlay';
import { emitTutorialAction } from '@/lib/demo/tutorial-bus';
import { DEMO_TUTORIAL_STORAGE_KEY } from '@/lib/demo/tutorial-steps';
import { useAuth } from '@/lib/hooks/useAuth';

jest.mock('@/lib/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/lib/sound', () => ({
  playSound: jest.fn(),
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: { alt: string }) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={props.alt} />;
  },
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

function mockDemoUser() {
  mockUseAuth.mockReturnValue({
    user: {
      id: 'demo-1',
      app_metadata: { roles: ['demo'] },
      user_metadata: { username: 'demo_vault' },
    } as never,
    session: {} as never,
    loading: false,
    error: null,
    isAuthenticated: true,
    signIn: jest.fn(),
    signUp: jest.fn(),
    signInWithGoogle: jest.fn(),
    linkGoogleIdentity: jest.fn(),
    signInAsDemo: jest.fn(),
    signOut: jest.fn(),
    resetPassword: jest.fn(),
    updatePassword: jest.fn(),
    clearError: jest.fn(),
  });
}

describe('DemoTutorialOverlay', () => {
  beforeEach(() => {
    window.localStorage.clear();
    mockDemoUser();
    document.body.innerHTML = '';
  });

  it('starts a quest and gates progress until the control is used', async () => {
    const metrics = document.createElement('div');
    metrics.setAttribute('data-tutorial', 'metrics');
    Object.defineProperty(metrics, 'getBoundingClientRect', {
      value: () => ({
        top: 80,
        left: 40,
        width: 300,
        height: 90,
        bottom: 170,
        right: 340,
        x: 40,
        y: 80,
        toJSON: () => ({}),
      }),
    });
    document.body.appendChild(metrics);

    render(<DemoTutorialOverlay />);
    expect(screen.getByTestId('demo-tutorial')).toBeInTheDocument();
    expect(screen.getByTestId('demo-tutorial-speech')).toHaveTextContent(
      /vault guide/i
    );

    fireEvent.click(screen.getByTestId('demo-tutorial-next'));
    await waitFor(() => {
      expect(screen.getByTestId('demo-tutorial-hint')).toHaveTextContent(
        /Click the metrics panel/i
      );
    });
    await waitFor(() => {
      expect(screen.getByTestId('demo-tutorial-spotlight')).toBeInTheDocument();
    });
    expect(screen.getByTestId('demo-tutorial-next')).toBeDisabled();
    expect(screen.getByTestId('demo-tutorial-pointer')).toBeInTheDocument();

    act(() => {
      emitTutorialAction('view-metrics');
    });
    expect(screen.getByTestId('demo-tutorial-checkpoint')).toHaveTextContent(
      /Checkpoint/i
    );
  });

  it('does not render for non-demo users', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: 'user-1',
        app_metadata: { roles: ['user'] },
        user_metadata: { username: 'rio' },
      } as never,
      session: {} as never,
      loading: false,
      error: null,
      isAuthenticated: true,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signInWithGoogle: jest.fn(),
      linkGoogleIdentity: jest.fn(),
      signInAsDemo: jest.fn(),
      signOut: jest.fn(),
      resetPassword: jest.fn(),
      updatePassword: jest.fn(),
      clearError: jest.fn(),
    });
    const { container } = render(<DemoTutorialOverlay />);
    expect(container).toBeEmptyDOMElement();
  });

  it('stays closed when tutorial already completed', () => {
    window.localStorage.setItem(DEMO_TUTORIAL_STORAGE_KEY, '1');
    const { container } = render(<DemoTutorialOverlay />);
    expect(container).toBeEmptyDOMElement();
  });
});
