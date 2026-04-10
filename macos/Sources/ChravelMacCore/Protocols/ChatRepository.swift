import Foundation

public protocol ChatRepository {
  func fetchRecentMessages(tripId: String, session: UserSession?) async throws -> [ChatMessage]
}
