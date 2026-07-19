/**
 * @jest-environment jsdom
 */
import {
  emitTutorialAction,
  subscribeTutorialAction,
} from '@/lib/demo/tutorial-bus';

describe('tutorial-bus', () => {
  it('delivers actions to subscribers', () => {
    const handler = jest.fn();
    const unsubscribe = subscribeTutorialAction(handler);
    emitTutorialAction('search');
    expect(handler).toHaveBeenCalledWith('search');
    unsubscribe();
    emitTutorialAction('filter-niche');
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
