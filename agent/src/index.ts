/**
 * Chravel Voice Agent — LiveKit Agents + Gemini Realtime
 *
 * Entrypoint for the voice concierge. Reads room metadata (tripId, userId, voice),
 * builds trip context, configures Gemini RealtimeModel with system prompt + tools,
 * and starts an AgentSession.
 *
 * Deploys to LiveKit Cloud. Auto-dispatched when a room is created via the
 * livekit-token edge function.
 */

import {
  type JobContext,
  type JobProcess,
  WorkerOptions,
  defineAgent,
  cli,
  llm,
  voice,
} from '@livekit/agents';
// Event types from the voice module
type UserInputTranscribedEvent = {
  transcript: string;
  isFinal: boolean;
};
type AgentStateChangedEvent = {
  oldState: string;
  newState: string;
};
type ConversationItemAddedEvent = {
  item: { role: string; text?: string };
};
type SpeechCreatedEvent = {
  speechHandle: unknown;
};
type ErrorEvent = {
  error: unknown;
};

const { AgentSession, Agent, AgentSessionEventTypes } = voice;
import { beta } from '@livekit/agents-plugin-google';
import { fetchTripContext } from './context.js';
import { buildVoicePrompt } from './prompt.js';
import { ALL_TOOLS, createToolContext } from './tools.js';
import {
  sendTranscript,
  sendTurnComplete,
  sendRichCard,
  sendAgentState,
  sendError,
} from './dataMessages.js';

const { RealtimeModel } = beta.realtime;

// ── Agent Configuration ────────────────────────────────────────────────────────

// Model name for Gemini Live API - verify against Google's current API docs
// Common formats: 'gemini-2.0-flash-live', 'models/gemini-2.0-flash-live-001'
const GEMINI_MODEL = process.env.GEMINI_LIVE_MODEL || 'gemini-2.0-flash-live';
const DEFAULT_VOICE = 'Charon';

function log(event: string, data?: Record<string, unknown>): void {
  const ts = new Date().toISOString();
  const payload = data ? ` ${JSON.stringify(data)}` : '';
  // Structured log for LiveKit Cloud log aggregation
  process.stdout.write(`[${ts}] [chravel-agent] ${event}${payload}\n`);
}

// ── Prewarm ────────────────────────────────────────────────────────────────────

export const prewarm = async (proc: JobProcess): Promise<void> => {
  // Pre-import heavy modules during process startup
  log('prewarm:start');
  proc.userData = {};
  log('prewarm:done');
};

// Tools that produce rich cards in the frontend
const RICH_CARD_TOOLS = new Set([
  'searchPlaces',
  'getPlaceDetails',
  'getStaticMapUrl',
  'getDirectionsETA',
  'searchImages',
  'searchWeb',
  'getDistanceMatrix',
  'emitReservationDraft',
  'makeReservation',
  'getWeatherForecast',
  'searchFlights',
]);

// ── Agent Entry ────────────────────────────────────────────────────────────────

