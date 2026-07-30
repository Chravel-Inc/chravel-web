import React from 'react';
import {
  CalendarPlus,
  CheckSquare,
  BarChart3,
  MapPin,
  Home,
  ListChecks,
  ExternalLink,
  AlertTriangle,
  Copy,
  Trash2,
  DollarSign,
  Megaphone,
  Bell,
  Image,
  Settings2,
  CalendarClock,
  Sparkles,
} from 'lucide-react';

export type ActionResultStatus = 'success' | 'failure' | 'duplicate' | 'skipped';

export interface ConciergeActionResult {
  actionType: string;
  success: boolean;
  message: string;
  entityId?: string;
  entityName?: string;
  scope?: string;
  /** Distinguishes duplicate/skipped from outright failure */
  status?: ActionResultStatus;
}

export type ConciergeNavigateHandler = (
  tab: string,
  meta?: { entityId?: string; createPoll?: boolean },
) => void;

interface ConciergeActionCardProps {
  action: ConciergeActionResult;
  onNavigate?: ConciergeNavigateHandler;
}

interface ActionConfig {
  icon: React.ElementType;
  label: string;
  /** Trip tab for the "View" affordance; omit for actions with no landing tab */
  tab?: string;
  color: string;
  /** Explicit titles for labels that already contain a verb ("Task Updated") —
   *  the default "<label> created" grammar breaks for those. */
  successTitle?: string;
  failureTitle?: string;
}

const ACTION_CONFIG: Record<string, ActionConfig> = {
  add_to_calendar: {
    icon: CalendarPlus,
    label: 'Calendar Event',
    tab: 'calendar',
    color: 'blue',
  },
  create_task: {
    icon: CheckSquare,
    label: 'Task',
    tab: 'tasks',
    color: 'green',
  },
  create_poll: {
    icon: BarChart3,
    label: 'Poll',
    tab: 'polls',
    color: 'purple',
  },
  save_place: {
    icon: MapPin,
    label: 'Saved Place',
    tab: 'places',
    color: 'orange',
  },
  set_basecamp: {
    icon: Home,
    label: 'Basecamp',
    tab: 'places',
    color: 'indigo',
  },
  add_to_agenda: {
    icon: ListChecks,
    label: 'Agenda Item',
    tab: 'agenda',
    color: 'teal',
  },
  save_link: {
    icon: MapPin,
    label: 'Saved Link',
    tab: 'places',
    color: 'orange',
  },
  update_task: {
    icon: CheckSquare,
    label: 'Task Updated',
    tab: 'tasks',
    color: 'green',
    successTitle: 'Task updated',
    failureTitle: 'Failed to update task',
  },
  close_poll: {
    icon: BarChart3,
    label: 'Poll Closed',
    tab: 'polls',
    color: 'purple',
    successTitle: 'Poll closed',
    failureTitle: 'Failed to close poll',
  },
  delete_task: {
    icon: Trash2,
    label: 'Task Deleted',
    tab: 'tasks',
    color: 'red',
    successTitle: 'Task deleted',
    failureTitle: 'Failed to delete task',
  },
  // ── Calendar mutations beyond create ──────────────────────────────────
  update_calendar_event: {
    icon: CalendarClock,
    label: 'Event Updated',
    tab: 'calendar',
    color: 'blue',
    successTitle: 'Event updated',
    failureTitle: 'Failed to update event',
  },
  move_calendar_event: {
    icon: CalendarClock,
    label: 'Event Moved',
    tab: 'calendar',
    color: 'blue',
    successTitle: 'Event moved',
    failureTitle: 'Failed to move event',
  },
  delete_calendar_event: {
    icon: Trash2,
    label: 'Event Deleted',
    tab: 'calendar',
    color: 'red',
    successTitle: 'Event deleted',
    failureTitle: 'Failed to delete event',
  },
  bulk_delete_result: {
    icon: Trash2,
    label: 'Events Deleted',
    tab: 'calendar',
    color: 'red',
    successTitle: 'Events deleted',
    failureTitle: 'Failed to delete events',
  },
  duplicate_calendar_event: {
    icon: Copy,
    label: 'Event Duplicated',
    tab: 'calendar',
    color: 'blue',
    successTitle: 'Event duplicated',
    failureTitle: 'Failed to duplicate event',
  },
  clone_activity: {
    icon: Copy,
    label: 'Activity Cloned',
    tab: 'calendar',
    color: 'blue',
    successTitle: 'Activity cloned',
    failureTitle: 'Failed to clone activity',
  },
  make_reservation: {
    icon: CalendarPlus,
    label: 'Reservation',
    tab: 'calendar',
    color: 'blue',
  },
  // ── Tasks beyond create ───────────────────────────────────────────────
  bulk_mark_tasks_done: {
    icon: CheckSquare,
    label: 'Tasks Completed',
    tab: 'tasks',
    color: 'green',
    successTitle: 'Tasks marked complete',
    failureTitle: 'Failed to complete tasks',
  },
  split_task_assignments: {
    icon: ListChecks,
    label: 'Tasks Assigned',
    tab: 'tasks',
    color: 'green',
    successTitle: 'Tasks created and assigned',
    failureTitle: 'Failed to assign tasks',
  },
  // ── Payments ──────────────────────────────────────────────────────────
  add_expense: {
    icon: DollarSign,
    label: 'Expense',
    tab: 'payments',
    color: 'green',
    successTitle: 'Expense logged',
    failureTitle: 'Failed to log expense',
  },
  settle_expense: {
    icon: DollarSign,
    label: 'Expense Settled',
    tab: 'payments',
    color: 'green',
    successTitle: 'Expense settled',
    failureTitle: 'Failed to settle expense',
  },
  // ── Comms ─────────────────────────────────────────────────────────────
  create_broadcast: {
    icon: Megaphone,
    label: 'Broadcast',
    tab: 'chat',
    color: 'orange',
    successTitle: 'Broadcast sent',
    failureTitle: 'Failed to send broadcast',
  },
  create_notification: {
    icon: Bell,
    label: 'Reminder',
    color: 'orange',
    successTitle: 'Reminder scheduled',
    failureTitle: 'Failed to schedule reminder',
  },
  // ── Trip-level ────────────────────────────────────────────────────────
  update_trip_details: {
    icon: Settings2,
    label: 'Trip Details Updated',
    color: 'indigo',
    successTitle: 'Trip details updated',
    failureTitle: 'Failed to update trip details',
  },
  generate_trip_image: {
    icon: Image,
    label: 'Trip Image',
    color: 'indigo',
    successTitle: 'Trip image generated',
    failureTitle: 'Failed to generate trip image',
  },
  set_trip_header: {
    icon: Image,
    label: 'Trip Header Updated',
    color: 'indigo',
    successTitle: 'Trip header updated',
    failureTitle: 'Failed to update trip header',
  },
};

