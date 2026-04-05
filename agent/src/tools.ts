/**
 * Tool Definitions — All 38 concierge tools ported to LiveKit agent format.
 *
 * Single source of truth is _shared/concierge/toolRegistry.ts.
 * This file mirrors those declarations using Zod schemas for the agent framework.
 *
 * Tool execution strategy:
 * - Write tools (createTask,\n  extractReceipt, addToCalendar, etc.) → trip_pending_actions buffer
 * - Read tools (getPaymentSummary, searchTripData) → direct Supabase queries
 * - External API tools (searchPlaces, searchWeb, etc.) → call execute-concierge-tool edge fn
 *
 * Rich card data is sent to the frontend via data messages after tool execution.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface ToolDefinition {
  name: string;
  description: string;
  schema: z.ZodObject<any>;
  execute: (args: any, ctx: ToolContext) => Promise<Record<string, unknown>>;
}

export interface ToolContext {
  tripId: string;
  userId: string;
  supabase: SupabaseClient;
  supabaseUrl: string;
  supabaseServiceKey: string;
}

// ── Supabase Client ────────────────────────────────────────────────────────────

let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    _supabase = createClient(url, key);
  }
  return _supabase;
}

export function createToolContext(tripId: string, userId: string): ToolContext {
  return {
    tripId,
    userId,
    supabase: getSupabase(),
    supabaseUrl: process.env.SUPABASE_URL!,
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Execute a tool via the execute-concierge-tool edge function.
 * Used for external API tools (Maps, search, flights, etc.) to reuse
 * existing API key rotation and error handling.
 */
