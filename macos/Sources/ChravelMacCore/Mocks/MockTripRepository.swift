import Foundation

public struct MockTripRepository: TripRepository {
  private let trips: [TripSummary]

  public init(trips: [TripSummary]) {
    self.trips = trips
  }

  public init() {
    self.trips = Self.defaultTrips
  }

  public func fetchTrips(session: UserSession?) async throws -> [TripSummary] {
    trips
  }

  private static let defaultTrips: [TripSummary] = [
    TripSummary(
      id: "trip-1",
      title: "Tokyo Creator Week",
      destination: "Tokyo",
      startDate: ISO8601DateFormatter().date(from: "2026-06-12T00:00:00Z"),
      endDate: ISO8601DateFormatter().date(from: "2026-06-18T00:00:00Z"),
    ),
    TripSummary(
      id: "trip-2",
      title: "Vegas Team Offsite",
      destination: "Las Vegas",
      startDate: ISO8601DateFormatter().date(from: "2026-08-02T00:00:00Z"),
      endDate: ISO8601DateFormatter().date(from: "2026-08-05T00:00:00Z"),
    ),
  ]
}
