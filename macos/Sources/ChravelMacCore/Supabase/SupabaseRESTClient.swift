import Foundation
#if canImport(FoundationNetworking)
import FoundationNetworking
#endif

public enum SupabaseRESTError: Error, Equatable {
  case invalidResponse
  case unexpectedStatus(Int)
}

public struct SupabaseRESTClient {
  private let config: SupabaseConfig
  private let session: URLSession

  public init(config: SupabaseConfig, session: URLSession = .shared) {
    self.config = config
    self.session = session
  }

  public func request(path: String, accessToken: String?) async throws -> Data {
    let url = config.projectURL.appending(path: path)
    var request = URLRequest(url: url)
    request.setValue("application/json", forHTTPHeaderField: "Accept")
    request.setValue(config.anonKey, forHTTPHeaderField: "apikey")

    if let accessToken {
      request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
    }

    let (data, response) = try await session.data(for: request)

    guard let http = response as? HTTPURLResponse else {
      throw SupabaseRESTError.invalidResponse
    }

    guard (200...299).contains(http.statusCode) else {
      throw SupabaseRESTError.unexpectedStatus(http.statusCode)
    }

    return data
  }
}
