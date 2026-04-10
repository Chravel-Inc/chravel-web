/**
 * Shared voice types — used by useLiveKitVoice, VoiceLiveInline,
 * useVoiceToolHandler, and AIConciergeChat.
 *
 * Extracted from useGeminiLive.ts so the types survive Vertex AI cleanup.
 */

export type GeminiLiveState =
  | 'idle'
  | 'requesting_mic'
  | 'reconnecting'
  | 'ready'
  | 'listening'
  | 'sending'
  | 'playing'
  | 'interrupted'
  | 'error';

export interface VoiceDiagnostics {
  enabled: boolean;
  connectionStatus: 'idle' | 'connecting' | 'open' | 'closed' | 'error';
  audioContextState: AudioContextState | 'unavailable';
  audioSampleRate: number | null;
  inputEncoding: string;
  micPermission: PermissionState | 'unsupported' | 'unknown';
  micDeviceLabel: string | null;
  micRms: number;
  /** RMS of current playback audio (for overlay visualization) */
  playbackRms: number;
  wsCloseCode: number | null;
  wsCloseReason: string | null;
  reconnectAttempts: number;
  lastError: string | null;
  /** Substep label for incremental UI feedback */
  substep: string | null;
  metrics: {
    firstAudioChunkSentMs: number | null;
    firstTokenReceivedMs: number | null;
    firstAudioFramePlayedMs: number | null;
    cancelLatencyMs: number | null;
  };
}

export interface ToolCallRequest {
  name: string;
  args: Record<string, unknown>;
  id: string;
}

export interface ToolCallResult {
  name: string;
  result: Record<string, unknown>;
}

export interface VoiceConversationTurn {
  role: 'user' | 'assistant';
  text: string;
}
