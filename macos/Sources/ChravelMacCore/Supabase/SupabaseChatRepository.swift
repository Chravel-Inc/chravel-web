import Foundation

public final class SupabaseChatRepository: ChatRepository {
  private let client: SupabaseRESTClient

  public init(client: SupabaseRESTClient) {
    self.client = client
  }

  public func fetchRecentMessages(tripId: String, session: UserSession?) async throws -> [ChatMessage] {
    let encodedTripId = tripId.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? tripId
    let query =
      "/rest/v1/trip_chat_messages?select=id,trip_id,content,created_at,sender_name,sender_id&trip_id=eq.\(encodedTripId)&order=created_at.asc&limit=200"

    let data = try await client.request(path: query, accessToken: session?.accessToken)
    let rows = try JSONDecoder.supabase.decode([SupabaseChatRow].self, from: data)

    return rows.map {
      ChatMessage(
        id: $0.id,
        tripId: $0.tripId,
        senderName: $0.senderName ?? $0.senderId ?? "Unknown",
        content: $0.content,
        createdAt: $0.createdAt,
      )
    }
  }
}

private struct SupabaseChatRow: Decodable {
  let id: String
  let tripId: String
  let content: String
  let createdAt: Date
  let senderName: String?
  let senderId: String?

  enum CodingKeys: String, CodingKey {
    case id
    case tripId = "trip_id"
    case content
    case createdAt = "created_at"
    case senderName = "sender_name"
    case senderId = "sender_id"
  }
}
