import SwiftUI

@main
struct ChravelMacApp: App {
  @State private var appState = AppState()

  var body: some Scene {
    WindowGroup("Chravel") {
      AppShellView(appState: appState)
        .frame(minWidth: 1100, minHeight: 720)
        .onAppear {
          AppLogger.event("App launched")
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
