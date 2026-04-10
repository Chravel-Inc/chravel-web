import Foundation

public protocol ChatRealtimeService {
  func connect(
    tripId: String,
    session: UserSession?
  ) -> AsyncThrowingStream<[ChatMessage], Error>
}
