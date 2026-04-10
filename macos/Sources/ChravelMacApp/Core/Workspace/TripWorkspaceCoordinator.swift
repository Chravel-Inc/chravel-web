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
  private let realtimeService: ChatRealtimeService
  private var realtimeTask: Task<Void, Never>?

  var activeTripId: String?
  var messages: [ChatMessage] = []
  var chatLoadState: ChatLoadState = .idle
  var draftMessage = ""
  var isSending = false
  var transientChatError: String?

  init(chatRepository: ChatRepository, realtimeService: ChatRealtimeService) {
    self.chatRepository = chatRepository
    self.realtimeService = realtimeService
  }

  deinit {
    realtimeTask?.cancel()
  }

  func selectTrip(_ tripId: String?, session: UserSession?) async {
    activeTripId = tripId
    realtimeTask?.cancel()

    guard let tripId else {
      messages = []
      chatLoadState = .idle
      transientChatError = nil
      return
    }

    chatLoadState = .loading
    transientChatError = nil

    do {
      let latest = try await chatRepository.fetchRecentMessages(tripId: tripId, session: session)
      mergeIncoming(latest)
      chatLoadState = .ready
      startRealtime(tripId: tripId, session: session)
    } catch {
      chatLoadState = .failed("Unable to load chat history")
      messages = []
      AppLogger.navigation.error("Chat hydrate failed for trip \(tripId, privacy: .public)")
    }
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
      transientChatError = nil
    } catch {
      messages.removeAll { $0.id == optimistic.id }
      transientChatError = "Unable to send message. Please retry."
      AppLogger.navigation.error("Chat send failed for trip \(tripId, privacy: .public)")
    }

    isSending = false
  }

  private func startRealtime(tripId: String, session: UserSession?) {
    realtimeTask = Task {
      let stream = realtimeService.connect(tripId: tripId, session: session)

      do {
        for try await incoming in stream {
          guard !Task.isCancelled else { return }
          mergeIncoming(incoming)
          chatLoadState = .ready
          transientChatError = nil
        }
      } catch {
        if chatLoadState == .loading {
          chatLoadState = .failed("Unable to load chat history")
        } else {
          transientChatError = "Realtime connection lost. Use refresh to reconnect."
        }
        AppLogger.navigation.error("Realtime stream failed for trip \(tripId, privacy: .public)")
      }
    }
  }

  private func mergeIncoming(_ incoming: [ChatMessage]) {
    let remoteIds = Set(incoming.map(\.id))
    let optimistic = messages.filter { $0.id.hasPrefix("local-") && !remoteIds.contains($0.id) }
    messages = incoming + optimistic
    sortMessages()
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
      let chatRepository = SupabaseChatRepository(client: client)
      let realtime = PollingChatRealtimeService(chatRepository: chatRepository)
      return TripWorkspaceCoordinator(chatRepository: chatRepository, realtimeService: realtime)
    }

    let chatRepository = MockChatRepository()
    let realtime = PollingChatRealtimeService(chatRepository: chatRepository)
    return TripWorkspaceCoordinator(chatRepository: chatRepository, realtimeService: realtime)
  }
}
