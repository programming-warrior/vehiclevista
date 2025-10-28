import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
    adminGetTraderRequests,
    adminApproveTraderRequest,
    adminRejectTraderRequest,
} from "@/api";
import type { TraderRequest } from "@shared/schema";
import TraderRequestCard from "@/components/admin/trader-request-card";
import RejectTraderRequestDialog from "@/components/admin/reject-trader-dialog";
import {
    Building2,
    Loader2,
    RefreshCw,
    AlertCircle,
    FileText,
    CheckCircle,
    XCircle,
    Clock
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import AdminLayout from "@/components/admin/admin-layout";

type TraderRequestWithUser = TraderRequest & {
    user?: {
        id: number;
        username: string;
        email: string;
        role: string;
    }
};

export default function AdminTraderRequests() {
    const [requests, setRequests] = useState<TraderRequestWithUser[]>([]);
    const [filteredRequests, setFilteredRequests] = useState<TraderRequestWithUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [activeTab, setActiveTab] = useState<string>("PENDING");
    const [rejectDialog, setRejectDialog] = useState<{
        isOpen: boolean;
        requestId: number | null;
        companyName: string;
    }>({
        isOpen: false,
        requestId: null,
        companyName: "",
    });
    const { toast } = useToast();

    const fetchRequests = async () => {
        try {
            setIsLoading(true);
            const data = await adminGetTraderRequests();
            setRequests(data);
            filterRequests(data, activeTab);
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Failed to fetch trader requests",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const filterRequests = (data: TraderRequestWithUser[], status: string) => {
        if (status === "ALL") {
            setFilteredRequests(data);
        } else {
            setFilteredRequests(data.filter((req) => req.status === status));
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    useEffect(() => {
        filterRequests(requests, activeTab);
    }, [activeTab, requests]);

    const handleApprove = async (requestId: number) => {
        try {
            setIsProcessing(true);
            await adminApproveTraderRequest(requestId);
            toast({
                title: "Success",
                description: "Trader request approved successfully",
            });
            fetchRequests();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Failed to approve trader request",
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRejectClick = (requestId: number, companyName: string) => {
        setRejectDialog({
            isOpen: true,
            requestId,
            companyName,
        });
    };

    const handleRejectConfirm = async (rejectionReason: string) => {
        if (!rejectDialog.requestId) return;

        try {
            setIsProcessing(true);
            await adminRejectTraderRequest(rejectDialog.requestId, rejectionReason);
            toast({
                title: "Success",
                description: "Trader request rejected successfully",
            });
            fetchRequests();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Failed to reject trader request",
            });
            throw error;
        } finally {
            setIsProcessing(false);
        }
    };

    const getStatsCount = (status: string) => {
        if (status === "ALL") return requests.length;
        return requests.filter((req) => req.status === status).length;
    };

    return (
        <AdminLayout>
            <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <div className="bg-white border-b border-gray-200">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                                    <Building2 className="h-8 w-8 text-blue-600" />
                                    Trader Requests
                                </h1>
                                <p className="mt-2 text-gray-600">
                                    Review and manage trader registration applications
                                </p>
                            </div>
                            <Button
                                onClick={fetchRequests}
                                disabled={isLoading}
                                variant="outline"
                                size="sm"
                            >
                                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                                Refresh
                            </Button>
                        </div>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-600">Total</p>
                                            <p className="text-2xl font-bold">{getStatsCount("ALL")}</p>
                                        </div>
                                        <FileText className="h-8 w-8 text-gray-400" />
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-yellow-600">Pending</p>
                                            <p className="text-2xl font-bold">{getStatsCount("PENDING")}</p>
                                        </div>
                                        <Clock className="h-8 w-8 text-yellow-400" />
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-green-600">Approved</p>
                                            <p className="text-2xl font-bold">{getStatsCount("APPROVED")}</p>
                                        </div>
                                        <CheckCircle className="h-8 w-8 text-green-400" />
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-red-600">Rejected</p>
                                            <p className="text-2xl font-bold">{getStatsCount("REJECTED")}</p>
                                        </div>
                                        <XCircle className="h-8 w-8 text-red-400" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="grid w-full grid-cols-4 mb-8">
                            <TabsTrigger value="PENDING" className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                Pending ({getStatsCount("PENDING")})
                            </TabsTrigger>
                            <TabsTrigger value="APPROVED" className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4" />
                                Approved ({getStatsCount("APPROVED")})
                            </TabsTrigger>
                            <TabsTrigger value="REJECTED" className="flex items-center gap-2">
                                <XCircle className="h-4 w-4" />
                                Rejected ({getStatsCount("REJECTED")})
                            </TabsTrigger>
                            <TabsTrigger value="ALL" className="flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                All ({getStatsCount("ALL")})
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value={activeTab} className="space-y-4">
                            {isLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                                </div>
                            ) : filteredRequests.length === 0 ? (
                                <Card>
                                    <CardContent className="py-12">
                                        <div className="text-center">
                                            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                            <p className="text-gray-600 text-lg">No {activeTab.toLowerCase()} requests found</p>
                                            <p className="text-gray-500 text-sm mt-2">
                                                {activeTab === "PENDING"
                                                    ? "All trader requests have been processed"
                                                    : `There are no ${activeTab.toLowerCase()} requests at this time`}
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {filteredRequests.map((request) => (
                                        <TraderRequestCard
                                            key={request.id}
                                            request={request}
                                            onApprove={handleApprove}
                                            onReject={(id) => handleRejectClick(id, request.ukCompanyName)}
                                            isProcessing={isProcessing}
                                        />
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Reject Dialog */}
                <RejectTraderRequestDialog
                    isOpen={rejectDialog.isOpen}
                    onClose={() =>
                        setRejectDialog({ isOpen: false, requestId: null, companyName: "" })
                    }
                    onConfirm={handleRejectConfirm}
                    companyName={rejectDialog.companyName}
                />
            </div>
        </AdminLayout>

    );
}
