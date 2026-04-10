import ChravelMacCore
import Foundation
#if canImport(FoundationNetworking)
import FoundationNetworking
#endif
import XCTest

final class SupabaseChatRepositoryTests: XCTestCase {
  func testFetchRecentMessagesDecodesSenderFallback() async throws {
    let responseBody = """
    [
      {
        "id": "chat-1",
        "trip_id": "trip-42",
        "content": "Bus leaves at 7",
        "created_at": "2026-09-01T12:00:00Z",
        "sender_name": null,
        "sender_id": "user-77"
      }
    ]
    """.data(using: .utf8)!

    let configuration = URLSessionConfiguration.ephemeral
    configuration.protocolClasses = [ChatMockURLProtocol.self]
    let session = URLSession(configuration: configuration)

    ChatMockURLProtocol.handler = { request in
      XCTAssertTrue(request.url?.absoluteString.contains("trip_chat_messages") == true)
      return (
        HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!,
        responseBody
      )
    }

    let config = SupabaseConfig(projectURL: URL(string: "https://demo.supabase.co")!, anonKey: "anon")
    let client = SupabaseRESTClient(config: config, session: session)
    let repository = SupabaseChatRepository(client: client)

    let messages = try await repository.fetchRecentMessages(
      tripId: "trip-42",
      session: UserSession(userId: "u1", email: nil, accessToken: "token")
    )

    XCTAssertEqual(messages.count, 1)
    XCTAssertEqual(messages.first?.senderName, "user-77")
    XCTAssertEqual(messages.first?.content, "Bus leaves at 7")
  }
}

private final class ChatMockURLProtocol: URLProtocol, @unchecked Sendable {
  nonisolated(unsafe) static var handler: (@Sendable (URLRequest) throws -> (HTTPURLResponse, Data))?

  override class func canInit(with request: URLRequest) -> Bool { true }
  override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }

  override func startLoading() {
    guard let handler = ChatMockURLProtocol.handler else {
      fatalError("Handler not set")
    }

    do {
      let (response, data) = try handler(request)
      client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
      client?.urlProtocol(self, didLoad: data)
      client?.urlProtocolDidFinishLoading(self)
    } catch {
      client?.urlProtocol(self, didFailWithError: error)
    }
  }

  override func stopLoading() {}
}
