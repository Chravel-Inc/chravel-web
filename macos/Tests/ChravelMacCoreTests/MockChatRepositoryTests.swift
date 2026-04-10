import ChravelMacCore
import XCTest

final class MockChatRepositoryTests: XCTestCase {
  func testFetchRecentMessagesFiltersByTrip() async throws {
    let repository = MockChatRepository()

    let tokyoMessages = try await repository.fetchRecentMessages(tripId: "trip-1", session: nil)
    let vegasMessages = try await repository.fetchRecentMessages(tripId: "trip-2", session: nil)

    XCTAssertEqual(tokyoMessages.count, 2)
    XCTAssertEqual(vegasMessages.count, 1)
    XCTAssertTrue(tokyoMessages.allSatisfy { $0.tripId == "trip-1" })
  }
}
