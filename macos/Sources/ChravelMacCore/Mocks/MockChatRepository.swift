import Foundation

public struct MockChatRepository: ChatRepository {
  private let seeded: [String: [ChatMessage]]

  public init(seeded: [String: [ChatMessage]]) {
    self.seeded = seeded
  }

  public init() {
    self.seeded = Self.defaultSeededMessages
  }

  public func fetchRecentMessages(tripId: String, session: UserSession?) async throws -> [ChatMessage] {
    seeded[tripId, default: []].sorted { $0.createdAt < $1.createdAt }
  }

  private static let defaultSeededMessages: [String: [ChatMessage]] = [
    "trip-1": [
      ChatMessage(
        id: "m-1",
        tripId: "trip-1",
        senderName: "Alex",
        content: "Landing at HND at 3:40pm. Need van transfer?",
        createdAt: ISO8601DateFormatter().date(from: "2026-06-10T10:00:00Z") ?? .distantPast
      ),
      ChatMessage(
        id: "m-2",
        tripId: "trip-1",
        senderName: "Jordan",
        content: "Yes, adding pickup to tasks now.",
        createdAt: ISO8601DateFormatter().date(from: "2026-06-10T10:03:00Z") ?? .distantPast
      ),
    ],
    "trip-2": [
      ChatMessage(
        id: "m-3",
        tripId: "trip-2",
        senderName: "Taylor",
        content: "Who can own dinner reservation Friday?",
        createdAt: ISO8601DateFormatter().date(from: "2026-08-01T19:10:00Z") ?? .distantPast
      ),
    ],
  ]
}
