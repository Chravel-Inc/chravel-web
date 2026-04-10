import Foundation
import OSLog

enum AppLogger {
  static let subsystem = "com.chravel.macos"

  static let app = Logger(subsystem: subsystem, category: "app")
  static let auth = Logger(subsystem: subsystem, category: "auth")
  static let navigation = Logger(subsystem: subsystem, category: "navigation")

  static func event(_ message: StaticString, category: Logger = app) {
    category.info(message)
  }
}
