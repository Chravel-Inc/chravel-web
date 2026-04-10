import Foundation

public struct SupabaseConfig: Sendable {
  public let projectURL: URL
  public let anonKey: String

  public init(projectURL: URL, anonKey: String) {
    self.projectURL = projectURL
    self.anonKey = anonKey
  }

  public static func fromEnvironment(_ env: [String: String] = ProcessInfo.processInfo.environment) -> SupabaseConfig? {
    guard
      let rawURL = env["CHRAVEL_SUPABASE_URL"],
      let projectURL = URL(string: rawURL),
      let anonKey = env["CHRAVEL_SUPABASE_ANON_KEY"],
      !anonKey.isEmpty
    else {
      return nil
    }

    return SupabaseConfig(projectURL: projectURL, anonKey: anonKey)
  }
}
