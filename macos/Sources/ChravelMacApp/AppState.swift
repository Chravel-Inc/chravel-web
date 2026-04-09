import Foundation
import Observation

@Observable
final class AppState {
  var selectedDestination: AppDestination?
  var tripSearchQuery = ""

  init() {
    selectedDestination = .dashboard
  }
}
