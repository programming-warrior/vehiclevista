import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Building2, 
  FileText, 
  Calendar, 
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Info,
  RotateCcw
} from "lucide-react";
import { Link } from "wouter";
import type { TraderRequest } from "@shared/schema";

interface TraderRequestStatusProps {
  request: TraderRequest;
}

export default function TraderRequestStatus({ request }: TraderRequestStatusProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Pending Review
          </Badge>
        );
      case "APPROVED":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-300 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Approved
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-300 flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Rejected
          </Badge>
        );
      default:
        return null;
    }
  };

  const getStatusAlert = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Alert className="bg-yellow-50 border-yellow-200">
            <Clock className="h-4 w-4 text-yellow-600" />
            <AlertTitle className="text-yellow-900">Application Under Review</AlertTitle>
            <AlertDescription className="text-yellow-800">
              Your trader application is currently being reviewed by our team. This process typically takes 1-3 business days.
            </AlertDescription>
          </Alert>
        );
      case "APPROVED":
        return (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-900">Application Approved!</AlertTitle>
            <AlertDescription className="text-green-800">
              Congratulations! Your trader application has been approved. You now have access to all trader features.
            </AlertDescription>
          </Alert>
        );
      case "REJECTED":
        return (
          <Alert className="bg-red-50 border-red-200">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertTitle className="text-red-900">Application Rejected</AlertTitle>
            <AlertDescription className="text-red-800">
              Unfortunately, your trader application was not approved. Please see the reason below.
            </AlertDescription>
          </Alert>
        );
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
    <Card className="border-gray-200">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5 text-blue-600" />
              Trader Application Status
            </CardTitle>
            <CardDescription className="mt-1">
              Track your trader registration request
            </CardDescription>
          </div>
          {getStatusBadge(request.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {getStatusAlert(request.status)}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Company Name
            </p>
            <p className="text-sm font-semibold text-gray-900">{request.ukCompanyName}</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Company Number
            </p>
            <code className="text-sm font-semibold bg-gray-100 px-2 py-1 rounded text-gray-900">
              {request.ukCompanyNumber}
            </code>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Submitted
            </p>
            <p className="text-sm text-gray-700">{formatDate(request.submittedAt)}</p>
          </div>

          {request.reviewedAt && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Reviewed
              </p>
              <p className="text-sm text-gray-700">{formatDate(request.reviewedAt)}</p>
            </div>
          )}
        </div>

        {request.rejectionReason && request.status === "REJECTED" && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm font-semibold text-red-900 mb-2 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Rejection Reason
            </p>
            <p className="text-sm text-red-700">{request.rejectionReason}</p>
          </div>
        )}

        {request.status === "PENDING" && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-xs text-blue-800 flex items-start gap-2">
              <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>
                You will receive a notification once your application has been reviewed. 
                In the meantime, you can continue using your current account features.
              </span>
            </p>
          </div>
        )}

        {request.status === "REJECTED" && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <Link href="/trader/create">
              <Button 
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg transition-all duration-200"
                size="lg"
              >
                <RotateCcw className="mr-2 h-5 w-5" />
                Reapply for Trader Status
              </Button>
            </Link>
            <p className="text-xs text-gray-500 text-center mt-2">
              You can submit a new application addressing the rejection reasons
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
