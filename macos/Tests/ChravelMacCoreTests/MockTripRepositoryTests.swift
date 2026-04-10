import ChravelMacCore
import XCTest

final class MockTripRepositoryTests: XCTestCase {
  func testFetchTripsReturnsFixturesWithoutSession() async throws {
    let repository = MockTripRepository()

    let trips = try await repository.fetchTrips(session: nil)

    XCTAssertEqual(trips.count, 2)
    XCTAssertEqual(trips.first?.title, "Tokyo Creator Week")
  }

  func testSupabaseConfigFromEnvironmentRequiresBothUrlAndKey() {
    let missing = SupabaseConfig.fromEnvironment([:])
    XCTAssertNil(missing)

    let config = SupabaseConfig.fromEnvironment(
      [
        "CHRAVEL_SUPABASE_URL": "https://example.supabase.co",
        "CHRAVEL_SUPABASE_ANON_KEY": "abc",
      ]
    )

    XCTAssertNotNil(config)
  }
}
