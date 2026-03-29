/**
 * Data message helpers for sending structured JSON to the frontend via LiveKit data channels.
 *
 * All messages use RELIABLE delivery to guarantee ordering and receipt.
 * The frontend (useLiveKitVoice.ts) listens for these topics and maps them
 * to ChatMessage fields and UI state updates.
 */

import type { Room } from '@livekit/rtc-node';

const TOPIC_TRANSCRIPT = 'transcript';
const TOPIC_TURN_COMPLETE = 'turn_complete';
const TOPIC_RICH_CARD = 'rich_card';
const TOPIC_AGENT_STATE = 'agent_state';

const encoder = new TextEncoder();

function sendData(room: Room, topic: string, payload: Record<string, unknown>): void {
  const data = encoder.encode(JSON.stringify(payload));
  room.localParticipant?.publishData(data, { reliable: true, topic });
}

/** Send a partial or final transcript update */
export function sendTranscript(
  room: Room,
  role: 'user' | 'assistant',
  text: string,
  isFinal: boolean,
): void {
  sendData(room, TOPIC_TRANSCRIPT, { role, text, isFinal });
}

/** Signal that a conversational turn is complete (both user + assistant text finalized) */
export function sendTurnComplete(
  room: Room,
  userText: string,
  assistantText: string,
  toolResults?: Array<{ tool: string; result: unknown }>,
): void {
  sendData(room, TOPIC_TURN_COMPLETE, { userText, assistantText, toolResults });
}

/**
 * Send a rich card payload for the frontend to render in chat.
 * Card types mirror the existing ChatMessage metadata fields:
 * searchPlaces, getPlaceDetails, getStaticMapUrl, getDirectionsETA,
 * searchImages, searchWeb, getDistanceMatrix, emitReservationDraft, etc.
 */
export function sendRichCard(
  room: Room,
  toolName: string,
  cardData: Record<string, unknown>,
): void {
  sendData(room, TOPIC_RICH_CARD, { toolName, cardData });
}

/** Notify the frontend of agent state changes (thinking, executing tools, etc.) */
export function sendAgentState(
  room: Room,
  state: 'thinking' | 'executing_tool' | 'speaking' | 'idle',
  toolName?: string,
): void {
  sendData(room, TOPIC_AGENT_STATE, { state, toolName });
}
