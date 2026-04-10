import ChravelMacCore
import Foundation
import Observation

@Observable
final class AppState {
  var selectedDestination: AppDestination?
  var selectedTripId: TripSummary.ID?
  var tripSearchQuery = ""

  init() {
    selectedDestination = .dashboard
  }
}
