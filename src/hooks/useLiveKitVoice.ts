/**
 * useLiveKitVoice — Frontend hook for LiveKit-based voice concierge.
 *
 * Replaces useGeminiLive.ts (1454 lines → ~250 lines). Manages:
 * - LiveKit room lifecycle (connect, disconnect)
 * - Token fetching from livekit-token edge function
 * - Agent audio track subscription (playback handled by WebRTC)
 * - Local mic track publishing (capture handled by WebRTC)
 * - Data message handling (transcripts, rich cards, turn completion)
 * - State mapping to GeminiLiveState-compatible types
 *
 * Returns the same interface as useGeminiLive so AIConciergeChat.tsx
 * can swap between hooks without UI changes.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type {
  GeminiLiveState,
  VoiceDiagnostics,
  VoiceConversationTurn,
  ToolCallResult,
} from './useGeminiLive';
import { LIVEKIT_WS_URL } from '@/config/voiceFeatureFlags';
import * as circuitBreaker from '@/voice/circuitBreaker';
import { supabase } from '@/integrations/supabase/client';

// ── Types ──────────────────────────────────────────────────────────────────────

interface UseLiveKitVoiceOptions {
  tripId: string;
  voice?: string;
  onTurnComplete?: (
    userText: string,
    assistantText: string,
    toolResults?: ToolCallResult[],
  ) => void;
  onRichCard?: (toolName: string, cardData: Record<string, unknown>) => void;
  onError?: (message: string) => void;
  onCircuitBreakerOpen?: () => void;
}

interface UseLiveKitVoiceReturn {
  state: GeminiLiveState;
  error: string | null;
  userTranscript: string;
  assistantTranscript: string;
  conversationHistory: VoiceConversationTurn[];
  diagnostics: VoiceDiagnostics;
  startSession: () => Promise<void>;
  endSession: () => Promise<void>;
  interruptPlayback: () => void;
  sendImage: (mimeType: string, base64Data: string) => void;
  isSupported: boolean;
  circuitBreakerOpen: boolean;
  resetCircuitBreaker: () => void;
}

// ── LiveKit imports (dynamic to avoid bundling when unused) ─────────────────

let Room: typeof import('livekit-client').Room | null = null;
let RoomEvent: typeof import('livekit-client').RoomEvent | null = null;
let Track: typeof import('livekit-client').Track | null = null;

async function ensureLiveKitLoaded(): Promise<void> {
  if (Room) return;
  const lk = await import('livekit-client');
  Room = lk.Room;
  RoomEvent = lk.RoomEvent;
  Track = lk.Track;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const AGENT_JOIN_TIMEOUT_MS = 10_000;

const decoder = new TextDecoder();

// ── Default diagnostics ────────────────────────────────────────────────────────

function defaultDiagnostics(): VoiceDiagnostics {
  return {
    enabled: true,
    connectionStatus: 'idle',
    audioContextState: 'unavailable',
    audioSampleRate: null,
    inputEncoding: 'opus',
    micPermission: 'unknown',
    micDeviceLabel: null,
    micRms: 0,
    playbackRms: 0,
    wsCloseCode: null,
    wsCloseReason: null,
    reconnectAttempts: 0,
    lastError: null,
    substep: null,
    metrics: {
      firstAudioChunkSentMs: null,
      firstTokenReceivedMs: null,
      firstAudioFramePlayedMs: null,
      cancelLatencyMs: null,
    },
  };
}

// ── Hook ───────────────────────────────────────────────────────────────────────

export function useLiveKitVoice(options: UseLiveKitVoiceOptions): UseLiveKitVoiceReturn {
  const {
    tripId,
    voice = 'Charon',
    onTurnComplete,
    onRichCard,
    onError,
    onCircuitBreakerOpen,
  } = options;

  const [state, setState] = useState<GeminiLiveState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [userTranscript, setUserTranscript] = useState('');
  const [assistantTranscript, setAssistantTranscript] = useState('');
  const [conversationHistory, setConversationHistory] = useState<VoiceConversationTurn[]>([]);
  const [diagnostics, setDiagnostics] = useState<VoiceDiagnostics>(defaultDiagnostics);
  const [circuitBreakerOpen, setCircuitBreakerOpen] = useState(circuitBreaker.isOpen());

  const roomRef = useRef<InstanceType<typeof import('livekit-client').Room> | null>(null);
  const sessionActiveRef = useRef(false);

  // Accumulated turn data for onTurnComplete
  const turnUserTextRef = useRef('');
  const turnAssistantTextRef = useRef('');
  const onTurnCompleteRef = useRef(onTurnComplete);
  const onRichCardRef = useRef(onRichCard);

  useEffect(() => {
    onTurnCompleteRef.current = onTurnComplete;
  }, [onTurnComplete]);

  useEffect(() => {
    onRichCardRef.current = onRichCard;
  }, [onRichCard]);

  // ── Data Message Handler ─────────────────────────────────────────────────

  const handleDataMessage = useCallback(
    (payload: Uint8Array, _participant: unknown, topic?: string) => {
      try {
        const msg = JSON.parse(decoder.decode(payload));

        switch (topic) {
          case 'transcript':
            if (msg.role === 'user') {
              setUserTranscript(msg.text);
              if (msg.isFinal) {
                turnUserTextRef.current = msg.text;
                setConversationHistory(prev => [...prev, { role: 'user', text: msg.text }]);
              }
            } else if (msg.role === 'assistant') {
              setAssistantTranscript(msg.text);
              if (msg.isFinal) {
                turnAssistantTextRef.current = msg.text;
                setConversationHistory(prev => [...prev, { role: 'assistant', text: msg.text }]);
              }
            }
            break;

          case 'turn_complete':
            onTurnCompleteRef.current?.(
              turnUserTextRef.current || msg.userText,
              turnAssistantTextRef.current || msg.assistantText,
              msg.toolResults,
            );
            // Reset for next turn
            turnUserTextRef.current = '';
            turnAssistantTextRef.current = '';
            setUserTranscript('');
            setAssistantTranscript('');
            break;

          case 'rich_card':
            onRichCardRef.current?.(msg.toolName, msg.cardData);
            break;

          case 'agent_state':
            if (msg.state === 'speaking') setState('playing');
            else if (msg.state === 'thinking' || msg.state === 'executing_tool')
              setState('sending');
            else if (msg.state === 'idle') setState('listening');
            break;

          case 'error':
            // Agent-side error (e.g., Gemini API failure, tool execution crash)
            setError(msg.message || 'Agent encountered an error');
            setState('error');
            setDiagnostics(prev => ({
              ...prev,
              connectionStatus: 'error',
              lastError: msg.message,
            }));
            onError?.(msg.message || 'Agent encountered an error');
            circuitBreaker.recordFailure(msg.message || 'agent_error');
            break;
        }
      } catch {
        // Ignore malformed data messages
      }
    },
    [],
  );

  // ── Start Session ────────────────────────────────────────────────────────

  const startSession = useCallback(async () => {
    if (sessionActiveRef.current) return;
    if (circuitBreaker.isOpen()) {
      setCircuitBreakerOpen(true);
      onCircuitBreakerOpen?.();
      return;
    }

    try {
      sessionActiveRef.current = true;
      setState('requesting_mic');
      setError(null);
      setDiagnostics(prev => ({
        ...prev,
        connectionStatus: 'connecting',
        substep: 'Requesting token',
      }));

      // ── Fetch LiveKit token ──────────────────────────────────────────────
      const {
        data: { session: authSession },
      } = await supabase.auth.getSession();
      if (!authSession?.access_token) {
        throw new Error('Not authenticated');
      }

      const tokenRes = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL || ''}/functions/v1/livekit-token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authSession.access_token}`,
          },
          body: JSON.stringify({ tripId, voice }),
        },
      );

      if (!tokenRes.ok) {
        const errBody = await tokenRes.json().catch(() => ({}));
        throw new Error(errBody.error || `Token request failed: ${tokenRes.status}`);
      }

      const { token, wsUrl } = await tokenRes.json();
      setDiagnostics(prev => ({ ...prev, substep: 'Loading LiveKit' }));

      // ── Dynamic import LiveKit ───────────────────────────────────────────
      await ensureLiveKitLoaded();

      setDiagnostics(prev => ({ ...prev, substep: 'Connecting to room' }));

      // ── Create and connect room ──────────────────────────────────────────
      const room = new Room!({
        adaptiveStream: true,
        dynacast: true,
      });
      roomRef.current = room;

      // Listen for data messages from agent
      room.on(RoomEvent!.DataReceived, handleDataMessage);

      // Track agent join - use isAgent property set by LiveKit SDK
      // isAgent checks participant.kind === ParticipantKind.AGENT (value 4)
      let agentJoined = false;

      // Helper to check if participant is an agent
      // Primary: isAgent property (SDK v2+)
      // Fallback: identity prefix (server naming convention)
      const isAgentParticipant = (p: unknown): boolean => {
        const participant = p as { isAgent?: boolean; identity?: string };
        return participant.isAgent === true || participant.identity?.startsWith('agent-') === true;
      };

      room.on(RoomEvent!.ParticipantConnected, participant => {
        if (isAgentParticipant(participant)) {
          agentJoined = true;
          setState('listening');
          setDiagnostics(prev => ({
            ...prev,
            connectionStatus: 'open',
            substep: null,
          }));
          circuitBreaker.recordSuccess();
        }
      });

      // Handle disconnection with exponential backoff reconnect
      room.on(RoomEvent!.Disconnected, async () => {
        if (!sessionActiveRef.current) return;

        // Attempt reconnect up to 3 times with exponential backoff (2s, 4s, 8s)
        const MAX_RECONNECT_ATTEMPTS = 3;
        for (let attempt = 0; attempt < MAX_RECONNECT_ATTEMPTS; attempt++) {
          if (!sessionActiveRef.current) return; // user ended session during backoff
          setState('reconnecting');
          setDiagnostics(prev => ({
            ...prev,
            connectionStatus: 'connecting',
            substep: `Reconnecting (attempt ${attempt + 1}/${MAX_RECONNECT_ATTEMPTS})`,
          }));

          const delay = Math.pow(2, attempt + 1) * 1000; // 2s, 4s, 8s
          await new Promise(resolve => setTimeout(resolve, delay));

          if (!sessionActiveRef.current) return;

          try {
            await room.connect(wsUrl || LIVEKIT_WS_URL, token);
            await room.localParticipant.setMicrophoneEnabled(true);
            setState('ready');
            setDiagnostics(prev => ({
              ...prev,
              connectionStatus: 'open',
              substep: null,
            }));
            return; // reconnected successfully
          } catch {
            // continue to next attempt
          }
        }

        // All reconnect attempts failed
        setState('error');
        sessionActiveRef.current = false;
        setDiagnostics(prev => ({
          ...prev,
          connectionStatus: 'error',
          lastError: 'Connection lost. Please try again.',
          substep: null,
        }));
        onError?.('Connection lost. Please try again.');
        circuitBreaker.recordFailure('reconnect_failed');
        if (circuitBreaker.isOpen()) {
          setCircuitBreakerOpen(true);
          onCircuitBreakerOpen?.();
        }
      });

      // Connect
      await room.connect(wsUrl || LIVEKIT_WS_URL, token);
      setDiagnostics(prev => ({ ...prev, substep: 'Enabling microphone' }));

      // Enable local mic (WebRTC handles capture, encoding, echo cancellation)
      await room.localParticipant.setMicrophoneEnabled(true);
      setState('ready');
      setDiagnostics(prev => ({ ...prev, substep: 'Waiting for agent', micPermission: 'granted' }));

      // Wait for agent to join with timeout
      if (!agentJoined) {
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Agent did not join within timeout'));
          }, AGENT_JOIN_TIMEOUT_MS);

          room.on(RoomEvent!.ParticipantConnected, participant => {
            if (isAgentParticipant(participant)) {
              clearTimeout(timeout);
              agentJoined = true;
              setState('listening');
              setDiagnostics(prev => ({
                ...prev,
                connectionStatus: 'open',
                substep: null,
              }));
              circuitBreaker.recordSuccess();
              resolve();
            }
          });

          // Check if agent already joined during connection
          for (const [, p] of room.remoteParticipants) {
            if (isAgentParticipant(p)) {
              clearTimeout(timeout);
              agentJoined = true;
              setState('listening');
              setDiagnostics(prev => ({
                ...prev,
                connectionStatus: 'open',
                substep: null,
              }));
              circuitBreaker.recordSuccess();
              resolve();
              return;
            }
          }
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to start voice session';
      setError(msg);
      setState('error');
      setDiagnostics(prev => ({
        ...prev,
        connectionStatus: 'error',
        lastError: msg,
        substep: null,
      }));
      onError?.(msg);
      circuitBreaker.recordFailure(msg);
      if (circuitBreaker.isOpen()) {
        setCircuitBreakerOpen(true);
        onCircuitBreakerOpen?.();
      }
      sessionActiveRef.current = false;
      // Clean up room if it was created
      if (roomRef.current) {
        try {
          roomRef.current.disconnect();
        } catch {
          // ignore
        }
        roomRef.current = null;
      }
    }
  }, [tripId, voice, handleDataMessage, onError, onCircuitBreakerOpen]);

  // ── End Session ──────────────────────────────────────────────────────────

  const endSession = useCallback(async () => {
    sessionActiveRef.current = false;
    if (roomRef.current) {
      try {
        roomRef.current.disconnect();
      } catch {
        // ignore
      }
      roomRef.current = null;
    }
    setState('idle');
    setDiagnostics(prev => ({ ...prev, connectionStatus: 'closed', substep: null }));
    setUserTranscript('');
    setAssistantTranscript('');
  }, []);

  // ── Interrupt (not applicable for LiveKit — WebRTC handles barge-in) ─────

  const interruptPlayback = useCallback(() => {
    // LiveKit + Gemini handle barge-in natively via voice activity detection
    // No manual interrupt needed — speaking over the agent interrupts it
  }, []);

  // ── Send Image (not supported in voice path — use text concierge) ────────

  const sendImage = useCallback((_mimeType: string, _base64Data: string) => {
    // Image upload is handled by the text concierge path, not voice
    // This is a no-op to maintain interface compatibility
  }, []);

  // ── Reset Circuit Breaker ────────────────────────────────────────────────

  const resetCircuitBreaker = useCallback(() => {
    circuitBreaker.reset();
    setCircuitBreakerOpen(false);
  }, []);

  // ── Cleanup on unmount ───────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      if (roomRef.current) {
        try {
          roomRef.current.disconnect();
        } catch {
          // ignore
        }
        roomRef.current = null;
      }
      sessionActiveRef.current = false;
    };
  }, []);

  return {
    state,
    error,
    userTranscript,
    assistantTranscript,
    conversationHistory,
    diagnostics,
    startSession,
    endSession,
    interruptPlayback,
    sendImage,
    isSupported: typeof window !== 'undefined' && !!navigator.mediaDevices,
    circuitBreakerOpen,
    resetCircuitBreaker,
  };
}
