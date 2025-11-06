import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getRefunds, getRefundStats, type GetRefundsParams } from "@/api/refund-api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  const { data: stats } = useQuery({
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
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Completed</Badge>;
      case "PENDING":
        return <Badge className="bg-yellow-500"><AlertCircle className="w-3 h-3 mr-1" /> Pending</Badge>;
      case "FAILED":
        return <Badge className="bg-red-500"><XCircle className="w-3 h-3 mr-1" /> Failed</Badge>;
      default:
        return <Badge>{status}</Badge>;
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

  if (refundsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Refund Management</h1>
        <p className="text-muted-foreground mt-2">
          Monitor and manage all refund transactions
        </p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Refunds (30 Days)</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                £{stats.last30Days?.totalAmount?.toFixed(2) || "0.00"}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.last30Days?.count || 0} refunds processed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Refunds</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.byStatus?.find((s) => s.status === "COMPLETED")?.count || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                £{stats.byStatus?.find((s) => s.status === "COMPLETED")?.totalAmount?.toFixed(2) || "0.00"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed Refunds</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.byStatus?.find((s) => s.status === "FAILED")?.count || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Requires attention
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Refunds by Reason */}
      {stats?.byReason && stats.byReason.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Refunds by Reason</CardTitle>
            <CardDescription>Breakdown of refunds by failure type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.byReason.map((item) => (
                <div key={item.reason} className="border rounded-lg p-4">
                  <div className="text-sm font-medium text-muted-foreground">
                    {getReasonLabel(item.reason)}
                  </div>
                  <div className="text-2xl font-bold mt-1">{item.count}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    £{item.totalAmount?.toFixed(2) || "0.00"}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
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
              <label className="text-sm font-medium mb-2 block">Reason</label>
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
              <label className="text-sm font-medium mb-2 block">Search User ID</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Enter user ID"
                  value={searchUserId}
                  onChange={(e) => setSearchUserId(e.target.value)}
                />
                <Button onClick={handleSearch}>
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Refunds Table */}
      <Card>
        <CardHeader>
          <CardTitle>Refund Transactions</CardTitle>
          <CardDescription>
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
                {refundsData?.refunds.map(({ refund, user }) => (
                  <TableRow key={refund.id}>
                    <TableCell className="font-mono text-sm">#{refund.id}</TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(refund.createdAt), "MMM dd, yyyy HH:mm")}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{user.username}</div>
                        <div className="text-xs text-muted-foreground">{user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">
                      £{refund.amount.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{getReasonLabel(refund.reason)}</div>
                    </TableCell>
                    <TableCell>
                      {refund.listingType ? (
                        <Badge variant="outline">{refund.listingType}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(refund.status)}</TableCell>
                    <TableCell>
                      {refund.reasonDetails && (
                        <div className="text-xs text-muted-foreground max-w-xs truncate">
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
              <div className="text-sm text-muted-foreground">
                Page {refundsData.pagination.page} of {refundsData.pagination.totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={refundsData.pagination.page === 1}
                  onClick={() => handleFilterChange("page", filters.page! - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={refundsData.pagination.page === refundsData.pagination.totalPages}
                  onClick={() => handleFilterChange("page", filters.page! + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
