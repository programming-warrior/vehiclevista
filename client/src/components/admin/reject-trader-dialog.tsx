import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface RejectTraderRequestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  companyName: string;
}

export default function RejectTraderRequestDialog({
  isOpen,
  onClose,
  onConfirm,
  companyName,
}: RejectTraderRequestDialogProps) {
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!rejectionReason.trim()) {
      setError("Please provide a reason for rejection");
      return;
    }

    if (rejectionReason.trim().length < 10) {
      setError("Rejection reason must be at least 10 characters");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await onConfirm(rejectionReason);
      handleClose();
    } catch (err: any) {
      setError(err.message || "Failed to reject request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setRejectionReason("");
    setError("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Reject Trader Request</DialogTitle>
          <DialogDescription>
            You are about to reject the trader application for{" "}
            <strong>{companyName}</strong>. Please provide a detailed reason.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This action cannot be undone. The user will be notified of the rejection.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="rejection-reason">Rejection Reason *</Label>
            <Textarea
              id="rejection-reason"
              placeholder="E.g., Company registration could not be verified, invalid company number, does not meet trader requirements..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              disabled={isSubmitting}
              rows={5}
              className="resize-none"
            />
            <p className="text-xs text-gray-500">
              {rejectionReason.length} / 500 characters (minimum 10)
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={isSubmitting || !rejectionReason.trim()}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Rejecting...
              </>
            ) : (
              "Reject Request"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
