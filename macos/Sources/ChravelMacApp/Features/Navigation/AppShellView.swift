import ChravelMacCore
import SwiftUI

struct AppShellView: View {
  @Bindable var appState: AppState
  @Bindable var sessionCoordinator: SessionCoordinator
  @Bindable var workspaceCoordinator: TripWorkspaceCoordinator

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
              .contentShape(Rectangle())
              .onTapGesture {
                appState.selectedTripId = trip.id
                Task {
                  await workspaceCoordinator.selectTrip(trip.id, session: sessionCoordinator.session)
                }
              }
              .background(appState.selectedTripId == trip.id ? Color.accentColor.opacity(0.15) : .clear)
              .clipShape(RoundedRectangle(cornerRadius: 8))
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
            await workspaceCoordinator.selectTrip(appState.selectedTripId, session: sessionCoordinator.session)
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

      if destination == .chat {
        chatPane
      }

      Spacer(minLength: 0)
    }
    .padding(24)
  }

  @ViewBuilder
  private var chatPane: some View {
    if appState.selectedTripId == nil {
      Text("Select a trip from the sidebar to load chat.")
        .foregroundStyle(.secondary)
      return
    }

    VStack(spacing: 12) {
      if let transientChatError = workspaceCoordinator.transientChatError {
        Text(transientChatError)
          .font(.footnote)
          .foregroundStyle(.red)
          .frame(maxWidth: .infinity, alignment: .leading)
      }

      switch workspaceCoordinator.chatLoadState {
      case .idle:
        Text("Chat not loaded yet")
          .foregroundStyle(.secondary)
      case .loading:
        ProgressView("Loading messages…")
      case .ready:
        if workspaceCoordinator.messages.isEmpty {
          Text("No messages yet")
            .foregroundStyle(.secondary)
        } else {
          List(workspaceCoordinator.messages) { message in
            VStack(alignment: .leading, spacing: 4) {
              HStack {
                Text(message.senderName)
                  .font(.subheadline.bold())
                Spacer()
                Text(message.createdAt, style: .time)
                  .font(.caption)
                  .foregroundStyle(.secondary)
              }
              Text(message.content)
                .font(.callout)
            }
            .padding(.vertical, 4)
          }
          .frame(minHeight: 240)
        }
      case let .failed(errorMessage):
        Text(errorMessage)
          .foregroundStyle(.red)
      }

      HStack(spacing: 8) {
        TextField("Message your group", text: $workspaceCoordinator.draftMessage, axis: .vertical)
          .textFieldStyle(.roundedBorder)
          .lineLimit(1...4)

        Button {
          Task {
            await workspaceCoordinator.sendCurrentDraft(session: sessionCoordinator.session)
          }
        } label: {
          if workspaceCoordinator.isSending {
            ProgressView()
              .controlSize(.small)
          } else {
            Image(systemName: "paperplane.fill")
          }
        }
        .buttonStyle(.borderedProminent)
        .disabled(
          workspaceCoordinator.draftMessage.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ||
            workspaceCoordinator.isSending
        )
      }
    }
  }
}
