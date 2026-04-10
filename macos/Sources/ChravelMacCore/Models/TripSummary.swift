import Foundation

public struct TripSummary: Equatable, Identifiable, Sendable {
  public let id: String
  public let title: String
  public let destination: String?
  public let startDate: Date?
  public let endDate: Date?

  public init(id: String, title: String, destination: String?, startDate: Date?, endDate: Date?) {
    self.id = id
    self.title = title
    self.destination = destination
    self.startDate = startDate
    self.endDate = endDate
  }
}
