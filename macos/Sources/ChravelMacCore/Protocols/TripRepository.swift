import Foundation

public protocol TripRepository {
  func fetchTrips(session: UserSession?) async throws -> [TripSummary]
}
