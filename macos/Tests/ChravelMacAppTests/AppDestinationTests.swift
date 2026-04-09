import XCTest
@testable import ChravelMacApp

final class AppDestinationTests: XCTestCase {
  func testDestinationsHaveUniqueTitles() {
    let titles = AppDestination.allCases.map(\.title)
    XCTAssertEqual(Set(titles).count, titles.count)
  }

  func testConciergeExistsInSidebarModel() {
    XCTAssertTrue(AppDestination.allCases.contains(.concierge))
  }
}