export default defineAgent({
  prewarm,
  entry: async (ctx: JobContext) => {
    log('agent:session_start', { roomName: ctx.room.name });

    // Extract metadata from room (set by livekit-token edge function)
    const metadata = ctx.room.metadata ? JSON.parse(ctx.room.metadata) : {};
    const tripId: string = metadata.tripId || '';
    const userId: string = metadata.userId || '';
    const voice: string = metadata.voice || DEFAULT_VOICE;

    if (!tripId) {
      log('agent:error', { error: 'No tripId in room metadata' });
      return;
    }

    log('agent:metadata', { tripId, userId, voice });

    // ── Fetch Trip Context ─────────────────────────────────────────────────
    log('agent:context_fetching');
    const tripContext = await fetchTripContext(tripId, userId);
    if (tripContext) {
      log('agent:context_built', {
        trip: tripContext.tripMetadata?.name,
        calendarEvents: tripContext.calendar.length,
        tasks: tripContext.tasks.length,
      });
    } else {
      log('agent:context_fallback', { reason: 'Trip not found or fetch failed' });
    }

    // ── Build System Prompt ────────────────────────────────────────────────
    const systemPrompt = buildVoicePrompt(tripContext);
    log('agent:prompt_built', { promptLength: systemPrompt.length });

    // ── Create Tool Context for LLM ────────────────────────────────────────
    const chravelToolCtx = createToolContext(tripId, userId);

    // Track tool results for turn completion
    const turnToolResults: Array<{ name: string; result: unknown }> = [];

    // Convert our tool definitions to LiveKit's tool format
    const toolContext: llm.ToolContext = {};
    for (const toolDef of ALL_TOOLS) {
      toolContext[toolDef.name] = llm.tool({
        description: toolDef.description,
        parameters: toolDef.schema as any,
        execute: async (args, opts) => {
          log('tool:call', { name: toolDef.name, args });
          sendAgentState(ctx.room, 'executing_tool', toolDef.name);

          try {
            const result = await toolDef.execute(args, chravelToolCtx);
            log('tool:result', { name: toolDef.name, success: !result.error });

            // Track for turn completion
            turnToolResults.push({ name: toolDef.name, result });

            // Send rich card data to frontend for visual rendering
            if (RICH_CARD_TOOLS.has(toolDef.name) && !result.error) {
              sendRichCard(ctx.room, toolDef.name, result);
            }

            return result;
          } catch (err) {
            const errorMsg = err instanceof Error ? err.message : String(err);
            log('tool:error', { name: toolDef.name, error: errorMsg });
            return { error: errorMsg };
          }
        },
      });
    }

    log('agent:tools_registered', { count: ALL_TOOLS.length });

    // ── Configure Gemini RealtimeModel ─────────────────────────────────────
    const model = new RealtimeModel({
      model: GEMINI_MODEL,
      apiKey: process.env.GOOGLE_API_KEY,
      voice: voice,
      instructions: systemPrompt,
    });

    log('agent:model_configured', { model: GEMINI_MODEL, voice });

    // ── Create Agent ───────────────────────────────────────────────────────
    const agent = new Agent({
      instructions: systemPrompt,
      llm: model,
      tools: toolContext,
    });

    // ── Create Agent Session ───────────────────────────────────────────────
    const session = new AgentSession({
      llm: model,
    });

    // Track transcripts for turn completion
    let turnUserText = '';
    let turnAssistantText = '';

    // Forward transcripts to frontend via data messages
    session.on(AgentSessionEventTypes.UserInputTranscribed, (ev: UserInputTranscribedEvent) => {
      log('transcript:user', { text: ev.transcript?.substring(0, 100) });
      turnUserText = ev.transcript || '';
      sendTranscript(ctx.room, 'user', turnUserText, ev.isFinal ?? true);
    });

    session.on(AgentSessionEventTypes.SpeechCreated, (_ev: SpeechCreatedEvent) => {
      log('transcript:assistant_start');
      sendAgentState(ctx.room, 'speaking');
    });

    session.on(AgentSessionEventTypes.AgentStateChanged, (ev: AgentStateChangedEvent) => {
      if (ev.newState === 'thinking') {
        sendAgentState(ctx.room, 'thinking');
      } else if (ev.newState === 'speaking') {
        sendAgentState(ctx.room, 'speaking');
      } else if (ev.newState === 'listening') {
        sendAgentState(ctx.room, 'idle');
      }
    });

    session.on(AgentSessionEventTypes.ConversationItemAdded, (ev: ConversationItemAddedEvent) => {
      // When assistant response is added to conversation
      if (ev.item?.role === 'assistant' && ev.item?.text) {
        turnAssistantText = ev.item.text || '';
        sendTranscript(ctx.room, 'assistant', turnAssistantText, true);

        // Send turn completion
        log('turn:complete', { toolResultCount: turnToolResults.length });
        sendTurnComplete(
          ctx.room,
          turnUserText,
          turnAssistantText,
          turnToolResults.length > 0 ? [...turnToolResults] : undefined,
        );

        // Reset for next turn
        turnUserText = '';
        turnAssistantText = '';
        turnToolResults.length = 0;
      }
    });

    // Handle errors
    session.on(AgentSessionEventTypes.Error, (ev: ErrorEvent) => {
      const errorMsg = ev.error instanceof Error ? ev.error.message : String(ev.error);
      log('agent:session_error', { error: errorMsg });
      sendError(ctx.room, errorMsg || 'Unknown error', 'session_error');
    });

    // ── Start Session ──────────────────────────────────────────────────────
    await ctx.connect();
    log('agent:room_connected');

    await session.start({
      agent,
      room: ctx.room,
    });

    log('agent:session_started');

    // Keep the agent alive until the room closes
    // LiveKit handles cleanup when room empties (30s timeout configured in token)
  },
});

// ── CLI Entry ──────────────────────────────────────────────────────────────────

cli.runApp(
  new WorkerOptions({
    agent: import.meta.url,
  }),
);
