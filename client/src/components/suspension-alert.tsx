import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import { useLocation } from "wouter";

interface SuspensionAlertProps {
  open: boolean;
  reason?: string;
  onClose?: () => void;
}

export function SuspensionAlert({ open, reason, onClose }: SuspensionAlertProps) {
  const [, setLocation] = useLocation();

  const handleContinue = () => {
    // Clear user data
    localStorage.removeItem("sessionId");
    
    // Redirect to home
    setLocation("/");
    
    // Call onClose if provided
    if (onClose) {
      onClose();
    }
  };

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
              <ShieldAlert className="h-6 w-6 text-red-600" />
            </div>
            <AlertDialogTitle className="text-xl font-bold text-red-900">
              Account Suspended
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-base space-y-3">
            <p className="text-gray-700">
              Your account has been suspended by an administrator and you have been logged out.
            </p>
            
            {reason && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-amber-900 mb-1">Reason for suspension:</p>
                    <p className="text-sm text-amber-800">{reason}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-900">
                <strong>Limited Access:</strong> You can still browse public content such as vehicle listings, auctions, and raffles,
                but you won't be able to:
              </p>
              <ul className="text-sm text-blue-800 mt-2 ml-5 list-disc space-y-1">
                <li>Create or manage listings</li>
                <li>Place bids on auctions</li>
                <li>Purchase raffle tickets</li>
                <li>Save favorites or contact sellers</li>
                <li>Access your profile or account settings</li>
              </ul>
            </div>

            <p className="text-sm text-gray-600">
              If you believe this is a mistake, please contact our support team for assistance.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction
            onClick={handleContinue}
            className="w-full bg-red-600 hover:bg-red-700 text-white"
          >
            I Understand
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default SuspensionAlert;
