import type { DashboardJoinRequest } from '@/hooks/useDashboardJoinRequests';

interface RequestTripCardData {
  id: string;
  title: string;
  location: string;
  dateRange: string;
  participants: [];
  coverPhoto?: string;
  peopleCount: number;
  placesCount?: number;
}

const parseDateOnly = (date: string): Date => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return new Date(`${date}T00:00:00`);
  }
  return new Date(date);
};

const formatDateLabel = (date: string): string => {
  const parsed = parseDateOnly(date);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const formatRequestDateRange = (startDate?: string, endDate?: string | null): string => {
  const startLabel = startDate ? formatDateLabel(startDate) : '';
  if (!startLabel) return 'Date TBD';
  const endLabel = endDate ? formatDateLabel(endDate) : '';
  if (!endLabel || endLabel === startLabel) return startLabel;
  return `${startLabel} - ${endLabel}`;
};

export const mapOutboundRequestToTripCard = (
  request: DashboardJoinRequest,
): RequestTripCardData => ({
  id: request.trip_id,
  title: request.trip?.name?.trim() || 'Untitled trip',
  location: request.trip?.destination?.trim() || 'Destination unavailable',
  dateRange: formatRequestDateRange(request.trip?.start_date, request.trip?.end_date),
  participants: [],
  coverPhoto: request.trip?.cover_image_url,
  peopleCount: Math.max(1, request.trip?.member_count ?? 1),
  placesCount: undefined,
});
