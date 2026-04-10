import ChravelMacCore
import Foundation
import XCTest

final class PollingChatRealtimeServiceTests: XCTestCase {
  func testConnectYieldsRepositorySnapshots() async throws {
    let repository = SequencedChatRepository()
    let service = PollingChatRealtimeService(chatRepository: repository, intervalSeconds: .milliseconds(30))

    let stream = service.connect(tripId: "trip-1", session: nil)
    var iterator = stream.makeAsyncIterator()

    let first = try await iterator.next()
    let second = try await iterator.next()

    XCTAssertEqual(first?.count, 1)
    XCTAssertEqual(second?.count, 2)
    XCTAssertEqual(second?.last?.content, "second")
  }
}

private actor SequencedChatRepository: ChatRepository {
  private var callCount = 0

  func fetchRecentMessages(tripId: String, session: UserSession?) async throws -> [ChatMessage] {
    callCount += 1

    if callCount == 1 {
      return [
        ChatMessage(id: "a", tripId: tripId, senderName: "n", content: "first", createdAt: .distantPast),
      ]
    }

    return [
      ChatMessage(id: "a", tripId: tripId, senderName: "n", content: "first", createdAt: .distantPast),
      ChatMessage(id: "b", tripId: tripId, senderName: "n", content: "second", createdAt: Date()),
    ]
  }

  func sendMessage(
    tripId: String,
    text: String,
    session: UserSession?,
    senderName: String?
  ) async throws -> ChatMessage {
    ChatMessage(id: UUID().uuidString, tripId: tripId, senderName: senderName ?? "n", content: text, createdAt: Date())
  }
}
