import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download } from 'lucide-react';
import type { TripEvent } from '@/types/calendar';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tripEvents: TripEvent[];
  onExport: (events: TripEvent[]) => Promise<void>;
}

export const ExportDialog = ({ isOpen, onClose, tripEvents, onExport }: ExportDialogProps) => {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const handleExportAll = async () => {
    setIsExporting(true);
    try {
      await onExport(tripEvents);
      onClose();
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportRange = async () => {
    if (!fromDate || !toDate) return;
    const from = new Date(fromDate);
    from.setHours(0, 0, 0, 0);
    const to = new Date(toDate);
    to.setHours(23, 59, 59, 999);

    const filtered = tripEvents.filter(e => {
      const start = new Date(e.start_time);
      return start >= from && start <= to;
    });

    setIsExporting(true);
    try {
      await onExport(filtered);
      onClose();
    } finally {
      setIsExporting(false);
    }
  };

  const rangeValid = fromDate && toDate && toDate >= fromDate;
  const rangeCount = (() => {
    if (!fromDate || !toDate) return 0;
    const from = new Date(fromDate);
    from.setHours(0, 0, 0, 0);
    const to = new Date(toDate);
    to.setHours(23, 59, 59, 999);
    return tripEvents.filter(e => {
      const start = new Date(e.start_time);
      return start >= from && start <= to;
    }).length;
  })();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Calendar
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Button
            onClick={handleExportAll}
            disabled={isExporting || tripEvents.length === 0}
            className="w-full"
          >
            Export All ({tripEvents.length} event{tripEvents.length !== 1 ? 's' : ''})
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">or select range</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="export-from" className="text-sm">
                From
              </Label>
              <Input
                id="export-from"
                type="date"
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="export-to" className="text-sm">
                To
              </Label>
              <Input
                id="export-to"
                type="date"
                value={toDate}
                onChange={e => setToDate(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          {rangeValid && (
            <p className="text-xs text-muted-foreground text-center">
              {rangeCount} event{rangeCount !== 1 ? 's' : ''} in selected range
            </p>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose} disabled={isExporting}>
            Cancel
          </Button>
          <Button
            onClick={handleExportRange}
            disabled={!rangeValid || rangeCount === 0 || isExporting}
          >
            Export Range
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
