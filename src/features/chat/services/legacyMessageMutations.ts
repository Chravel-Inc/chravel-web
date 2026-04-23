import {
  deleteChannelMessage,
  deleteChatMessage,
  editChannelMessage,
  editChatMessage,
} from '@/services/chatService';

export const editLegacyMessage = async (
  messageType: 'channel' | 'trip',
  messageId: string,
  editedContent: string,
) => {
  if (messageType === 'channel') {
    return editChannelMessage(messageId, editedContent);
  }

  return editChatMessage(messageId, editedContent);
};

export const deleteLegacyMessage = async (messageType: 'channel' | 'trip', messageId: string) => {
  if (messageType === 'channel') {
    return deleteChannelMessage(messageId);
  }

  return deleteChatMessage(messageId);
};
