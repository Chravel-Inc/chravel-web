import Foundation

public struct ChatMessage: Equatable, Identifiable, Sendable {
  public let id: String
  public let tripId: String
  public let senderName: String
  public let content: String
  public let createdAt: Date

  public init(id: String, tripId: String, senderName: String, content: String, createdAt: Date) {
    self.id = id
    self.tripId = tripId
    self.senderName = senderName
    self.content = content
    self.createdAt = createdAt
  }
}
