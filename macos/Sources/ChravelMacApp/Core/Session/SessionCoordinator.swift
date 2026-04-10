import ChravelMacCore
import Foundation
import Observation

@MainActor
@Observable
final class SessionCoordinator {
  enum LoadState: Equatable {
    case idle
    case loading
    case ready
    case failed(String)
  }

  private let authProvider: AuthProviding
  private let tripRepository: TripRepository

  var session: UserSession?
  var trips: [TripSummary] = []
  var loadState: LoadState = .idle

  init(authProvider: AuthProviding, tripRepository: TripRepository) {
    self.authProvider = authProvider
    self.tripRepository = tripRepository
  }

  func bootstrap() async {
    loadState = .loading

    do {
      session = try await authProvider.currentSession()
      trips = try await tripRepository.fetchTrips(session: session)
      loadState = .ready
      AppLogger.event("Session bootstrap complete")
    } catch {
      loadState = .failed("Failed to load account and trips")
      AppLogger.navigation.error("Session bootstrap failed: \(error.localizedDescription, privacy: .public)")
    }
  }
}

@MainActor
enum SessionFactory {
  static func makeCoordinator() -> SessionCoordinator {
    if let config = SupabaseConfig.fromEnvironment() {
      let accessToken = ProcessInfo.processInfo.environment["CHRAVEL_SUPABASE_ACCESS_TOKEN"]
      let client = SupabaseRESTClient(config: config)
      return SessionCoordinator(
        authProvider: SupabaseAuthProvider(client: client, accessToken: accessToken),
        tripRepository: SupabaseTripRepository(client: client),
      )
    }

    return SessionCoordinator(
      authProvider: MockAuthProvider(),
      tripRepository: MockTripRepository(),
    )
  }
}
