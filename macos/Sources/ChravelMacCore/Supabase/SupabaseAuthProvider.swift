import Foundation

public final class SupabaseAuthProvider: AuthProviding {
  private let client: SupabaseRESTClient
  private let accessToken: String?

  public init(client: SupabaseRESTClient, accessToken: String?) {
    self.client = client
    self.accessToken = accessToken
  }

  public func currentSession() async throws -> UserSession? {
    guard let accessToken, !accessToken.isEmpty else {
      return nil
    }

    let data = try await client.request(path: "/auth/v1/user", accessToken: accessToken)
    let payload = try JSONDecoder().decode(SupabaseUserPayload.self, from: data)

    return UserSession(userId: payload.id, email: payload.email, accessToken: accessToken)
  }
}

private struct SupabaseUserPayload: Decodable {
  let id: String
  let email: String?
}
