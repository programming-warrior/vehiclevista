import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Building2, 
  FileText, 
  Calendar, 
  User,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";
import type { TraderRequest } from "@shared/schema";

interface TraderRequestCardProps {
  request: TraderRequest & { user?: { username: string; email: string } };
  onApprove: (requestId: number) => void;
  onReject: (requestId: number) => void;
  isProcessing: boolean;
}

export default function TraderRequestCard({ 
  request, 
  onApprove, 
  onReject,
  isProcessing 
}: TraderRequestCardProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>;
      case "APPROVED":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
          <CheckCircle className="h-3 w-3 mr-1" />
          Approved
        </Badge>;
      case "REJECTED":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
          <XCircle className="h-3 w-3 mr-1" />
          Rejected
        </Badge>;
      default:
        return null;
    }
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              {request.ukCompanyName}
            </CardTitle>
            <CardDescription className="flex items-center gap-2">
              <User className="h-4 w-4" />
              {request.user?.username || "Unknown User"}
            </CardDescription>
          </div>
          {getStatusBadge(request.status)}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Company Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500">Company Number</p>
              <p className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-gray-400" />
                <code className="bg-gray-100 px-2 py-1 rounded">{request.ukCompanyNumber}</code>
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500">Email</p>
              <p className="text-sm text-gray-700">{request.user?.email || "N/A"}</p>
            </div>
          </div>

          {/* Submission Date */}
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-500">Submitted</p>
            <p className="flex items-center gap-2 text-sm text-gray-700">
              <Calendar className="h-4 w-4 text-gray-400" />
              {formatDate(request.submittedAt)}
            </p>
          </div>

          {/* Review Information */}
          {request.status !== "PENDING" && (
            <div className="space-y-1 pt-2 border-t">
              <p className="text-sm font-medium text-gray-500">Reviewed</p>
              <p className="text-sm text-gray-700">{formatDate(request.reviewedAt)}</p>
              {request.rejectionReason && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm font-medium text-red-900">Rejection Reason:</p>
                  <p className="text-sm text-red-700 mt-1">{request.rejectionReason}</p>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          {request.status === "PENDING" && (
            <div className="flex gap-2 pt-4 border-t">
              <Button
                onClick={() => onApprove(request.id)}
                disabled={isProcessing}
                className="flex-1 bg-green-600 hover:bg-green-700"
                size="sm"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </Button>
              <Button
                onClick={() => onReject(request.id)}
                disabled={isProcessing}
                variant="destructive"
                className="flex-1"
                size="sm"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
