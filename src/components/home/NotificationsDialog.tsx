import React from 'react';
import {
  Bell,
  MessageCircle,
  Calendar,
  Radio,
  BarChart2,
  FilePlus,
  Image,
  X,
  CheckSquare,
  DollarSign,
  UserPlus,
  MapPin,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useDemoMode } from '@/hooks/useDemoMode';
import { useNotificationRealtime } from '@/hooks/useNotificationRealtime';
import { mockNotifications } from '@/mockData/notifications';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';

interface Notification {
  id: string;
  type:
    | 'message'
    | 'broadcast'
    | 'calendar'
    | 'poll'
    | 'files'
    | 'photos'
    | 'chat'
    | 'mention'
    | 'task'
    | 'payment'
    | 'invite'
    | 'join_request'
    | 'basecamp'
    | 'system';
  title: string;
  description: string;
  tripId: string;
  tripName: string;
  timestamp: string;
  isRead: boolean;
  isHighPriority?: boolean;
  data?: Record<string, unknown>;
}

interface NotificationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type NotificationMetadata = Record<string, unknown>;

interface NavigationTarget {
  path: string;
  state?: {
    chatNavigationContext?: {
      source: 'notification';
      notificationId: string;
      messageId?: string;
      channelId?: string;
      channelType?: string;
      openThreadId?: string;
    };
  };
}

function getMetadataString(metadata: NotificationMetadata, key: string): string {
  const value = metadata[key];
  return typeof value === 'string' ? value : '';
}

function isJoinRequestApprovedNotification(notification: Notification): boolean {
  const action = String(notification.data?.action ?? '').toLowerCase();
  const type = String(notification.type ?? '').toLowerCase();
  const title = notification.title.toLowerCase();

  return (
    action === 'join_approved' ||
    type === 'join_approved' ||
    type === 'join_request_approved' ||
    title.includes('join request approved')
  );
}

function extractTripNameFromApprovalDescription(description: string): string | null {
  const match = description.match(/join\s+"([^"]+)"/i);
  return match?.[1]?.trim() || null;
}

function resolveNotificationTab(
  notification: Notification,
  metadata: NotificationMetadata,
): string | null {
  const notificationType = notification.type.toLowerCase();
  const metadataChannelType = getMetadataString(metadata, 'channel_type').toLowerCase();
  const metadataTab = getMetadataString(metadata, 'tab').toLowerCase();

  if (notificationType === 'mention') {
    return 'chat';
  }

  if (metadataTab) {
    return metadataTab;
  }

  if (metadataChannelType === 'chat' || metadataChannelType === 'messages') {
    return 'chat';
  }

  const tabMap: Record<string, string> = {
    message: 'chat',
    chat: 'chat',
    broadcast: 'broadcasts',
    calendar: 'calendar',
    task: 'tasks',
    payment: 'payments',
    poll: 'polls',
    photos: 'media',
    join_request: 'collaborators',
    basecamp: 'places',
  };

  return tabMap[notificationType] ?? null;
}

function buildNavigationTarget(
  notification: Notification,
  resolvedTripId: string,
  tripType: string,
  metadata: NotificationMetadata,
): NavigationTarget {
  const normalizedTripType = tripType.toLowerCase();
  let baseRoute = `/trip/${resolvedTripId}`;

  if (normalizedTripType === 'pro') {
    baseRoute = `/tour/pro/${resolvedTripId}`;
  } else if (normalizedTripType === 'event') {
    baseRoute = `/event/${resolvedTripId}`;
  }

  const tab = resolveNotificationTab(notification, metadata);
  const isJoinApproved = isJoinRequestApprovedNotification(notification);
  const path = !isJoinApproved && tab ? `${baseRoute}?tab=${tab}` : baseRoute;

  const messageId =
    getMetadataString(metadata, 'message_id') || getMetadataString(metadata, 'chat_message_id');
  const channelId =
    getMetadataString(metadata, 'channel_id') || getMetadataString(metadata, 'chat_channel_id');
  const channelType = getMetadataString(metadata, 'channel_type');
  const openThreadId = getMetadataString(metadata, 'thread_id');

  const shouldHandshakeChat = tab === 'chat' || notification.type.toLowerCase() === 'mention';

  if (!shouldHandshakeChat) {
    return { path };
  }

  return {
    path,
    state: {
      chatNavigationContext: {
        source: 'notification',
        notificationId: notification.id,
        ...(messageId && { messageId }),
        ...(channelId && { channelId }),
        ...(channelType && { channelType }),
        ...(openThreadId && { openThreadId }),
      },
    },
  };
}

function getNotificationIcon(type: string, isHighPriority?: boolean) {
  const iconClass = isHighPriority ? 'text-destructive' : 'text-muted-foreground';

  switch (type) {
    case 'message':
    case 'chat':
      return <MessageCircle size={16} className="text-blue-400" />;
    case 'broadcast':
      return <Radio size={16} className="text-red-400" />;
    case 'calendar':
      return <Calendar size={16} className="text-purple-400" />;
    case 'poll':
      return <BarChart2 size={16} className="text-cyan-400" />;
    case 'task':
      return <CheckSquare size={16} className="text-yellow-400" />;
    case 'payment':
      return <DollarSign size={16} className="text-green-400" />;
    case 'files':
      return <FilePlus size={16} className={iconClass} />;
    case 'photos':
      return <Image size={16} className="text-pink-400" />;
    case 'join_request':
      return <UserPlus size={16} className="text-orange-400" />;
    case 'basecamp':
      return <MapPin size={16} className="text-pink-400" />;
    default:
      return <Bell size={16} className={iconClass} />;
  }
}

