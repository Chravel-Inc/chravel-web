import ChravelMacCore
import Foundation
#if canImport(FoundationNetworking)
import FoundationNetworking
#endif
import XCTest

final class SupabaseTripRepositoryTests: XCTestCase {
  func testFetchTripsDecodesRows() async throws {
    let responseBody = """
    [
      {
        "id": "trip-123",
        "title": "Austin Sprint",
        "destination": "Austin",
        "start_date": "2026-05-01T00:00:00Z",
        "end_date": "2026-05-05T00:00:00Z"
      }
    ]
    """.data(using: .utf8)!

    let configuration = URLSessionConfiguration.ephemeral
    configuration.protocolClasses = [MockURLProtocol.self]
    let session = URLSession(configuration: configuration)

    MockURLProtocol.handler = { request in
      XCTAssertEqual(request.value(forHTTPHeaderField: "apikey"), "anon")
      XCTAssertEqual(request.value(forHTTPHeaderField: "Authorization"), "Bearer token")

      return (
        HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!,
        responseBody
      )
    }

    let config = SupabaseConfig(projectURL: URL(string: "https://demo.supabase.co")!, anonKey: "anon")
    let client = SupabaseRESTClient(config: config, session: session)
    let repository = SupabaseTripRepository(client: client)

    let trips = try await repository.fetchTrips(
      session: UserSession(userId: "u1", email: "dev@chravel.app", accessToken: "token")
    )

    XCTAssertEqual(trips.count, 1)
    XCTAssertEqual(trips.first?.id, "trip-123")
    XCTAssertEqual(trips.first?.destination, "Austin")
  }
}

private final class MockURLProtocol: URLProtocol, @unchecked Sendable {
  nonisolated(unsafe) static var handler: (@Sendable (URLRequest) throws -> (HTTPURLResponse, Data))?

  override class func canInit(with request: URLRequest) -> Bool { true }
  override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }

  override func startLoading() {
    guard let handler = MockURLProtocol.handler else {
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
