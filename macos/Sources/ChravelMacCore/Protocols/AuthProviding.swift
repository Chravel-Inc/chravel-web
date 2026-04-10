import Foundation

public protocol AuthProviding {
  func currentSession() async throws -> UserSession?
}