/** Humanize an unknown snake_case action type: "some_future_tool" → "Some future tool". */
function humanizeActionType(actionType: string): string {
  const words = actionType.replace(/[_-]+/g, ' ').trim();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : 'Action';
}

/**
 * Resolve display config for an action type. Unknown types get a generic
 * fallback card instead of rendering nothing — a successful write must always
 * produce visible confirmation (new executor actionTypes appear before the UI
 * map learns about them).
 */
function getActionConfig(actionType: string): ActionConfig {
  return (
    ACTION_CONFIG[actionType] ?? {
      icon: Sparkles,
      label: humanizeActionType(actionType),
      color: 'blue',
      successTitle: `${humanizeActionType(actionType)} — done`,
      failureTitle: `${humanizeActionType(actionType)} — failed`,
    }
  );
}

const COLOR_CLASSES: Record<string, { bg: string; border: string; icon: string; text: string }> = {
  blue: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    icon: 'text-blue-400',
    text: 'text-blue-300',
  },
  green: {
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
    icon: 'text-green-400',
    text: 'text-green-300',
  },
  purple: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    icon: 'text-purple-400',
    text: 'text-purple-300',
  },
  orange: {
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    icon: 'text-orange-400',
    text: 'text-orange-300',
  },
  indigo: {
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/30',
    icon: 'text-indigo-400',
    text: 'text-indigo-300',
  },
  teal: {
    bg: 'bg-teal-500/10',
    border: 'border-teal-500/30',
    icon: 'text-teal-400',
    text: 'text-teal-300',
  },
  red: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    icon: 'text-red-400',
    text: 'text-red-300',
  },
};

/** Derive the effective status from the action result */
function getEffectiveStatus(action: ConciergeActionResult): ActionResultStatus {
  if (action.status) return action.status;
  return action.success ? 'success' : 'failure';
}

/** Build a concise title based on status and action type */
function getCardTitle(config: ActionConfig, status: ActionResultStatus): string {
  switch (status) {
    case 'success':
      return config.successTitle ?? `${config.label} created`;
    case 'failure':
      return config.failureTitle ?? `Failed to create ${config.label.toLowerCase()}`;
    case 'duplicate':
      return `${config.label} already exists`;
    case 'skipped':
      return `${config.label} skipped`;
  }
}

