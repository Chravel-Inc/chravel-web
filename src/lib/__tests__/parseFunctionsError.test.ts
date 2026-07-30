import { describe, expect, it } from 'vitest';
import { parseFunctionsInvokeError } from '../parseFunctionsError';

describe('parseFunctionsInvokeError', () => {
  it('maps TRIP_FULL from data.error_code', async () => {
    const parsed = await parseFunctionsInvokeError(null, {
      error: 'Trip is full',
      error_code: 'TRIP_FULL',
    });
    expect(parsed.errorCode).toBe('TRIP_FULL');
    expect(parsed.message).toMatch(/full/i);
  });

  it('maps USER_NOT_FOUND from FunctionsHttpError Response body', async () => {
    const response = new Response(
      JSON.stringify({ error: 'USER_NOT_FOUND', error_code: 'USER_NOT_FOUND' }),
      {
        status: 404,
      },
    );
    const error = { context: response };
    const parsed = await parseFunctionsInvokeError(error, null);
    expect(parsed.errorCode).toBe('USER_NOT_FOUND');
    expect(parsed.message).toMatch(/No Chravel account/i);
    expect(parsed.status).toBe(404);
  });

  it('maps ALREADY_MEMBER', async () => {
    const parsed = await parseFunctionsInvokeError(null, {
      error: 'That person is already a member of this trip',
      error_code: 'ALREADY_MEMBER',
    });
    expect(parsed.message).toMatch(/already on this trip/i);
  });
});
