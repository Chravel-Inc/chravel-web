import Foundation

public final class SupabaseChatRepository: @unchecked Sendable, ChatRepository {
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

  public func sendMessage(
    tripId: String,
    text: String,
    session: UserSession?,
    senderName: String?
  ) async throws -> ChatMessage {
    let payload = SupabaseChatInsertPayload(
      tripId: tripId,
      content: text,
      senderName: senderName,
      senderId: session?.userId,
    )

    let data = try JSONEncoder().encode([payload])
    let responseData = try await client.request(
      path: "/rest/v1/trip_chat_messages?select=id,trip_id,content,created_at,sender_name,sender_id",
      method: "POST",
      body: data,
      accessToken: session?.accessToken,
      additionalHeaders: ["Prefer": "return=representation"],
    )

    let rows = try JSONDecoder.supabase.decode([SupabaseChatRow].self, from: responseData)
    guard let row = rows.first else {
      throw SupabaseRESTError.invalidResponse
    }

    return ChatMessage(
      id: row.id,
      tripId: row.tripId,
      senderName: row.senderName ?? row.senderId ?? "Unknown",
      content: row.content,
      createdAt: row.createdAt,
    )
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

private struct SupabaseChatInsertPayload: Encodable {
  let tripId: String
  let content: String
  let senderName: String?
  let senderId: String?

  enum CodingKeys: String, CodingKey {
    case tripId = "trip_id"
    case content
    case senderName = "sender_name"
    case senderId = "sender_id"
  }
}
