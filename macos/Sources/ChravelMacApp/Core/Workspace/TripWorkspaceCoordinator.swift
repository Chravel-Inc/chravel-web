import ChravelMacCore
import Foundation
import Observation

@MainActor
@Observable
final class TripWorkspaceCoordinator {
  enum ChatLoadState: Equatable {
    case idle
    case loading
    case ready
    case failed(String)
  }

  private let chatRepository: ChatRepository
  private var pollingTask: Task<Void, Never>?

  var activeTripId: String?
  var messages: [ChatMessage] = []
  var chatLoadState: ChatLoadState = .idle
  var draftMessage = ""
  var isSending = false

  init(chatRepository: ChatRepository) {
    self.chatRepository = chatRepository
  }

  deinit {
    pollingTask?.cancel()
  }

  func selectTrip(_ tripId: String?, session: UserSession?) async {
    activeTripId = tripId
    pollingTask?.cancel()

    guard let tripId else {
      messages = []
      chatLoadState = .idle
      return
    }

    await loadMessages(for: tripId, session: session, allowStateTransition: true)
    startPolling(tripId: tripId, session: session)
  }

  func sendCurrentDraft(session: UserSession?) async {
    let trimmed = draftMessage.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !trimmed.isEmpty, !isSending, let tripId = activeTripId else { return }

    isSending = true
    let optimistic = ChatMessage(
      id: "local-\(UUID().uuidString)",
      tripId: tripId,
      senderName: "You",
      content: trimmed,
      createdAt: Date(),
    )
    messages.append(optimistic)
    draftMessage = ""

    do {
      let persisted = try await chatRepository.sendMessage(
        tripId: tripId,
        text: trimmed,
        session: session,
        senderName: session?.email,
      )
      messages.removeAll { $0.id == optimistic.id }
      messages.append(persisted)
      sortMessages()
    } catch {
      messages.removeAll { $0.id == optimistic.id }
      chatLoadState = .failed("Unable to send message")
      AppLogger.navigation.error("Chat send failed for trip \(tripId, privacy: .public)")
    }

    isSending = false
  }

  private func startPolling(tripId: String, session: UserSession?) {
    pollingTask = Task {
      while !Task.isCancelled {
        try? await Task.sleep(for: .seconds(6))
        guard !Task.isCancelled else { return }
        await loadMessages(for: tripId, session: session, allowStateTransition: false)
      }
    }
  }

  private func loadMessages(for tripId: String, session: UserSession?, allowStateTransition: Bool) async {
    if allowStateTransition {
      chatLoadState = .loading
    }

    do {
      let latest = try await chatRepository.fetchRecentMessages(tripId: tripId, session: session)
      let newIds = Set(latest.map(\.id))
      let optimistic = messages.filter { $0.id.hasPrefix("local-") }
      messages = latest + optimistic.filter { !newIds.contains($0.id) }
      sortMessages()
      chatLoadState = .ready
    } catch {
      if allowStateTransition {
        chatLoadState = .failed("Unable to load chat history")
      }
      AppLogger.navigation.error("Chat hydrate failed for trip \(tripId, privacy: .public)")
    }
  }

  private func sortMessages() {
    messages.sort { $0.createdAt < $1.createdAt }
  }
}

@MainActor
enum WorkspaceFactory {
  static func makeCoordinator() -> TripWorkspaceCoordinator {
    if let config = SupabaseConfig.fromEnvironment() {
      let client = SupabaseRESTClient(config: config)
      return TripWorkspaceCoordinator(chatRepository: SupabaseChatRepository(client: client))
    }

    return TripWorkspaceCoordinator(chatRepository: MockChatRepository())
  }
}
