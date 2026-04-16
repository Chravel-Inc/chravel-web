export type StreamSetupResult = { channelType: string; status: string };

type StreamSetupClient = {
  updateChannelType: (
    channelType: string,
    config: {
      grants: Record<string, string[]>;
    },
  ) => Promise<unknown>;
  upsertUser: (user: {
    id: string;
    name: string;
    role: 'admin' | 'user' | string;
  }) => Promise<unknown>;
};

export const AI_CONCIERGE_BOT_ID = 'ai-concierge-bot';

export async function configureStreamPermissionsAndPrincipal(
  serverClient: StreamSetupClient,
  logger: Pick<Console, 'error'> = console,
): Promise<StreamSetupResult[]> {
  const results: StreamSetupResult[] = [];

  try {
    await serverClient.upsertUser({
      id: AI_CONCIERGE_BOT_ID,
      name: 'AI Concierge',
      role: 'admin',
    });
    results.push({ channelType: 'service-principal:ai-concierge-bot', status: 'ok' });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    logger.error('[stream-setup-permissions] service_user_upsert_failed', {
      scope: 'stream-setup-permissions',
      operation: 'upsert_service_user',
      principal_id: AI_CONCIERGE_BOT_ID,
      principal_name: 'AI Concierge',
      error: message,
    });
    results.push({
      channelType: 'service-principal:ai-concierge-bot',
      status: `error: ${message}`,
    });
  }

  // chravel-trip: members can read/write, non-members cannot
  try {
    await serverClient.updateChannelType('chravel-trip', {
      grants: {
        channel_member: [
          'ReadChannel',
          'SendMessage',
          'UpdateOwnMessage',
          'DeleteOwnMessage',
          'UploadAttachment',
          'FlagMessage',
          'PinMessage',
          'SendReaction',
          'DeleteOwnReaction',
          'SendTypingEvent',
        ],
        channel_moderator: [
          'ReadChannel',
          'SendMessage',
          'UpdateMessage',
          'DeleteMessage',
          'UploadAttachment',
          'FlagMessage',
          'PinMessage',
          'SendReaction',
          'DeleteReaction',
          'SendTypingEvent',
        ],
      },
    });
    results.push({ channelType: 'chravel-trip', status: 'ok' });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    results.push({ channelType: 'chravel-trip', status: `error: ${msg}` });
  }

  // chravel-broadcast: admin-only send, all members can read
  try {
    await serverClient.updateChannelType('chravel-broadcast', {
      grants: {
        channel_member: ['ReadChannel', 'SendReaction', 'DeleteOwnReaction'],
        channel_moderator: [
          'ReadChannel',
          'SendMessage',
          'UpdateMessage',
          'DeleteMessage',
          'SendReaction',
          'DeleteReaction',
          'PinMessage',
        ],
      },
    });
    results.push({ channelType: 'chravel-broadcast', status: 'ok' });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    results.push({ channelType: 'chravel-broadcast', status: `error: ${msg}` });
  }

  // chravel-channel: role-gated, similar to trip but configured per channel
  try {
    await serverClient.updateChannelType('chravel-channel', {
      grants: {
        channel_member: [
          'ReadChannel',
          'SendMessage',
          'UpdateOwnMessage',
          'DeleteOwnMessage',
          'SendTypingEvent',
          'SendReaction',
          'DeleteOwnReaction',
        ],
        channel_moderator: [
          'ReadChannel',
          'SendMessage',
          'UpdateMessage',
          'DeleteMessage',
          'SendTypingEvent',
          'SendReaction',
          'DeleteReaction',
          'PinMessage',
        ],
      },
    });
    results.push({ channelType: 'chravel-channel', status: 'ok' });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    results.push({ channelType: 'chravel-channel', status: `error: ${msg}` });
  }

  // chravel-concierge: 2-member private channel, both can read/write
  try {
    await serverClient.updateChannelType('chravel-concierge', {
      grants: {
        channel_member: ['ReadChannel', 'SendMessage', 'SendTypingEvent'],
      },
    });
    results.push({ channelType: 'chravel-concierge', status: 'ok' });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    results.push({ channelType: 'chravel-concierge', status: `error: ${msg}` });
  }

  return results;
}
