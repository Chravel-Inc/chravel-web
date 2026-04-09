import SwiftUI

struct AppShellView: View {
  @Bindable var appState: AppState

  var body: some View {
    NavigationSplitView {
      List(AppDestination.allCases, selection: $appState.selectedDestination) { destination in
        Label(destination.title, systemImage: destination.systemImage)
          .tag(destination)
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
          AppLogger.event("Open quick actions", category: AppLogger.navigation)
        } label: {
          Label("Quick Actions", systemImage: "bolt")
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
      Text("Module scaffold ready for native implementation.")
        .font(.callout)
        .foregroundStyle(.secondary)

      Spacer(minLength: 0)
    }
    .padding(24)
  }
}
