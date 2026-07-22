class GamificationService {
  getDaysUntilTrip(tripId: string): number {
    // Mock implementation - replace with real trip dates
    const mockDates: Record<string, string> = {
      '1': '2024-03-15',
      '4': '2024-02-20',
      '6': '2024-04-01',
      '7': '2024-03-08',
    };

    const tripDate = mockDates[tripId];
    if (!tripDate) return 0;

    const now = new Date();
    const trip = new Date(tripDate);
    const diffTime = trip.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return Math.max(diffDays, 0);
  }

  getTripMomentum(tripId: string): 'hot' | 'warm' | 'cold' {
    // Mock implementation based on recent activity
    const recentActivity: Record<string, number> = {
      '1': 5, // 5 activities in last 24h
      '4': 12, // High activity
      '6': 2,
      '7': 1,
    };

    const activity = recentActivity[tripId] || 0;

    if (activity >= 8) return 'hot';
    if (activity >= 3) return 'warm';
    return 'cold';
  }
}

export const gamificationService = new GamificationService();
