import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export function buildConfirmationMessage(actionType, date) {
  const formatted = format(date, "PPP");
  if (actionType === "generate") {
    return `Attendance generated for ${formatted}.`;
  }
  return `${formatted} has been marked as a holiday.`;
}

export default function AttendanceConfirmationDialog({
  open,
  actionType,
  date,
  holidayId,
  onUndo,
  onClose,
  isUndoing,
}) {
  const title =
    actionType === "generate" ? "Attendance Generated" : "Holiday Marked";
  const message = date ? buildConfirmationMessage(actionType, date) : "";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={onUndo} disabled={isUndoing}>
            {isUndoing && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Undo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
