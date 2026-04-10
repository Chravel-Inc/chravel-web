import Foundation

enum AppDestination: String, CaseIterable, Identifiable {
  case dashboard
  case chat
  case calendar
  case tasks
  case payments
  case places
  case media
  case polls
  case documents
  case concierge

  var id: String { rawValue }

  var title: String {
    switch self {
    case .dashboard:
      return "Dashboard"
    case .chat:
      return "Chat"
    case .calendar:
      return "Calendar"
    case .tasks:
      return "Tasks"
    case .payments:
      return "Payments"
    case .places:
      return "Places"
    case .media:
      return "Media"
    case .polls:
      return "Polls"
    case .documents:
      return "Documents"
    case .concierge:
      return "AI Concierge"
    }
  }

  var systemImage: String {
    switch self {
    case .dashboard:
      return "square.grid.2x2"
    case .chat:
      return "message"
    case .calendar:
      return "calendar"
    case .tasks:
      return "checklist"
    case .payments:
      return "dollarsign.circle"
    case .places:
      return "map"
    case .media:
      return "photo.on.rectangle"
    case .polls:
      return "chart.bar"
    case .documents:
      return "doc.text"
    case .concierge:
      return "sparkles"
    }
  }
}
