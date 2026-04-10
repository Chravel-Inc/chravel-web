import Foundation

public struct UserSession: Equatable, Sendable {
  public let userId: String
  public let email: String?
  public let accessToken: String

  public init(userId: String, email: String?, accessToken: String) {
    self.userId = userId
    self.email = email
    self.accessToken = accessToken
  }
}
