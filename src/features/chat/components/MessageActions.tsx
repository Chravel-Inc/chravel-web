/**
 * MessageActions Component
 *
 * Provides edit and delete actions for messages
 * Shows as a dropdown menu on message hover
 */

import React, { useState } from 'react';
import { Edit, Trash2, MoreVertical, MessageSquareReply, Copy, Ban, Flag, Pin } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  editChatMessage,
  editChannelMessage,
  deleteChatMessage,
  deleteChannelMessage,
} from '@/services/chatService';
import { ReportDialog, ReportReason } from './ReportDialog';
export interface MessageActionsProps {
  messageId: string;
  messageContent: string;
  messageType: 'channel' | 'trip';
  isOwnMessage: boolean;
  isDeleted?: boolean;
  /** Admins can delete any message (server-side RLS enforced via migration 20260315000002) */
  isAdmin?: boolean;
  /** Moderators/admins can pin or unpin message (server-side Stream policy enforced) */
  canManagePins?: boolean;
  isPinned?: boolean;
  /** Sender user ID — needed for block/report actions */
  senderUserId?: string;
  onEdit?: (messageId: string, newContent: string) => void;
  onDelete?: (messageId: string) => void;
  onReply?: (messageId: string) => void;
  onOpenThread?: (messageId: string) => void;
  onTogglePin?: (messageId: string, shouldPin: boolean) => Promise<void> | void;
  onBlockUser?: (userId: string) => Promise<void> | void;
  onReportContent?: (params: {
    reportedUserId: string;
    messageId: string;
    reason: ReportReason;
    details?: string;
  }) => Promise<void> | void;
  isBlockingUser?: boolean;
  isReportingContent?: boolean;
}

export const MessageActions: React.FC<MessageActionsProps> = ({
  messageId,
  messageContent,
  messageType,
  isOwnMessage,
  isDeleted = false,
  isAdmin = false,
  canManagePins = false,
  isPinned = false,
  senderUserId,
  onEdit,
  onDelete,
  onReply,
  onOpenThread,
  onTogglePin,
  onBlockUser,
  onReportContent,
  isBlockingUser = false,
  isReportingContent = false,
}) => {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [editedContent, setEditedContent] = useState(messageContent);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hide actions if message is deleted
  if (isDeleted) {
    return null;
  }

  const handleEdit = async () => {
    if (!editedContent.trim()) {
      toast.error('Message cannot be empty');
      return;
    }

    if (editedContent === messageContent) {
      setShowEditDialog(false);
      return;
    }

    setIsSubmitting(true);
    try {
      const success =
        messageType === 'channel'
          ? await editChannelMessage(messageId, editedContent)
          : await editChatMessage(messageId, editedContent);

      if (success) {
        toast.success('Message edited');
        setShowEditDialog(false);
        onEdit?.(messageId, editedContent);
      } else {
        toast.error('Failed to edit message');
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error editing message:', error);
      }
      toast.error('Failed to edit message');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      const success =
        messageType === 'channel'
          ? await deleteChannelMessage(messageId)
          : await deleteChatMessage(messageId);

      if (success) {
        toast.success('Message deleted');
        setShowDeleteDialog(false);
        onDelete?.(messageId);
      } else {
        toast.error('Failed to delete message');
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error deleting message:', error);
      }
      toast.error('Failed to delete message');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePin = async () => {
    if (!onTogglePin) return;
    setIsSubmitting(true);
    try {
      await onTogglePin(messageId, !isPinned);
      toast.success(isPinned ? 'Message unpinned' : 'Message pinned');
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error updating pin state:', error);
      }
      toast.error('Failed to update pin status');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          {/* Actions available for all messages */}
          <DropdownMenuItem onClick={() => onReply?.(messageId)}>
            <MessageSquareReply className="mr-2 h-4 w-4" />
            Reply
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onOpenThread?.(messageId)}>
            <MessageSquareReply className="mr-2 h-4 w-4" />
            Open thread
          </DropdownMenuItem>
          {canManagePins && (
            <DropdownMenuItem onClick={handleTogglePin} disabled={isSubmitting}>
              <Pin className="mr-2 h-4 w-4" />
              {isPinned ? 'Unpin' : 'Pin'}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={() => {
              if (navigator.clipboard?.writeText) {
                navigator.clipboard.writeText(messageContent).catch(() => {});
              } else {
                const ta = document.createElement('textarea');
                ta.value = messageContent;
                ta.style.position = 'fixed';
                ta.style.opacity = '0';
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                document.body.removeChild(ta);
              }
              toast.success('Copied');
            }}
          >
            <Copy className="mr-2 h-4 w-4" />
            Copy
          </DropdownMenuItem>
          {/* Own-message actions: edit + delete */}
          {isOwnMessage && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setEditedContent(messageContent);
                  setShowEditDialog(true);
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </>
          )}
          {/* Admin-only delete for other users' messages */}
          {!isOwnMessage && isAdmin && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </>
          )}
          {/* Block & Report — available for other users' messages */}
          {!isOwnMessage && senderUserId && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowBlockDialog(true)} disabled={isBlockingUser}>
                <Ban className="mr-2 h-4 w-4" />
                Block User
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setShowReportDialog(true)}
                disabled={isReportingContent}
              >
                <Flag className="mr-2 h-4 w-4" />
                Report
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-gray-900 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Message</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={editedContent}
              onChange={e => setEditedContent(e.target.value)}
              placeholder="Edit your message..."
              className="bg-gray-800 border-white/10 text-white min-h-[100px]"
              disabled={isSubmitting}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => setShowEditDialog(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button onClick={handleEdit} disabled={isSubmitting || !editedContent.trim()}>
                {isSubmitting ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-gray-900 border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Message</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to delete this message? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Block User Confirmation Dialog */}
      <AlertDialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <AlertDialogContent className="bg-gray-900 border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Block User</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              You will no longer see messages from this user. You can unblock them later from
              Settings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBlockingUser}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (senderUserId) {
                  try {
                    await onBlockUser?.(senderUserId);
                    setShowBlockDialog(false);
                  } catch {
                    // Error toast handled by hook
                  }
                }
              }}
              disabled={isBlockingUser}
              className="bg-red-600 hover:bg-red-700"
            >
              {isBlockingUser ? 'Blocking...' : 'Block'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Report Content Dialog */}
      {senderUserId && (
        <ReportDialog
          open={showReportDialog}
          onOpenChange={setShowReportDialog}
          onSubmit={async (reason, details) => {
            try {
              await onReportContent?.({
                reportedUserId: senderUserId,
                messageId,
                reason,
                details,
              });
              setShowReportDialog(false);
            } catch {
              // Error toast handled by hook
            }
          }}
          isSubmitting={isReportingContent}
        />
      )}
    </>
  );
};
