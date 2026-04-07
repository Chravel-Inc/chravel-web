import type { ConciergeChatMessage } from '@/hooks/useConciergeHistory';

/**
 * Pre-seeded concierge conversation history for demo mode screenshots.
 * Based on real user conversations (luxury travel planning, hotel saves, flight search).
 * Keyed by demo trip ID.
 */
export const DEMO_CONCIERGE_HISTORY: Record<string, ConciergeChatMessage[]> = {
  '8': [
    // Exchange 1: Itinerary request
    {
      id: 'demo-q1',
      type: 'user',
      content:
        'Make me an itinerary for our group — we want luxury hotels with ocean views and a mix of relaxation and adventure',
      timestamp: '2026-03-15T14:00:00Z',
    },
    {
      id: 'demo-a1',
      type: 'assistant',
      content:
        "Here's a curated 7-day itinerary combining wellness, adventure, and luxury:\n\n**Days 1-2: Arrival & Beach Relaxation**\n- Check in at **AZULIK Tulum** (ocean-view treehouse suites)\n- Private cenote tour at Gran Cenote\n- Sunset dinner at Hartwood\n\n**Days 3-4: Adventure**\n- Snorkeling at the Mesoamerican Reef\n- Day trip to Coba ruins\n- Cooking class with a local chef\n\n**Days 5-7: Wellness & Culture**\n- Temazcal ceremony at Holistika\n- Paddleboard yoga at dawn\n- Farewell dinner at Arca",
      timestamp: '2026-03-15T14:00:30Z',
    },

    // Exchange 2: Save hotels to Places
    {
      id: 'demo-q2',
      type: 'user',
      content:
        'Can you save the top hotel options to Places so the group can vote on where to stay?',
      timestamp: '2026-03-15T14:05:00Z',
    },
    {
      id: 'demo-a2',
      type: 'assistant',
      content:
        "I've saved 4 luxury hotel options to your **Places** tab:\n\n1. **AZULIK Tulum** — Ocean-view treehouse suites, adults-only\n2. **Habitas Tulum** — Beach club + wellness retreat\n3. **Papaya Playa Project** — Beachfront cabanas with DJ nights\n4. **Be Tulum** — Rooftop pools overlooking the Caribbean\n\nYour group can view, vote, and discuss them in the Places tab.",
      timestamp: '2026-03-15T14:05:30Z',
      conciergeActions: [
        {
          actionType: 'savePlace',
          success: true,
          message: 'Saved AZULIK Tulum to Places',
          entityName: 'AZULIK Tulum',
          status: 'success',
        },
        {
          actionType: 'savePlace',
          success: true,
          message: 'Saved Habitas Tulum to Places',
          entityName: 'Habitas Tulum',
          status: 'success',
        },
        {
          actionType: 'savePlace',
          success: true,
          message: 'Saved Papaya Playa Project to Places',
          entityName: 'Papaya Playa Project',
          status: 'success',
        },
        {
          actionType: 'savePlace',
          success: true,
          message: 'Saved Be Tulum to Places',
          entityName: 'Be Tulum',
          status: 'success',
        },
      ],
    },

    // Exchange 3: Flight search
    {
      id: 'demo-q3',
      type: 'user',
      content:
        "Find afternoon flight options from ATL to Cancun for late March — we'll drive down to Tulum from there",
      timestamp: '2026-03-15T14:10:00Z',
    },
    {
      id: 'demo-a3',
      type: 'assistant',
      content:
        'Here are the best afternoon options from Atlanta (ATL) to Cancun (CUN) on **March 28th, 2026**:\n\n1. **Delta Air Lines (Nonstop)** — Departs 1:45 PM · $387 · 2h 55m\n2. **American Airlines (Nonstop)** — Departs 3:20 PM · $412 · 3h 05m\n3. **United Airlines (1 stop)** — Departs 12:30 PM · $329 · 5h 40m\n\nThe Delta nonstop is the best value for a quick afternoon departure. Want me to add any of these to the trip calendar?',
      timestamp: '2026-03-15T14:10:30Z',
    },
  ],
};
