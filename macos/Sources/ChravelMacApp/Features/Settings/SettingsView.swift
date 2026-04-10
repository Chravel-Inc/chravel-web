import SwiftUI

struct SettingsView: View {
  var body: some View {
    Form {
      Section("General") {
        Text("Native macOS shell initialized")
          .font(.callout)
          .foregroundStyle(.secondary)
      }
      Section("Roadmap") {
        Label("Supabase auth/session", systemImage: "person.badge.key")
        Label("Realtime coordinator", systemImage: "dot.radiowaves.left.and.right")
        Label("Feature parity modules", systemImage: "checklist")
      }
    }
    .padding(16)
    .frame(width: 420)
  }
}
