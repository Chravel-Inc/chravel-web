import ChravelMacCore
import SwiftUI

struct AppShellView: View {
  @Bindable var appState: AppState
  @Bindable var sessionCoordinator: SessionCoordinator

  var body: some View {
    NavigationSplitView {
      List(selection: $appState.selectedDestination) {
        Section("Workspace") {
          ForEach(AppDestination.allCases) { destination in
            Label(destination.title, systemImage: destination.systemImage)
              .tag(destination)
          }
        }

        if !sessionCoordinator.trips.isEmpty {
          Section("Trips") {
            ForEach(sessionCoordinator.trips) { trip in
              VStack(alignment: .leading, spacing: 2) {
                Text(trip.title)
                  .font(.subheadline)
                if let destination = trip.destination {
                  Text(destination)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                }
              }
            }
          }
        }
      }
      .listStyle(.sidebar)
      .navigationTitle("Chravel")
    } detail: {
      detailContent(for: appState.selectedDestination)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(.ultraThinMaterial)
    }
    .toolbar {
      ToolbarItem(placement: .principal) {
        HStack(spacing: 8) {
          Image(systemName: "airplane.circle.fill")
            .symbolRenderingMode(.hierarchical)
          Text("Chravel macOS")
            .font(.headline)
        }
      }

      ToolbarItem(placement: .primaryAction) {
        Button {
          Task {
            await sessionCoordinator.bootstrap()
          }
        } label: {
          Label("Refresh", systemImage: "arrow.clockwise")
        }
      }
    }
  }

  @ViewBuilder
  private func detailContent(for destination: AppDestination?) -> some View {
    guard let destination else {
      ContentUnavailableView("Select a workspace", systemImage: "sidebar.left")
      return
    }

    VStack(alignment: .leading, spacing: 12) {
      Text(destination.title)
        .font(.largeTitle.bold())

      switch sessionCoordinator.loadState {
      case .idle:
        Text("Ready to connect account and load trips.")
          .foregroundStyle(.secondary)
      case .loading:
        ProgressView("Loading account and trips…")
      case .ready:
        Text("Loaded \(sessionCoordinator.trips.count) trip(s).")
          .foregroundStyle(.secondary)
      case let .failed(message):
        Text(message)
          .foregroundStyle(.red)
      }

      Spacer(minLength: 0)
    }
    .padding(24)
  }
}
