import * as React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from './drawer';

interface ResponsiveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  title?: string;
  description?: string;
  /** Desktop dialog max-width class, e.g. "sm:max-w-md" */
  dialogClassName?: string;
  /** Additional className for drawer content */
  drawerClassName?: string;
  /**
   * `sheet` (default): bottom Drawer on mobile, Dialog on desktop.
   * `centered`: always a centered Dialog — preferred for forms with text inputs
   * where iOS keyboard open/dismiss must not yank a bottom sheet around.
   */
  layout?: 'sheet' | 'centered';
}

/**
 * ResponsiveModal renders a centered Dialog on desktop and a bottom Drawer on mobile
 * (`layout="sheet"`). Use `layout="centered"` for input-heavy modals that must stay
 * centered across keyboard show/hide (see `.dialog-keyboard-stable`).
 */
export function ResponsiveModal({
  open,
  onOpenChange,
  children,
  title,
  description,
  dialogClassName = 'sm:max-w-md',
  drawerClassName,
  layout = 'sheet',
}: ResponsiveModalProps) {
  const isMobile = useIsMobile();
  const useSheet = layout === 'sheet' && isMobile;

  if (useSheet) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className={drawerClassName}>
          {(title || description) && (
            <DrawerHeader className="text-left">
              {title && <DrawerTitle>{title}</DrawerTitle>}
              {description && <DrawerDescription>{description}</DrawerDescription>}
            </DrawerHeader>
          )}
          <div className="px-4 pb-6 max-h-[80vh] overflow-y-auto">{children}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          layout === 'centered' && 'dialog-keyboard-stable w-[calc(100%-2rem)] rounded-2xl',
          dialogClassName,
        )}
      >
        {(title || description) && (
          <DialogHeader>
            {title && <DialogTitle>{title}</DialogTitle>}
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
        )}
        {children}
      </DialogContent>
    </Dialog>
  );
}
