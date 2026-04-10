import Foundation

public struct PollingChatRealtimeService: ChatRealtimeService {
  private let chatRepository: ChatRepository
  private let intervalSeconds: Duration

  public init(chatRepository: ChatRepository, intervalSeconds: Duration = .seconds(6)) {
    self.chatRepository = chatRepository
    self.intervalSeconds = intervalSeconds
  }

  public func connect(tripId: String, session: UserSession?) -> AsyncThrowingStream<[ChatMessage], Error> {
    let repository = chatRepository
    let interval = intervalSeconds

    return AsyncThrowingStream { continuation in
      let task = Task {
        do {
          while !Task.isCancelled {
            let messages = try await repository.fetchRecentMessages(tripId: tripId, session: session)
            continuation.yield(messages)
            try await Task.sleep(for: interval)
          }
          continuation.finish()
        } catch {
          continuation.finish(throwing: error)
        }
      }

      continuation.onTermination = { _ in
        task.cancel()
      }
    }
  }
}