export const NotificationsDialog = ({ open, onOpenChange }: NotificationsDialogProps) => {
  const { user } = useAuth();
  const { isDemoMode } = useDemoMode();
  const navigate = useNavigate();

  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } =
    useNotificationRealtime();

  const handleNotificationClick = async (notification: Notification) => {
    if (!isDemoMode && user) {
      await markAsRead(notification.id);
    }

    const notificationData = (notification.data || {}) as NotificationMetadata;
    let resolvedTripId =
      getMetadataString(notificationData, 'trip_id') || notification.tripId || '';
    let tripType =
      getMetadataString(notificationData, 'trip_type') ||
      getMetadataString(notificationData, 'tripType') ||
      '';

    if (!resolvedTripId && isJoinRequestApprovedNotification(notification)) {
      const tripNameCandidate =
        getMetadataString(notificationData, 'trip_name') ||
        notification.tripName ||
        extractTripNameFromApprovalDescription(notification.description) ||
        '';

      if (tripNameCandidate) {
        const { data: exactNameMatch } = await supabase
          .from('trips')
          .select('id, trip_type, created_at')
          .eq('name', tripNameCandidate)
          .order('created_at', { ascending: false })
          .limit(1);

        if (exactNameMatch && exactNameMatch.length > 0) {
          resolvedTripId = exactNameMatch[0].id;
          tripType = tripType || (exactNameMatch[0].trip_type as string);
        } else {
          const { data: fuzzyNameMatch } = await supabase
            .from('trips')
            .select('id, trip_type, created_at')
            .ilike('name', tripNameCandidate)
            .order('created_at', { ascending: false })
            .limit(1);

          if (fuzzyNameMatch && fuzzyNameMatch.length > 0) {
            resolvedTripId = fuzzyNameMatch[0].id;
            tripType = tripType || (fuzzyNameMatch[0].trip_type as string);
          }
        }
      }
    }

    if (!resolvedTripId) {
      onOpenChange(false);
      return;
    }

    const target = buildNavigationTarget(notification, resolvedTripId, tripType, notificationData);
    navigate(target.path, target.state ? { state: target.state } : undefined);

    onOpenChange(false);
  };

  const handleMarkAllAsRead = async () => {
    if (!isDemoMode && user) {
      await markAllAsRead(notifications);
    }
  };

  const handleClearAll = async () => {
    if (!isDemoMode && user) {
      await clearAll(notifications);
    }
  };

  // Demo mode: use mock data (hook returns empty when isDemoMode)
  const displayNotifications = isDemoMode
    ? mockNotifications.map(n => ({
        id: n.id,
        type: n.type as Notification['type'],
        title: n.title,
        description: n.message,
        tripId: n.tripId,
        tripName: n.data?.trip_name || 'Demo Trip',
        timestamp: formatDistanceToNow(new Date(n.timestamp), { addSuffix: true }),
        isRead: n.read,
        isHighPriority: n.type === 'broadcast',
        data: { ...n.data, tripType: n.tripType },
      }))
    : notifications;

  const displayUnreadCount = isDemoMode
    ? mockNotifications.filter(n => !n.read).length
    : unreadCount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showClose={false}
        className="sm:max-w-[500px] max-h-[80vh] bg-card/95 backdrop-blur-xl border-2 border-border/50 text-foreground p-0"
      >
        <DialogHeader className="p-4 border-b border-border/50">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">Notifications</DialogTitle>
            <DialogClose asChild>
              <button
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                aria-label="Close notifications"
              >
                <X size={18} />
              </button>
            </DialogClose>
          </div>

          {displayNotifications.length > 0 && (
            <div className="flex items-center gap-4 mt-3 pt-2">
              {displayUnreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-sm text-primary hover:text-primary/80 hover:bg-primary/10 transition-colors font-medium px-3 py-1.5 rounded-lg"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={handleClearAll}
                className="text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors font-medium px-3 py-1.5 rounded-lg"
              >
                Clear all
              </button>
            </div>
          )}
        </DialogHeader>

        <div className="max-h-[calc(80vh-8rem)] overflow-y-auto">
          {displayNotifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell size={32} className="mx-auto mb-2 opacity-50" />
              <p>No notifications yet</p>
            </div>
          ) : (
            displayNotifications.map(notification => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={cn(
                  'p-4 border-b border-border/50 hover:bg-accent/10 cursor-pointer transition-colors',
                  !notification.isRead && 'bg-accent/5',
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {getNotificationIcon(notification.type, notification.isHighPriority)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p
                        className={cn(
                          'text-sm font-medium',
                          !notification.isRead ? 'text-foreground' : 'text-muted-foreground',
                        )}
                      >
                        {notification.title}
                      </p>
                      {notification.isHighPriority && (
                        <div className="w-2 h-2 bg-destructive rounded-full"></div>
                      )}
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-1 truncate">
                      {notification.description}
                    </p>
                    {isJoinRequestApprovedNotification(notification) && (
                      <p className="text-[11px] text-primary/85 mb-1">Tap to open trip</p>
                    )}
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground/70">{notification.tripName}</p>
                      <p className="text-xs text-muted-foreground/70">{notification.timestamp}</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="mt-1 text-muted-foreground/60" />
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
