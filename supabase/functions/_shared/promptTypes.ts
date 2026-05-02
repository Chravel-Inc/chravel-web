export type TripMemberForPrompt = {
  displayName?: string | null;
  name?: string | null;
  role?: string | null;
  userId?: string | null;
  id?: string | null;
};

export type TripCalendarEventForPrompt = {
  title?: string | null;
  startTime?: string | null;
  date?: string | null;
  endTime?: string | null;
  location?: string | null;
  description?: string | null;
};

export type TripTaskForPrompt = {
  title?: string | null;
  dueAt?: string | null;
  due_at?: string | null;
  completed?: boolean;
  assignee?: string | null;
  creatorName?: string | null;
};

export type TripPollOptionForPrompt = {
  text?: string | null;
  option_text?: string | null;
  votes?: number | null;
  vote_count?: number | null;
};

export type TripPollForPrompt = {
  question?: string | null;
  status?: string | null;
  options?: TripPollOptionForPrompt[];
};

export type TripPaymentForPrompt = {
  description?: string | null;
  amount?: number | null;
  currency?: string | null;
  createdByName?: string | null;
  created_by_name?: string | null;
  isSettled?: boolean;
  is_settled?: boolean;
};

export type TripPlaceForPrompt = {
  title?: string | null;
  name?: string | null;
  address?: string | null;
  category?: string | null;
};

export type TripLinkForPrompt = {
  title?: string | null;
  url?: string | null;
};

export type TripBroadcastForPrompt = {
  message?: string | null;
  priority?: string | null;
  createdByName?: string | null;
};

export type TripContextForPrompt = {
  tripMetadata?: {
    title?: string | null;
    id?: string | null;
    destination?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    description?: string | null;
  };
  places?: {
    tripBasecamp?: {
      name?: string | null;
      address?: string | null;
      lat?: number | null;
      lng?: number | null;
    };
    savedPlaces?: TripPlaceForPrompt[];
  };
  userPreferences?: {
    dietary?: string[];
    vibe?: string[];
    accessibility?: string[];
    business?: string[];
    entertainment?: string[];
    budget?: string | null;
    timePreference?: string | null;
    travelStyle?: string | null;
  };
  members?: TripMemberForPrompt[];
  calendar?: TripCalendarEventForPrompt[];
  upcomingEvents?: TripCalendarEventForPrompt[];
  tasks?: TripTaskForPrompt[];
  polls?: TripPollForPrompt[];
  payments?: TripPaymentForPrompt[];
  links?: TripLinkForPrompt[];
  broadcasts?: TripBroadcastForPrompt[];
};
