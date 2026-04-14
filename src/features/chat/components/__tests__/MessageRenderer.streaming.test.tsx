import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MessageRenderer } from '../MessageRenderer';

/**
 * Regression tests for iOS message vibration bug during streaming.
 *
 * Root cause: `transition-all` on message bubbles caused layout animation jitter
 * on iOS WebKit when streaming content rapidly updated the bubble.
 *
 * Fix: Use `transition-colors` for non-streaming messages and `transition-none`
 * for streaming bubbles to eliminate layout animation conflicts.
 */
describe('MessageRenderer streaming transitions', () => {
  const baseMessage = {
    id: 'test-1',
    type: 'assistant' as const,
    content: 'Hello, this is a test message',
    timestamp: new Date().toISOString(),
  };

  it('should NOT use transition-all on message bubbles (prevents iOS jitter)', () => {
    const { container } = render(<MessageRenderer message={baseMessage} />);

    // Find the bubble wrapper div (has border and rounded classes)
    const bubbleElements = container.querySelectorAll('[class*="rounded-2xl"]');

    bubbleElements.forEach(el => {
      const classes = el.className;
      // transition-all causes layout animation jitter on iOS during streaming
      expect(classes).not.toContain('transition-all');
    });
  });

  it('should use transition-colors for non-streaming messages', () => {
    const { container } = render(<MessageRenderer message={baseMessage} />);

    const bubbleElements = container.querySelectorAll('[class*="rounded-2xl"]');
    const hasTransitionColors = Array.from(bubbleElements).some(el =>
      el.className.includes('transition-colors'),
    );

    expect(hasTransitionColors).toBe(true);
  });

  it('should use transition-none for streaming voice messages', () => {
    const streamingMessage = {
      ...baseMessage,
      isStreamingVoice: true,
    };

    const { container } = render(<MessageRenderer message={streamingMessage} />);

    const bubbleElements = container.querySelectorAll('[class*="rounded-2xl"]');
    const hasTransitionNone = Array.from(bubbleElements).some(el =>
      el.className.includes('transition-none'),
    );

    expect(hasTransitionNone).toBe(true);
  });

  it('should NOT use transition-colors for streaming voice messages', () => {
    const streamingMessage = {
      ...baseMessage,
      isStreamingVoice: true,
    };

    const { container } = render(<MessageRenderer message={streamingMessage} />);

    const bubbleElements = container.querySelectorAll('[class*="rounded-2xl"]');
    const hasTransitionColors = Array.from(bubbleElements).some(el =>
      el.className.includes('transition-colors'),
    );

    // Streaming messages should NOT have transition-colors (uses transition-none)
    expect(hasTransitionColors).toBe(false);
  });

  it('should render user streaming messages with transition-none', () => {
    const userStreamingMessage = {
      ...baseMessage,
      type: 'user' as const,
      isStreamingVoice: true,
    };

    const { container } = render(<MessageRenderer message={userStreamingMessage} />);

    const bubbleElements = container.querySelectorAll('[class*="rounded-2xl"]');
    const hasTransitionNone = Array.from(bubbleElements).some(el =>
      el.className.includes('transition-none'),
    );

    expect(hasTransitionNone).toBe(true);
  });
});
