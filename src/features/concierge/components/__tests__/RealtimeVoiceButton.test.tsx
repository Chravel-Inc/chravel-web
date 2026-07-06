import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RealtimeVoiceButton } from '../RealtimeVoiceButton';

const startMock = vi.fn();
const stopMock = vi.fn();
const useRealtimeVoiceMock = vi.fn();

vi.mock('@/lib/featureFlags', () => ({
  useFeatureFlag: () => true,
}));

vi.mock('@/features/concierge/hooks/useRealtimeVoice', () => ({
  useRealtimeVoice: () => useRealtimeVoiceMock(),
}));

vi.mock('@/features/concierge/components/RealtimeVoiceOverlay', () => ({
  RealtimeVoiceOverlay: ({ onEnd }: { onEnd: () => void }) => (
    <button type="button" onClick={onEnd} aria-label="End voice session">
      Voice overlay
    </button>
  ),
}));

describe('RealtimeVoiceButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useRealtimeVoiceMock.mockReturnValue({
      phase: 'idle',
      isActive: false,
      isCapturing: false,
      isPlaying: false,
      errorMessage: null,
      turns: [],
      latestUserText: '',
      latestAssistantText: '',
      start: startMock,
      stop: stopMock,
    });
  });

  it('does not mount the realtime voice client until the waveform is tapped', async () => {
    render(<RealtimeVoiceButton tripId="trip-1" />);

    expect(screen.getByRole('button', { name: /start voice conversation/i })).toBeInTheDocument();
    expect(useRealtimeVoiceMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /start voice conversation/i }));

    await waitFor(() => expect(useRealtimeVoiceMock).toHaveBeenCalledTimes(1));
    expect(startMock).toHaveBeenCalledWith('trip-1');
  });

  it('does not start realtime voice when disabled', () => {
    render(<RealtimeVoiceButton tripId="trip-1" disabled />);

    fireEvent.click(screen.getByRole('button', { name: /start voice conversation/i }));

    expect(useRealtimeVoiceMock).not.toHaveBeenCalled();
    expect(startMock).not.toHaveBeenCalled();
  });
});