export const ConciergeActionCard: React.FC<ConciergeActionCardProps> = ({ action, onNavigate }) => {
  const config = getActionConfig(action.actionType);

  const status = getEffectiveStatus(action);
  const Icon = config.icon;

  // Failure state
  if (status === 'failure') {
    return (
      <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm">
        <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-400" />
        <div className="min-w-0">
          <p className="font-medium text-red-300">{getCardTitle(config, status)}</p>
          <p className="text-red-400/80 text-xs mt-0.5">{action.message}</p>
        </div>
      </div>
    );
  }

  // Duplicate state
  if (status === 'duplicate') {
    return (
      <div className="flex items-start gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm">
        <Copy size={16} className="mt-0.5 shrink-0 text-yellow-400" />
        <div className="min-w-0 flex-1">
          <p className="font-medium text-yellow-300">{getCardTitle(config, status)}</p>
          <p className="text-yellow-400/80 text-xs mt-0.5 truncate">
            {action.entityName || action.message}
          </p>
        </div>
        {onNavigate && config.tab && (
          <button
            type="button"
            onClick={() =>
              onNavigate(
                config.tab!,
                config.tab === 'polls'
                  ? { entityId: action.entityId, createPoll: !action.entityId }
                  : undefined,
              )
            }
            className="shrink-0 flex items-center gap-1 text-xs text-yellow-300 hover:underline"
          >
            View
            <ExternalLink size={10} />
          </button>
        )}
      </div>
    );
  }

  // Skipped state
  if (status === 'skipped') {
    return (
      <div className="flex items-start gap-2 rounded-lg border border-gray-500/30 bg-gray-500/10 p-3 text-sm">
        <Icon size={16} className="mt-0.5 shrink-0 text-gray-400" />
        <div className="min-w-0">
          <p className="font-medium text-gray-300">{getCardTitle(config, status)}</p>
          <p className="text-gray-400/80 text-xs mt-0.5 truncate">
            {action.entityName || action.message}
          </p>
        </div>
      </div>
    );
  }

  // Success state
  const colors = COLOR_CLASSES[config.color] || COLOR_CLASSES.blue;

  // Build subtitle: prefer entityName, fall back to message
  const subtitle = action.entityName
    ? `${action.scope ? `${action.scope}: ` : ''}${action.entityName}`
    : action.message;

  return (
    <div
      className={`flex items-start gap-2 rounded-lg border ${colors.border} ${colors.bg} p-3 text-sm`}
    >
      <Icon size={16} className={`mt-0.5 shrink-0 ${colors.icon}`} />
      <div className="min-w-0 flex-1">
        <p className={`font-medium ${colors.text}`}>{getCardTitle(config, status)}</p>
        <p className="text-gray-400 text-xs mt-0.5 truncate">{subtitle}</p>
      </div>
      {onNavigate && config.tab && (
        <button
          type="button"
          onClick={() =>
            onNavigate(
              config.tab!,
              config.tab === 'polls'
                ? {
                    entityId: action.entityId,
                    createPoll: action.actionType === 'create_poll' && !action.entityId,
                  }
                : undefined,
            )
          }
          className={`shrink-0 flex items-center gap-1 text-xs ${colors.text} hover:underline`}
        >
          View
          <ExternalLink size={10} />
        </button>
      )}
    </div>
  );
};

/**
 * Overflow summary card shown when more than MAX_VISIBLE_CARDS items
 * were completed for a single action type.
 */
interface OverflowSummaryCardProps {
  actionType: string;
  overflowCount: number;
  onNavigate?: ConciergeNavigateHandler;
}

export const OverflowSummaryCard: React.FC<OverflowSummaryCardProps> = ({
  actionType,
  overflowCount,
  onNavigate,
}) => {
  const config = getActionConfig(actionType);
  if (overflowCount <= 0) return null;

  const colors = COLOR_CLASSES[config.color] || COLOR_CLASSES.blue;
  const Icon = config.icon;
  const label = config.label.toLowerCase();
  const plural = overflowCount === 1 ? label : `${label}s`;

  return (
    <div
      className={`flex items-center gap-2 rounded-lg border ${colors.border} ${colors.bg} p-2.5 text-sm`}
    >
      <Icon size={14} className={`shrink-0 ${colors.icon}`} />
      <span className={`text-xs ${colors.text}`}>
        + {overflowCount} more {plural} added
      </span>
      {onNavigate && config.tab && (
        <button
          type="button"
          onClick={() => onNavigate(config.tab!)}
          className={`ml-auto shrink-0 flex items-center gap-1 text-xs ${colors.text} hover:underline`}
        >
          View all
          <ExternalLink size={10} />
        </button>
      )}
    </div>
  );
};

/**
 * Failure summary card shown when multiple items failed within a single action type.
 */
interface FailureSummaryCardProps {
  actionType: string;
  failureCount: number;
}

export const FailureSummaryCard: React.FC<FailureSummaryCardProps> = ({
  actionType,
  failureCount,
}) => {
  const config = getActionConfig(actionType);
  if (failureCount <= 0) return null;

  const label = config.label.toLowerCase();
  const plural = failureCount === 1 ? label : `${label}s`;

  return (
    <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-2.5 text-sm">
      <AlertTriangle size={14} className="shrink-0 text-red-400" />
      <span className="text-xs text-red-300">
        {failureCount} {plural} could not be added
      </span>
    </div>
  );
};
