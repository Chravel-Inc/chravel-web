/**
 * Chravel Voice Agent — LiveKit Agents + Gemini 3.1 Flash Live
 *
 * Entrypoint for the voice concierge. Reads room metadata (tripId, userId, voice),
 * builds trip context, configures Gemini RealtimeModel with system prompt + tools,
 * and starts an AgentSession.
 *
 * Deploys to LiveKit Cloud. Auto-dispatched when a room is created via the
 * livekit-token edge function.
 */

import { type JobContext, type JobProcess, WorkerOptions, defineAgent, cli } from '@livekit/agents';
import { RealtimeModel } from '@livekit/agents-plugin-google';
import { fetchTripContext } from './context.js';
import { buildVoicePrompt } from './prompt.js';
import { ALL_TOOLS, createToolContext, type ToolDefinition } from './tools.js';
import { sendTranscript, sendTurnComplete, sendRichCard, sendAgentState } from './dataMessages.js';

// ── Agent Configuration ────────────────────────────────────────────────────────

const GEMINI_MODEL = process.env.GEMINI_LIVE_MODEL || 'gemini-3.1-flash-live';
const VOICE_NAME = 'Charon';

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

// ── Agent Entry ────────────────────────────────────────────────────────────────

export default defineAgent({
  prewarm,
  entry: async (ctx: JobContext) => {
    log('agent:session_start', { roomName: ctx.room.name });

    // Extract metadata from room (set by livekit-token edge function)
    const metadata = ctx.room.metadata ? JSON.parse(ctx.room.metadata) : {};
    const tripId: string = metadata.tripId || '';
    const userId: string = metadata.userId || '';
    const voice: string = metadata.voice || VOICE_NAME;

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

    // ── Configure Gemini RealtimeModel ─────────────────────────────────────
    const model = new RealtimeModel({
      model: GEMINI_MODEL,
      apiKey: process.env.GOOGLE_API_KEY,
      voice: voice,
      instructions: systemPrompt,
    });

    log('agent:model_configured', { model: GEMINI_MODEL, voice });

    // ── Register Tools ─────────────────────────────────────────────────────
    const toolCtx = createToolContext(tripId, userId);
    const session = await model.session();

    // Track tool results for rich cards and turn completion
    const turnToolResults: Array<{ tool: string; result: unknown }> = [];
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

    for (const tool of ALL_TOOLS) {
      session.tool(tool.name, tool.schema, async (args: any) => {
        log('tool:call', { name: tool.name, args });
        sendAgentState(ctx.room, 'executing_tool', tool.name);

        try {
          const result = await tool.execute(args, toolCtx);
          log('tool:result', { name: tool.name, success: !result.error });

          // Track for turn completion
          turnToolResults.push({ tool: tool.name, result });

          // Send rich card data to frontend for visual rendering
          if (RICH_CARD_TOOLS.has(tool.name) && !result.error) {
            sendRichCard(ctx.room, tool.name, result);
          }

          return result;
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          log('tool:error', { name: tool.name, error: errorMsg });
          return { error: errorMsg };
        }
      });
    }

    log('agent:tools_registered', { count: ALL_TOOLS.length });

    // ── Start Agent Session ────────────────────────────────────────────────
    await ctx.connect();
    log('agent:room_connected');

    // Wait for the user participant to join
    const participant = await ctx.waitForParticipant();
    log('agent:participant_joined', { participantId: participant.identity });

    // Start the agent session with the participant
    const agentSession = session.start(ctx.room, participant);

    // ── Event Handlers ─────────────────────────────────────────────────────

    // Forward transcripts to frontend via data messages
    agentSession.on('user_speech_committed', (text: string) => {
      log('transcript:user', { text: text.substring(0, 100) });
      sendTranscript(ctx.room, 'user', text, true);
    });

    agentSession.on('agent_speech_committed', (text: string) => {
      log('transcript:assistant', { text: text.substring(0, 100) });
      sendTranscript(ctx.room, 'assistant', text, true);
    });

    agentSession.on('agent_thinking', () => {
      sendAgentState(ctx.room, 'thinking');
    });

    agentSession.on('agent_speaking', () => {
      sendAgentState(ctx.room, 'speaking');
    });

    agentSession.on('turn_complete', () => {
      // Collect accumulated transcripts and tool results for this turn
      log('turn:complete', { toolResultCount: turnToolResults.length });

      // Send turn completion with tool results for chat persistence
      // The frontend maps this to a ChatMessage and saves to ai_queries
      sendTurnComplete(
        ctx.room,
        '', // user text (already sent via transcript events)
        '', // assistant text (already sent via transcript events)
        turnToolResults.length > 0 ? [...turnToolResults] : undefined,
      );

      // Reset for next turn
      turnToolResults.length = 0;
      sendAgentState(ctx.room, 'idle');
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
