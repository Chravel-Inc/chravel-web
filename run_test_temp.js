import { normalizeToolResult } from './supabase/functions/_shared/concierge/toolResultContracts.ts';
console.log(normalizeToolResult('createTask', { success: true, task: { id: 't1', creator_id: 'user_1', trip_id: 'trip_1' } }));
