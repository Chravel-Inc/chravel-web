import SwiftUI

@main
struct ChravelMacApp: App {
  @State private var appState = AppState()
  @State private var sessionCoordinator = SessionFactory.makeCoordinator()
  @State private var workspaceCoordinator = WorkspaceFactory.makeCoordinator()

  var body: some Scene {
    WindowGroup("Chravel") {
      AppShellView(
        appState: appState,
        sessionCoordinator: sessionCoordinator,
        workspaceCoordinator: workspaceCoordinator,
      )
      .frame(minWidth: 1100, minHeight: 720)
      .task {
        AppLogger.event("App launched")
        await sessionCoordinator.bootstrap()

        if appState.selectedTripId == nil {
          appState.selectedTripId = sessionCoordinator.trips.first?.id
        }

        await workspaceCoordinator.selectTrip(appState.selectedTripId, session: sessionCoordinator.session)
      }
    }
    .commands {
      CommandGroup(after: .newItem) {
        Button("Go to Dashboard") {
          appState.selectedDestination = .dashboard
        }
        .keyboardShortcut("1", modifiers: [.command])

        Button("Go to Chat") {
          appState.selectedDestination = .chat
        }
        .keyboardShortcut("2", modifiers: [.command])

        Button("Go to Calendar") {
          appState.selectedDestination = .calendar
        }
        .keyboardShortcut("3", modifiers: [.command])
      }
    }

    Settings {
      SettingsView()
    }
  }
}
