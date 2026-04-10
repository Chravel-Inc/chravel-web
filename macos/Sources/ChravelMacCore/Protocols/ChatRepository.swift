import Foundation

public protocol ChatRepository {
  func fetchRecentMessages(tripId: String, session: UserSession?) async throws -> [ChatMessage]
  func sendMessage(
    tripId: String,
    text: String,
    session: UserSession?,
    senderName: String?
  ) async throws -> ChatMessage
}
