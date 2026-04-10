import Foundation

public struct MockAuthProvider: AuthProviding {
  private let session: UserSession?

  public init(session: UserSession? = nil) {
    self.session = session
  }

  public func currentSession() async throws -> UserSession? {
    session
  }
}
