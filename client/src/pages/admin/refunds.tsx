import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getRefunds, getRefundStats, type GetRefundsParams } from "@/api/refund-api";
import AdminLayout from "@/components/admin/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, DollarSign, TrendingDown, AlertCircle, CheckCircle, XCircle, Filter, Search } from "lucide-react";
import { format } from "date-fns";

export default function AdminRefunds() {
  const [filters, setFilters] = useState<GetRefundsParams>({
    page: 1,
    limit: 20,
  });

  const [searchUserId, setSearchUserId] = useState("");

  // Fetch refunds with filters
  const {
    data: refundsData,
    isLoading: refundsLoading,
    refetch: refetchRefunds,
  } = useQuery({
    queryKey: ["admin-refunds", filters],
    queryFn: () => getRefunds(filters),
  });

  // Fetch statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-refund-stats"],
    queryFn: getRefundStats,
  });

  const handleFilterChange = (key: keyof GetRefundsParams, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleSearch = () => {
    if (searchUserId) {
      handleFilterChange("userId", parseInt(searchUserId));
    } else {
      const { userId, ...rest } = filters;
      setFilters(rest);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle className="w-3 h-3 mr-1" /> Completed</Badge>;
      case "PENDING":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600"><AlertCircle className="w-3 h-3 mr-1" /> Pending</Badge>;
      case "FAILED":
        return <Badge className="bg-red-500 hover:bg-red-600"><XCircle className="w-3 h-3 mr-1" /> Failed</Badge>;
      default:
        return <Badge className="bg-gray-500">{status}</Badge>;
    }
  };

  const getReasonLabel = (reason: string) => {
    const reasonMap: Record<string, string> = {
      AUCTION_CREATION_FAILED: "Auction Creation Failed",
      CLASSIFIED_CREATION_FAILED: "Classified Creation Failed",
      BID_FAILED: "Bid Failed",
      RAFFLE_TICKET_FAILED: "Raffle Ticket Failed",
      CONDITION_NOT_MET: "Condition Not Met",
      REQUESTED_BY_ADMIN: "Admin Request",
      OTHER: "Other",
    };
    return reasonMap[reason] || reason;
  };

  return (
    <AdminLayout>
      <div className="container mx-auto p-4 bg-white">
        <div>
          <h1 className="text-3xl font-bold mb-6 text-black">Refund Management</h1>
          <p className="text-slate-600 mt-2 mb-6">
            Monitor and manage all refund transactions
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {stats ? (
            <>
              <Card className="shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-slate-50">
                  <CardTitle className="text-sm font-medium text-black">Total Refunds (30 Days)</CardTitle>
                  <DollarSign className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-black">
                    £{stats.last30Days?.totalAmount?.toFixed(2) || "0.00"}
                  </div>
                  <p className="text-xs text-slate-600">
                    {stats.last30Days?.count || 0} refunds processed
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-slate-50">
                  <CardTitle className="text-sm font-medium text-black">Completed Refunds</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-black">
                    {stats.byStatus?.find((s) => s.status === "COMPLETED")?.count || 0}
                  </div>
                  <p className="text-xs text-slate-600">
                    £{stats.byStatus?.find((s) => s.status === "COMPLETED")?.totalAmount?.toFixed(2) || "0.00"}
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-slate-50">
                  <CardTitle className="text-sm font-medium text-black">Failed Refunds</CardTitle>
                  <XCircle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-black">
                    {stats.byStatus?.find((s) => s.status === "FAILED")?.count || 0}
                  </div>
                  <p className="text-xs text-slate-600">
                    Requires attention
                  </p>
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              {[1, 2, 3].map((i) => (
                <Card key={i} className="shadow-md">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-slate-50">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-4 rounded-full" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-24 mb-2" />
                    <Skeleton className="h-3 w-32" />
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </div>

        {/* Refunds by Reason */}
        {stats?.byReason && stats.byReason.length > 0 ? (
          <Card className="shadow-md hover:shadow-lg transition-shadow mb-6">
            <CardHeader className="bg-slate-50">
              <CardTitle className="text-black">Refunds by Reason</CardTitle>
              <CardDescription className="text-slate-600">Breakdown of refunds by failure type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.byReason.map((item) => (
                  <div key={item.reason} className="border rounded-lg p-4 bg-slate-50">
                    <div className="text-sm font-medium text-slate-700">
                      {getReasonLabel(item.reason)}
                    </div>
                    <div className="text-2xl font-bold mt-1 text-black">{item.count}</div>
                    <div className="text-xs text-slate-600 mt-1">
                      £{item.totalAmount?.toFixed(2) || "0.00"}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : statsLoading ? (
          <Card className="shadow-md mb-6">
            <CardHeader className="bg-slate-50">
              <CardTitle className="text-black">Refunds by Reason</CardTitle>
              <CardDescription className="text-slate-600">Breakdown of refunds by failure type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="border rounded-lg p-4 bg-slate-50">
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-8 w-16 mb-2" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Filters */}
        <Card className="shadow-md mb-6">
          <CardHeader className="bg-slate-50">
            <CardTitle className="flex items-center gap-2 text-black">
              <Filter className="w-5 h-5 text-blue-500" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block text-slate-700">Status</label>
                <Select
                value={filters.status || "all"}
                onValueChange={(value) =>
                  handleFilterChange("status", value === "all" ? undefined : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block text-slate-700">Reason</label>
              <Select
                value={filters.reason || "all"}
                onValueChange={(value) =>
                  handleFilterChange("reason", value === "all" ? undefined : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Reasons" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Reasons</SelectItem>
                  <SelectItem value="AUCTION_CREATION_FAILED">Auction Creation Failed</SelectItem>
                  <SelectItem value="CLASSIFIED_CREATION_FAILED">Classified Creation Failed</SelectItem>
                  <SelectItem value="BID_FAILED">Bid Failed</SelectItem>
                  <SelectItem value="RAFFLE_TICKET_FAILED">Raffle Ticket Failed</SelectItem>
                  <SelectItem value="CONDITION_NOT_MET">Condition Not Met</SelectItem>
                  <SelectItem value="REQUESTED_BY_ADMIN">Admin Request</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-2 block text-slate-700">Search User ID</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Enter user ID"
                  value={searchUserId}
                  onChange={(e) => setSearchUserId(e.target.value)}
                />
                <Button onClick={handleSearch} className="bg-blue-500 hover:bg-blue-600 text-white">
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

        {/* Refunds Table */}
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="bg-slate-50">
            <CardTitle className="text-black">Refund Transactions</CardTitle>
            <CardDescription className="text-slate-600">
              Showing {refundsData?.refunds.length || 0} of {refundsData?.pagination.total || 0} refunds
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Listing Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {refundsLoading ? (
                  // Skeleton rows while loading
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24 mb-1" />
                        <Skeleton className="h-3 w-32" />
                      </TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    </TableRow>
                  ))
                ) : refundsData?.refunds.map(({ refund, user }) => (
                  <TableRow key={refund.id}>
                    <TableCell className="font-mono text-sm text-slate-700">#{refund.id}</TableCell>
                    <TableCell className="text-sm text-slate-700">
                      {format(new Date(refund.createdAt), "MMM dd, yyyy HH:mm")}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-black">{user.username}</div>
                        <div className="text-xs text-slate-600">{user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-black">
                      £{refund.amount.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-slate-700">{getReasonLabel(refund.reason)}</div>
                    </TableCell>
                    <TableCell>
                      {refund.listingType ? (
                        <Badge variant="outline">{refund.listingType}</Badge>
                      ) : (
                        <span className="text-slate-500 text-sm">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(refund.status)}</TableCell>
                    <TableCell>
                      {refund.reasonDetails && (
                        <div className="text-xs text-slate-600 max-w-xs truncate">
                          {refund.reasonDetails}
                        </div>
                      )}
                      {refund.errorMessage && (
                        <div className="text-xs text-red-500 max-w-xs truncate">
                          Error: {refund.errorMessage}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {refundsData && refundsData.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-slate-600">
                Page {refundsData.pagination.page} of {refundsData.pagination.totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={refundsData.pagination.page === 1}
                  onClick={() => handleFilterChange("page", filters.page! - 1)}
                  className="hover:bg-blue-50"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={refundsData.pagination.page === refundsData.pagination.totalPages}
                  onClick={() => handleFilterChange("page", filters.page! + 1)}
                  className="hover:bg-blue-50"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </AdminLayout>
  );
}