async function callEdgeFunction(
  ctx: ToolContext,
  toolName: string,
  args: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const url = `${ctx.supabaseUrl}/functions/v1/execute-concierge-tool`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ctx.supabaseServiceKey}`,
    },
    body: JSON.stringify({
      toolName,
      args,
      tripId: ctx.tripId,
      userId: ctx.userId,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => 'Unknown error');
    console.error(`[agent:tool] Edge function error for ${toolName}:`, res.status, text);
    return { error: `Tool execution failed: ${res.status}`, toolName };
  }

  return (await res.json()) as Record<string, unknown>;
}

/**
 * Insert a pending action for write tools.
 * Write operations go through the trip_pending_actions buffer,
 * not directly to shared state (per CLAUDE.md agent memory #7).
 */
async function insertPendingAction(
  ctx: ToolContext,
  actionType: string,
  payload: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const { data, error } = await ctx.supabase
    .from('trip_pending_actions')
    .insert({
      trip_id: ctx.tripId,
      user_id: ctx.userId,
      action_type: actionType,
      payload,
      status: 'pending',
    })
    .select('id')
    .single();

  if (error) {
    console.error(`[agent:tool] Pending action insert failed for ${actionType}:`, error.message);
    return { error: error.message, actionType };
  }

  return { success: true, actionId: data.id, actionType };
}

// ── Tool Definitions ───────────────────────────────────────────────────────────
// Grouped by execution strategy: write (pending action), read (direct DB), external (edge fn)

// --- Write Tools (via pending actions buffer) ---

const addToCalendar: ToolDefinition = {
  name: 'addToCalendar',
  description: 'Add an event to the trip calendar',
  schema: z.object({
    idempotency_key: z.string().optional(),
    title: z.string().describe('Event title'),
    datetime: z.string().describe('ISO 8601 datetime string'),
    location: z.string().optional().describe('Event location or address'),
    notes: z.string().optional().describe('Additional notes'),
  }),
  execute: (args, ctx) =>
    insertPendingAction(ctx, 'addToCalendar', { ...args, tripId: ctx.tripId }),
};

const createTask: ToolDefinition = {
  name: 'createTask',
  description: 'Create a task for the trip group',
  schema: z.object({
    idempotency_key: z.string().optional(),
    title: z.string().describe('Task title'),
    notes: z.string().optional().describe('Additional notes'),
    assignee: z.string().optional().describe('Person to assign'),
    dueDate: z.string().optional().describe('Due date ISO 8601'),
  }),
  execute: (args, ctx) => insertPendingAction(ctx, 'createTask', { ...args, tripId: ctx.tripId }),
};


const extractReceipt: ToolDefinition = {
  name: 'extractReceipt',
  description: 'Parse a receipt to automatically extract payment information (amount, vendor, currency) for either splitting a payment or saving as a photo.',
  schema: z.object({
    idempotency_key: z.string().optional(),
    fileUrl: z.string().describe('The URL of the receipt image or file to extract'),
    totalAmount: z.number().optional().describe('The total amount of the receipt, if known'),
    vendor: z.string().optional().describe('The vendor or merchant name, if known'),
    currency: z.string().optional().describe('Currency code (e.g. USD)'),
  }),
  execute: (args, ctx) => insertPendingAction(ctx, 'extractReceipt', { ...args, tripId: ctx.tripId }),
};

const createPoll: ToolDefinition = {
  name: 'createPoll',
  description: 'Create a poll for the group to vote on',
  schema: z.object({
    idempotency_key: z.string().optional(),
    question: z.string().describe('The poll question'),
    options: z.array(z.string()).describe('List of poll options (2-6)'),
  }),
  execute: (args, ctx) => insertPendingAction(ctx, 'createPoll', { ...args, tripId: ctx.tripId }),
};

const updateCalendarEvent: ToolDefinition = {
  name: 'updateCalendarEvent',
  description: 'Update an existing trip calendar event',
  schema: z.object({
    idempotency_key: z.string().optional(),
    eventId: z.string().describe('ID of the event to update'),
    title: z.string().optional(),
    datetime: z.string().optional(),
    endDatetime: z.string().optional(),
    location: z.string().optional(),
    notes: z.string().optional(),
  }),
  execute: (args, ctx) =>
    insertPendingAction(ctx, 'updateCalendarEvent', { ...args, tripId: ctx.tripId }),
};

const deleteCalendarEvent: ToolDefinition = {
  name: 'deleteCalendarEvent',
  description: 'Delete an event from the trip calendar',
  schema: z.object({
    idempotency_key: z.string().optional(),
    eventId: z.string().describe('ID of the event to delete'),
  }),
  execute: (args, ctx) =>
    insertPendingAction(ctx, 'deleteCalendarEvent', { ...args, tripId: ctx.tripId }),
};

const updateTask: ToolDefinition = {
  name: 'updateTask',
  description: 'Update an existing trip task',
  schema: z.object({
    idempotency_key: z.string().optional(),
    taskId: z.string().describe('ID of the task to update'),
    title: z.string().optional(),
    description: z.string().optional(),
    dueDate: z.string().optional(),
    completed: z.boolean().optional(),
  }),
  execute: (args, ctx) => insertPendingAction(ctx, 'updateTask', { ...args, tripId: ctx.tripId }),
};

const deleteTask: ToolDefinition = {
  name: 'deleteTask',
  description: 'Delete a task from the trip',
  schema: z.object({
    idempotency_key: z.string().optional(),
    taskId: z.string().describe('ID of the task to delete'),
  }),
  execute: (args, ctx) => insertPendingAction(ctx, 'deleteTask', { ...args, tripId: ctx.tripId }),
};

const savePlace: ToolDefinition = {
  name: 'savePlace',
  description: 'Save a place or link to the trip Places section',
  schema: z.object({
    idempotency_key: z.string().optional(),
    name: z.string().describe('Name of the place or link'),
    url: z.string().optional().describe('URL for the place'),
    description: z.string().optional().describe('Why this place is recommended'),
    category: z
      .string()
      .optional()
      .describe('attraction, accommodation, activity, appetite, other'),
  }),
  execute: (args, ctx) => insertPendingAction(ctx, 'savePlace', { ...args, tripId: ctx.tripId }),
};

const setBasecamp: ToolDefinition = {
  name: 'setBasecamp',
  description: 'Set the trip or personal basecamp accommodation',
  schema: z.object({
    idempotency_key: z.string().optional(),
    scope: z.string().describe('"trip" for group or "personal" for user'),
    name: z.string().describe('Hotel/accommodation name'),
    address: z.string().optional(),
    lat: z.number().optional(),
    lng: z.number().optional(),
  }),
  execute: (args, ctx) =>
    insertPendingAction(ctx, 'setBasecamp', { ...args, tripId: ctx.tripId, userId: ctx.userId }),
};

const addToAgenda: ToolDefinition = {
  name: 'addToAgenda',
  description: 'Add a session to an event agenda',
  schema: z.object({
    idempotency_key: z.string().optional(),
    eventId: z.string().describe('Parent event ID'),
    title: z.string().describe('Session title'),
    description: z.string().optional(),
    sessionDate: z.string().optional(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    location: z.string().optional(),
    speakers: z.array(z.string()).optional(),
  }),
  execute: (args, ctx) => insertPendingAction(ctx, 'addToAgenda', { ...args, tripId: ctx.tripId }),
};

const createBroadcast: ToolDefinition = {
  name: 'createBroadcast',
  description: 'Send a broadcast to all trip members',
  schema: z.object({
    idempotency_key: z.string().optional(),
    message: z.string().describe('Broadcast message'),
    priority: z.string().optional().describe('"normal" or "urgent"'),
  }),
  execute: (args, ctx) =>
    insertPendingAction(ctx, 'createBroadcast', {
      ...args,
      tripId: ctx.tripId,
      userId: ctx.userId,
    }),
};

const createNotification: ToolDefinition = {
  name: 'createNotification',
  description: 'Send in-app notifications',
  schema: z.object({
    idempotency_key: z.string().optional(),
    title: z.string().describe('Notification title'),
    message: z.string().describe('Notification body'),
    targetUserIds: z.array(z.string()).optional(),
    type: z.string().optional(),
  }),
  execute: (args, ctx) =>
    insertPendingAction(ctx, 'createNotification', { ...args, tripId: ctx.tripId }),
};

const settleExpense: ToolDefinition = {
  name: 'settleExpense',
  description: 'Mark a payment split as settled',
  schema: z.object({
    idempotency_key: z.string().optional(),
    splitId: z.string().describe('Payment split ID'),
    amount: z.number().optional(),
    method: z.string().optional().describe('Venmo, Zelle, cash, etc.'),
  }),
  execute: (args, ctx) =>
    insertPendingAction(ctx, 'settleExpense', { ...args, tripId: ctx.tripId }),
};

const emitSmartImportPreview: ToolDefinition = {
  name: 'emitSmartImportPreview',
  description: 'Extract calendar events from docs and show preview card',
  schema: z.object({
    idempotency_key: z.string().optional(),
    events: z.array(
      z.object({
        idempotency_key: z.string().optional(),
        title: z.string(),
        datetime: z.string(),
        endDatetime: z.string().optional(),
        location: z.string().optional(),
        category: z.string().optional(),
        notes: z.string().optional(),
      }),
    ),
  }),
  execute: (args, ctx) =>
    insertPendingAction(ctx, 'emitSmartImportPreview', { ...args, tripId: ctx.tripId }),
};

const emitReservationDraft: ToolDefinition = {
  name: 'emitReservationDraft',
  description: 'Create a reservation draft card for booking intents',
  schema: z.object({
    idempotency_key: z.string().optional(),
    placeQuery: z.string().describe('Restaurant/venue name'),
    startTimeISO: z.string().optional(),
    partySize: z.number().optional(),
    reservationName: z.string().optional(),
    notes: z.string().optional(),
  }),
  execute: (args, ctx) => callEdgeFunction(ctx, 'emitReservationDraft', args),
};

const generateTripImage: ToolDefinition = {
  name: 'generateTripImage',
  description: 'Generate a custom AI image for the trip',
  schema: z.object({
    idempotency_key: z.string().optional(),
    prompt: z.string().describe('Image description'),
    style: z.string().optional().describe('photo, illustration, watercolor, minimal, vibrant'),
  }),
  execute: (args, ctx) => callEdgeFunction(ctx, 'generateTripImage', args),
};

const setTripHeaderImage: ToolDefinition = {
  name: 'setTripHeaderImage',
  description: 'Set the trip header/cover image',
  schema: z.object({
    idempotency_key: z.string().optional(),
    imageUrl: z.string().describe('URL of the image'),
  }),
  execute: (args, ctx) =>
    insertPendingAction(ctx, 'setTripHeaderImage', { ...args, tripId: ctx.tripId }),
};

// --- Read Tools (direct Supabase queries) ---

const getPaymentSummary: ToolDefinition = {
  name: 'getPaymentSummary',
  description: 'Get a summary of who owes money to whom',
  schema: z.object({
    idempotency_key: z.string().optional(),
  }),
  execute: async (_args, ctx) => {
    const { data, error } = await ctx.supabase
      .from('payment_splits')
      .select(
        '*, payer:profiles_public!payer_id(display_name), payee:profiles_public!payee_id(display_name)',
      )
      .eq('trip_id', ctx.tripId)
      .eq('is_settled', false);

    if (error) return { error: error.message };
    return { splits: data ?? [], count: (data ?? []).length };
  },
};

const searchTripData: ToolDefinition = {
  name: 'searchTripData',
  description: 'Search across all trip data',
  schema: z.object({
    idempotency_key: z.string().optional(),
    query: z.string().describe('Search query'),
    types: z.array(z.string()).optional().describe('calendar, task, poll, link, payment'),
  }),
  execute: (args, ctx) => callEdgeFunction(ctx, 'searchTripData', args),
};

const searchTripArtifacts: ToolDefinition = {
  name: 'searchTripArtifacts',
  description: 'Search uploaded trip documents, screenshots, PDFs',
  schema: z.object({
    idempotency_key: z.string().optional(),
    query: z.string().describe('Semantic search query'),
    artifact_types: z.array(z.string()).optional(),
    limit: z.number().optional(),
  }),
  execute: (args, ctx) => callEdgeFunction(ctx, 'searchTripArtifacts', args),
};

const detectCalendarConflicts: ToolDefinition = {
  name: 'detectCalendarConflicts',
  description: 'Check if a time slot conflicts with existing events',
  schema: z.object({
    idempotency_key: z.string().optional(),
    datetime: z.string().describe('Proposed start time ISO 8601'),
    endDatetime: z.string().optional(),
  }),
  execute: (args, ctx) => callEdgeFunction(ctx, 'detectCalendarConflicts', args),
};

const verifyArtifact: ToolDefinition = {
  name: 'verify_artifact',
  description: 'Verify a created artifact exists by ID or idempotency key',
  schema: z.object({
    type: z.string().describe('task, event, place, link, poll'),
    id: z.string().optional(),
    idempotency_key: z.string().optional(),
  }),
  execute: (args, ctx) => callEdgeFunction(ctx, 'verify_artifact', args),
};

const explainPermission: ToolDefinition = {
  name: 'explainPermission',
  description: 'Explain whether an action is allowed and why',
  schema: z.object({
    idempotency_key: z.string().optional(),
    action: z.string().describe('The action to check'),
  }),
  execute: (args, ctx) => callEdgeFunction(ctx, 'explainPermission', args),
};

const getDeepLink: ToolDefinition = {
  name: 'getDeepLink',
  description: 'Generate an in-app deep link for a trip entity',
  schema: z.object({
    idempotency_key: z.string().optional(),
    entityType: z.string().describe('event, task, poll, link, payment, broadcast'),
    entityId: z.string().describe('ID of the item'),
  }),
  execute: (_args, ctx) => {
    // Deep links are constructed client-side, but we return the data needed
    return Promise.resolve({
      deepLink: `/trip/${ctx.tripId}/${_args.entityType}/${_args.entityId}`,
      entityType: _args.entityType,
      entityId: _args.entityId,
    });
  },
};

// --- External API Tools (via execute-concierge-tool edge function) ---

const searchPlaces: ToolDefinition = {
  name: 'searchPlaces',
  description: 'Search for nearby places like restaurants, hotels, attractions',
  schema: z.object({
    idempotency_key: z.string().optional(),
    query: z.string().describe('Search query'),
    nearLat: z.number().optional(),
    nearLng: z.number().optional(),
  }),
  execute: (args, ctx) => callEdgeFunction(ctx, 'searchPlaces', args),
};

const getPlaceDetails: ToolDefinition = {
  name: 'getPlaceDetails',
  description: 'Get detailed info about a specific place',
  schema: z.object({
    idempotency_key: z.string().optional(),
    placeId: z.string().describe('Google Places ID'),
  }),
  execute: (args, ctx) => callEdgeFunction(ctx, 'getPlaceDetails', args),
};

const getDirectionsETA: ToolDefinition = {
  name: 'getDirectionsETA',
  description: 'Get directions, travel time, and distance between two locations',
  schema: z.object({
    idempotency_key: z.string().optional(),
    origin: z.string().describe('Starting address'),
    destination: z.string().describe('Destination address'),
    departureTime: z.string().optional(),
  }),
  execute: (args, ctx) => callEdgeFunction(ctx, 'getDirectionsETA', args),
};

const getTimezone: ToolDefinition = {
  name: 'getTimezone',
  description: 'Get the time zone for a geographic location',
  schema: z.object({
    idempotency_key: z.string().optional(),
    lat: z.number().describe('Latitude'),
    lng: z.number().describe('Longitude'),
  }),
  execute: (args, ctx) => callEdgeFunction(ctx, 'getTimezone', args),
};

const searchImages: ToolDefinition = {
  name: 'searchImages',
  description: 'Search for images on the web',
  schema: z.object({
    idempotency_key: z.string().optional(),
    query: z.string().describe('Image search query'),
    count: z.number().optional(),
  }),
  execute: (args, ctx) => callEdgeFunction(ctx, 'searchImages', args),
};

const getStaticMapUrl: ToolDefinition = {
  name: 'getStaticMapUrl',
  description: 'Generate a map image showing a location or route',
  schema: z.object({
    idempotency_key: z.string().optional(),
    center: z.string().describe('Address or lat,lng'),
    zoom: z.number().optional(),
    markers: z.array(z.string()).optional(),
  }),
  execute: (args, ctx) => callEdgeFunction(ctx, 'getStaticMapUrl', args),
};

const searchWeb: ToolDefinition = {
  name: 'searchWeb',
  description: 'Search the web for real-time information',
  schema: z.object({
    idempotency_key: z.string().optional(),
    query: z.string().describe('Search query'),
    count: z.number().optional(),
  }),
  execute: (args, ctx) => callEdgeFunction(ctx, 'searchWeb', args),
};

const getDistanceMatrix: ToolDefinition = {
  name: 'getDistanceMatrix',
  description: 'Get travel times from multiple origins to multiple destinations',
  schema: z.object({
    idempotency_key: z.string().optional(),
    origins: z.array(z.string()),
    destinations: z.array(z.string()),
    mode: z.string().optional().describe('driving, walking, bicycling, transit'),
  }),
  execute: (args, ctx) => callEdgeFunction(ctx, 'getDistanceMatrix', args),
};

const validateAddress: ToolDefinition = {
  name: 'validateAddress',
  description: 'Validate and clean up an address',
  schema: z.object({
    idempotency_key: z.string().optional(),
    address: z.string().describe('Address to validate'),
  }),
  execute: (args, ctx) => callEdgeFunction(ctx, 'validateAddress', args),
};

const searchFlights: ToolDefinition = {
  name: 'searchFlights',
  description: 'Search flights and return Google Flights deeplinks',
  schema: z.object({
    idempotency_key: z.string().optional(),
    origin: z.string().describe('Origin airport code or city'),
    destination: z.string().describe('Destination airport code or city'),
    departureDate: z.string().describe('YYYY-MM-DD'),
    returnDate: z.string().optional(),
    passengers: z.number().optional(),
  }),
  execute: (args, ctx) => callEdgeFunction(ctx, 'searchFlights', args),
};

const getWeatherForecast: ToolDefinition = {
  name: 'getWeatherForecast',
  description: 'Get weather forecast',
  schema: z.object({
    idempotency_key: z.string().optional(),
    location: z.string().describe('City or location name'),
    date: z.string().optional(),
  }),
  execute: (args, ctx) => callEdgeFunction(ctx, 'getWeatherForecast', args),
};

const convertCurrency: ToolDefinition = {
  name: 'convertCurrency',
  description: 'Convert between currencies with live rates',
  schema: z.object({
    idempotency_key: z.string().optional(),
    amount: z.number().describe('Amount to convert'),
    from: z.string().describe('Source currency code'),
    to: z.string().describe('Target currency code'),
  }),
  execute: (args, ctx) => callEdgeFunction(ctx, 'convertCurrency', args),
};

const browseWebsite: ToolDefinition = {
  name: 'browseWebsite',
  description: 'Browse a website to extract travel info',
  schema: z.object({
    idempotency_key: z.string().optional(),
    url: z.string().describe('URL to browse'),
    instruction: z.string().optional().describe('What to look for'),
  }),
  execute: (args, ctx) => callEdgeFunction(ctx, 'browseWebsite', args),
};

const makeReservation: ToolDefinition = {
  name: 'makeReservation',
  description: 'Research and prepare a reservation',
  schema: z.object({
    idempotency_key: z.string().optional(),
    venue: z.string().describe('Restaurant/hotel/venue name'),
    datetime: z.string().optional(),
    partySize: z.number().optional(),
    name: z.string().optional(),
    phone: z.string().optional(),
    specialRequests: z.string().optional(),
    bookingUrl: z.string().optional(),
  }),
  execute: (args, ctx) => callEdgeFunction(ctx, 'makeReservation', args),
};

const searchHotels: ToolDefinition = {
  name: 'searchHotels',
  description:
    'Search for hotels/lodging near a location. Returns up to 5 results with ratings, amenities, and links.',
  schema: z.object({
    idempotency_key: z.string().optional(),
    query: z.string().describe('Search query (e.g. "boutique hotel in Paris")'),
    nearLat: z.number().optional().describe('Latitude to search near'),
    nearLng: z.number().optional().describe('Longitude to search near'),
    checkIn: z.string().optional().describe('Check-in date (YYYY-MM-DD)'),
    checkOut: z.string().optional().describe('Check-out date (YYYY-MM-DD)'),
  }),
  execute: (args, ctx) => callEdgeFunction(ctx, 'searchHotels', args),
};

const getHotelDetails: ToolDefinition = {
  name: 'getHotelDetails',
  description:
    'Get detailed information about a specific hotel by its Google Place ID. Returns rating, amenities, photos, and booking links.',
  schema: z.object({
    idempotency_key: z.string().optional(),
    placeId: z.string().describe('Google Place ID of the hotel (from searchHotels results)'),
  }),
  execute: (args, ctx) => callEdgeFunction(ctx, 'getHotelDetails', args),
};

// ── Export All Tools ───────────────────────────────────────────────────────────

export const ALL_TOOLS: ToolDefinition[] = [
  // Write tools
  addToCalendar,
  createTask,
  createPoll,
  updateCalendarEvent,
  deleteCalendarEvent,
  updateTask,
  deleteTask,
  savePlace,
  setBasecamp,
  addToAgenda,
  createBroadcast,
  createNotification,
  settleExpense,
  emitSmartImportPreview,
  emitReservationDraft,
  generateTripImage,
  setTripHeaderImage,
  // Read tools
  getPaymentSummary,
  searchTripData,
  searchTripArtifacts,
  detectCalendarConflicts,
  verifyArtifact,
  explainPermission,
  getDeepLink,
  // External API tools
  searchPlaces,
  getPlaceDetails,
  getDirectionsETA,
  getTimezone,
  searchImages,
  getStaticMapUrl,
  searchWeb,
  getDistanceMatrix,
  validateAddress,
  searchFlights,
  getWeatherForecast,
  convertCurrency,
  browseWebsite,
  makeReservation,
  searchHotels,
  getHotelDetails,
];
