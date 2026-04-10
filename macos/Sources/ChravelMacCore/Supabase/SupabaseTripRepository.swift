import Foundation

public final class SupabaseTripRepository: TripRepository {
  private let client: SupabaseRESTClient

  public init(client: SupabaseRESTClient) {
    self.client = client
  }

  public func fetchTrips(session: UserSession?) async throws -> [TripSummary] {
    let query = "/rest/v1/trips?select=id,title,destination,start_date,end_date&order=start_date.desc.nullslast"
    let data = try await client.request(path: query, accessToken: session?.accessToken)
    let rows = try JSONDecoder.supabase.decode([SupabaseTripRow].self, from: data)

    return rows.map {
      TripSummary(
        id: $0.id,
        title: $0.title,
        destination: $0.destination,
        startDate: $0.startDate,
        endDate: $0.endDate,
      )
    }
  }
}

private struct SupabaseTripRow: Decodable {
  let id: String
  let title: String
  let destination: String?
  let startDate: Date?
  let endDate: Date?

  enum CodingKeys: String, CodingKey {
    case id
    case title
    case destination
    case startDate = "start_date"
    case endDate = "end_date"
  }
}

private extension JSONDecoder {
  static var supabase: JSONDecoder {
    let decoder = JSONDecoder()
    decoder.dateDecodingStrategy = .iso8601
    return decoder
  }
}
