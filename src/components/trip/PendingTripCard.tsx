import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, MapPin, CalendarDays } from 'lucide-react';
import { format } from 'date-fns';

interface PendingTripCardProps {
  tripId: string;
  tripName: string;
  destination?: string;
  startDate?: string;
  coverImage?: string;
  requestedAt: string;
  /** When set, replaces the default "Pending Approval" badge (e.g. inbound join requests). */
  statusBadge?: string;
  /** Secondary line under the title (e.g. requester name for inbound requests). */
  subtitle?: string;
  /** When true, card is clickable and shows a primary CTA instead of disabled styling. */
  interactive?: boolean;
  ctaLabel?: string;
  ctaVariant?: 'default' | 'destructive';
  onCta?: () => void;
  isCtaLoading?: boolean;
  secondaryCtaLabel?: string;
  onSecondaryCta?: () => void;
  isSecondaryCtaLoading?: boolean;
  ctaVariant?: 'default' | 'destructive';
  disabledCta?: boolean;
}

export const PendingTripCard: React.FC<PendingTripCardProps> = ({
  tripId: _tripId,
  tripName,
  destination,
  startDate,
  coverImage,
  requestedAt,
  statusBadge = 'Pending Approval',
  subtitle,
  interactive = false,
  ctaLabel,
  ctaVariant = 'default',
  onCta,
  isCtaLoading = false,
  secondaryCtaLabel,
  onSecondaryCta,
  isSecondaryCtaLoading = false,
  disabledCta = false,
}) => {
  const isCtaDisabled = disabledCta || isCtaLoading;
  const ctaClassName =
    ctaVariant === 'destructive'
      ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
      : 'bg-primary text-primary-foreground hover:bg-primary/90';

  return (
    <Card
      className={`relative overflow-hidden bg-card/50 border-border ${
        interactive ? 'hover:border-primary/40 transition-colors' : 'opacity-60 cursor-not-allowed'
      }`}
    >
      {/* Pending Badge */}
      <div className="absolute top-3 right-3 z-10">
        <div className="flex items-center gap-1.5 bg-yellow-500/20 text-yellow-400 px-3 py-1.5 rounded-full text-xs font-medium">
          <Clock className="w-3.5 h-3.5" />
          {statusBadge}
        </div>
      </div>

      {/* Cover Image with Gray Overlay */}
      <div className="relative h-32 bg-muted">
        {coverImage ? (
          <img
            src={coverImage}
            alt={tripName}
            className="w-full h-full object-cover grayscale"
            onError={e => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-muted to-muted-foreground/20" />
        )}
        <div className="absolute inset-0 bg-background/40" />
      </div>

      <CardContent className="p-4">
        <h3
          className={`text-lg font-semibold mb-1 line-clamp-1 ${interactive ? 'text-foreground' : 'text-muted-foreground'}`}
        >
          {tripName}
        </h3>
        {subtitle && <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{subtitle}</p>}

        {destination && (
          <div className="flex items-center gap-2 text-muted-foreground/70 text-sm mb-1">
            <MapPin className="w-4 h-4 gold-gradient-icon" />
            <span>{destination}</span>
          </div>
        )}

        {startDate && (
          <div className="flex items-center gap-2 text-muted-foreground/70 text-sm mb-3">
            <CalendarDays className="w-4 h-4 gold-gradient-icon" />
            <span>{format(new Date(startDate), 'MMM d, yyyy')}</span>
          </div>
        )}

        <p className="text-xs text-muted-foreground/60">
          Requested {format(new Date(requestedAt), 'MMM d, yyyy')}
        </p>
        {ctaLabel && onCta && (
          <button
            type="button"
            className={`mt-3 w-full text-sm font-medium rounded-lg py-2.5 px-3 min-h-[44px] transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${ctaClassName}`}
            onClick={onCta}
            disabled={isCtaDisabled}
          >
            {ctaLabel}
          </button>
        )}
        {!interactive && secondaryCtaLabel && onSecondaryCta && (
          <button
            type="button"
            className="mt-3 w-full text-sm font-medium rounded-lg border border-border/80 bg-background/30 py-2.5 px-3 hover:bg-background/50 min-h-[44px] text-foreground disabled:opacity-60 disabled:cursor-not-allowed"
            onClick={onSecondaryCta}
            disabled={isSecondaryCtaLoading}
          >
            {isSecondaryCtaLoading ? 'Canceling…' : secondaryCtaLabel}
          </button>
        )}
      </CardContent>
    </Card>
  );
};
