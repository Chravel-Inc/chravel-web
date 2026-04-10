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

  var activeTripId: String?
  var messages: [ChatMessage] = []
  var chatLoadState: ChatLoadState = .idle

  init(chatRepository: ChatRepository) {
    self.chatRepository = chatRepository
  }

  func selectTrip(_ tripId: String?, session: UserSession?) async {
    activeTripId = tripId
    guard let tripId else {
      messages = []
      chatLoadState = .idle
      return
    }

    chatLoadState = .loading

    do {
      messages = try await chatRepository.fetchRecentMessages(tripId: tripId, session: session)
      chatLoadState = .ready
    } catch {
      chatLoadState = .failed("Unable to load chat history")
      messages = []
      AppLogger.navigation.error("Chat hydrate failed for trip \(tripId, privacy: .public)")
    }
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
