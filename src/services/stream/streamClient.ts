import { StreamChat } from 'stream-chat';

let streamClientInstance: StreamChat | null = null;
let isConnected = false;

export function getStreamClient(): StreamChat | null {
  return streamClientInstance;
}

export async function initStreamClient(
  token: string,
  userId: string,
  apiKey: string
): Promise<void> {
  try {
    if (streamClientInstance && streamClientInstance.userID === userId && isConnected) {
      return;
    }
    if (streamClientInstance && isConnected) {
      await streamClientInstance.disconnectUser();
      isConnected = false;
    }
    streamClientInstance = StreamChat.getInstance(apiKey);
    await streamClientInstance.connectUser({ id: userId }, token);
    isConnected = true;
    console.log('[StreamClient] Connected, userID:', userId);
  } catch (error) {
    console.error('[StreamClient] Failed to connect:', error);
    streamClientInstance = null;
    isConnected = false;
    throw error;
  }
}

export async function disconnectStreamClient(): Promise<void> {
  if (streamClientInstance && isConnected) {
    try {
      await streamClientInstance.disconnectUser();
      console.log('[StreamClient] Disconnected');
    } catch (error) {
      console.error('[StreamClient] Error disconnecting:', error);
    } finally {
      isConnected = false;
    }
  }
}
