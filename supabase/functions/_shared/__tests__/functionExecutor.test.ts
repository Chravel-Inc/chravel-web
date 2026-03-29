import { describe, it, expect, vi } from 'vitest';

// Mock Deno global before importing the module
(globalThis as any).Deno = {
  env: {
    get: vi.fn().mockReturnValue('mock-key'),
  },
};

import { executeFunctionCall } from '../functionExecutor.ts';

describe('functionExecutor idempotency', () => {
  it('should correctly build payload for create_task routed to pending actions', async () => {
    // Mock Supabase — createTask now writes to trip_pending_actions
    const mockSingle = vi.fn().mockResolvedValue({ data: { id: 'pending-1' }, error: null });
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });
    const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert });
    const mockSupabase = { from: mockFrom };

    const result = await executeFunctionCall(
      mockSupabase,
      'createTask',
      { title: 'Passports', notes: 'Get them' },
      'trip-1',
      'user-1',
    );

    expect(mockFrom).toHaveBeenCalledWith('trip_pending_actions');
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        trip_id: 'trip-1',
        tool_name: 'createTask',
        payload: expect.objectContaining({ title: 'Passports' }),
      }),
    );
    expect(result.success).toBe(true);
    expect(result.pending).toBe(true);
    expect(result.pendingActionId).toBe('pending-1');
  });

  it('should map idempotency_key to tool_call_id for dedup', async () => {
    const mockSingle = vi.fn().mockResolvedValue({ data: { id: 'pending-2' }, error: null });
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });
    const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert });
    const mockSupabase = { from: mockFrom };

    await executeFunctionCall(
      mockSupabase,
      'createTask',
      { title: 'Passports', notes: 'Get them', idempotency_key: 'idemp-1' },
      'trip-1',
      'user-1',
    );

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        tool_call_id: 'idemp-1',
      }),
    );
  });

  it('should throw on duplicate pending action (unique constraint violation)', async () => {
    const mockSingle = vi.fn().mockResolvedValue({ data: null, error: { code: '23505' } });
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });

    const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert });
    const mockSupabase = { from: mockFrom };

    await expect(
      executeFunctionCall(
        mockSupabase,
        'createTask',
        { title: 'Passports', notes: 'Get them', idempotency_key: 'idemp-1' },
        'trip-1',
        'user-1',
      ),
    ).rejects.toEqual({ code: '23505' });

    expect(mockFrom).toHaveBeenCalledWith('trip_pending_actions');
  });
});
