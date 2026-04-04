with open('src/services/recommendationService.ts', 'r') as f:
    text = f.read()

# Make sure we import AdvertiserService if not already
import_stmt = "import { AdvertiserService } from '@/services/advertiserService';"
if import_stmt not in text:
    text = import_stmt + '\n' + text

# Update ImpressionParams and ClickParams
params_old = """export interface ImpressionParams {
  itemId: string;
  itemType: 'organic' | 'sponsored';
  userId?: string;
  tripId?: string;
  surface: 'recs_page' | 'trip_detail' | 'concierge' | 'home';
  position: number;
}"""
params_new = """export interface ImpressionParams {
  itemId: string;
  itemType: 'organic' | 'sponsored';
  userId?: string;
  tripId?: string;
  surface: 'recs_page' | 'trip_detail' | 'concierge' | 'home';
  position: number;
  campaignId?: string;
}"""
text = text.replace(params_old, params_new)

click_old = """export interface ClickParams {
  impressionId: string;
  action: 'view' | 'save' | 'book' | 'external_link' | 'add_to_trip' | 'hide';
}"""
click_new = """export interface ClickParams {
  impressionId: string;
  action: 'view' | 'save' | 'book' | 'external_link' | 'add_to_trip' | 'hide';
  campaignId?: string;
}"""
text = text.replace(click_old, click_new)

# Update trackImpression
track_imp_old = """  static async trackImpression(params: ImpressionParams): Promise<string | null> {
    // intentional: recommendation tables not yet in generated types
    const { data, error } = await (supabase as any)
      .from('recommendation_impressions')
      .insert({
        item_id: params.itemId,
        item_type: params.itemType,
        user_id: params.userId || null,
        trip_id: params.tripId || null,
        surface: params.surface,
        position: params.position,
      })
      .select('id')
      .maybeSingle();

    if (error) {
      // Tracking failures should not break the user experience
      return null;
    }

    return data?.id || null;
  }"""
track_imp_new = """  static async trackImpression(params: ImpressionParams): Promise<string | null> {
    // intentional: recommendation tables not yet in generated types
    const { data, error } = await (supabase as any)
      .from('recommendation_impressions')
      .insert({
        item_id: params.itemId,
        item_type: params.itemType,
        user_id: params.userId || null,
        trip_id: params.tripId || null,
        surface: params.surface,
        position: params.position,
      })
      .select('id')
      .maybeSingle();

    if (error) {
      // Tracking failures should not break the user experience
      return null;
    }

    // Wire up to advertiser platform for sponsored items
    if (params.itemType === 'sponsored' && params.campaignId) {
      AdvertiserService.trackEvent(params.campaignId, 'impression').catch(() => {});
    }

    return data?.id || null;
  }"""
text = text.replace(track_imp_old, track_imp_new)

# Update trackClick
track_click_old = """  static async trackClick(params: ClickParams): Promise<void> {
    // intentional: recommendation tables not yet in generated types
    const { error } = await (supabase as any).from('recommendation_clicks').insert({
      impression_id: params.impressionId,
      action: params.action,
    });

    if (error) {
      // Tracking failures should not break the user experience
    }
  }"""
track_click_new = """  static async trackClick(params: ClickParams): Promise<void> {
    // intentional: recommendation tables not yet in generated types
    const { error } = await (supabase as any).from('recommendation_clicks').insert({
      impression_id: params.impressionId,
      action: params.action,
    });

    if (error) {
      // Tracking failures should not break the user experience
    }

    // Wire up to advertiser platform for sponsored items
    if (params.campaignId) {
      // If it's a save action, track as save, else click
      const eventType = params.action === 'save' ? 'save' : 'click';
      AdvertiserService.trackEvent(params.campaignId, eventType).catch(() => {});
    }
  }"""
text = text.replace(track_click_old, track_click_new)

with open('src/services/recommendationService.ts', 'w') as f:
    f.write(text)
