import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import AdminLayout from "@/components/admin/layout";
import { adminGetPaymentHistory } from "@/api";
import { useDebounce } from "@/hooks/use-debounce";
import type { paymentSession } from "@shared/schema";
import {
  AlertCircle,
  ArrowUpDown,
  CheckCircle,
  Clock,
  ExternalLink,
  User,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

// Helper to format date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// Helper to format currency (assuming amount is in the smallest unit, e.g., cents)
const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
};

export default function AdminPaymentHistory() {
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("newest");
  const [statusFilter, setStatusFilter] = useState("succeeded"); // Default to a common status
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPayments, setTotalPayments] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [location, setLocation] = useLocation();
  const debouncedSearch = useDebounce(searchQuery, 500);
  const { toast } = useToast();

  async function fetchPayments(currentPage: number) {
    try {
      setIsLoading(true);
      const filter = {
        search: debouncedSearch,
        status: statusFilter,
      };
      const data = await adminGetPaymentHistory({
        page: currentPage,
        limit,
        sortBy: sortOption,
        filter: JSON.stringify(filter),
      });

      // NOTE: Corrected data keys based on a logical assumption
      setPaymentHistory(data.paymentHistory || []);
      setTotalPages(data.totalPages || 1);
      setTotalPayments(data.totalPayments || 0);
    } catch (e: any) {
      console.error("Failed to fetch payment history:", e);
      toast({
        title: "Error to fetch",
        description: e.message || "There was an error fetching payment data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Refetch when search or status filter changes, and reset to page 1
  useEffect(() => {
    setPage(1);
    fetchPayments(1);
  }, [debouncedSearch, statusFilter, sortOption]);

  // Refetch when page or limit changes
  useEffect(() => {
    fetchPayments(page);
  }, [page, limit]);

  const getStatusTitle = () => {
    switch (statusFilter) {
      case "succeeded":
        return "Successful Payments";
      case "failed":
        return "Failed Payments";
      case "processing":
        return "Processing Payments";
      default:
        return "All Payments";
    }
  };

  const getStatusDescription = () => {
    switch (statusFilter) {
      case "succeeded":
        return "A list of all successfully completed transactions.";
      case "failed":
        return "A list of transactions that failed to process.";
      case "pending":
        return "A list of transactions that are currently being processed.";
      default:
        return `Showing ${totalPayments} total payments.`;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* --- Sticky Header for Controls --- */}
        <div className="space-y-4 py-4 backdrop-blur-md dark:bg-slate-950">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-blue-700">
              Payment History Management
            </h2>
            <div className="flex gap-2">
              <Input
                placeholder="Search by TransactionId..."
                className="w-64 border-blue-200 focus:border-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between space-x-2">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-blue-600">Filter by status:</span>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48 border-blue-200">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="succeeded">
                    <span className="flex items-center">
                      <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                      Succeeded
                    </span>
                  </SelectItem>
                  <SelectItem value="failed">
                    <span className="flex items-center">
                      <XCircle className="mr-2 h-4 w-4 text-red-600" />
                      Failed
                    </span>
                  </SelectItem>
                      <SelectItem value="expired">
                    <span className="flex items-center">
                      <XCircle className="mr-2 h-4 w-4 text-purple-600" />
                      Expired
                    </span>
                  </SelectItem>
                  <SelectItem value="pending">
                    <span className="flex items-center">
                      <Clock className="mr-2 h-4 w-4 text-yellow-600" />
                      Pending
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-blue-600">Show:</span>
                <Select
                  value={limit.toString()}
                  onValueChange={(val) => setLimit(parseInt(val))}
                >
                  <SelectTrigger className="w-20 border-blue-200">
                    <SelectValue placeholder="Entries" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-blue-600">Sort by:</span>
                <Select value={sortOption} onValueChange={setSortOption}>
                  <SelectTrigger className="w-48 border-blue-200">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Date (Newest First)</SelectItem>
                    <SelectItem value="oldest">Date (Oldest First)</SelectItem>
                    <SelectItem value="amount-desc">
                      Amount (High to Low)
                    </SelectItem>
                    <SelectItem value="amount-asc">
                      Amount (Low to High)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* --- Main Content Area --- */}
        {!isLoading && paymentHistory.length === 0 && (
          <Alert className="border-blue-200 bg-blue-50">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-700">No Payments Found</AlertTitle>
            <AlertDescription className="text-blue-600">
              There are no payments matching the current filters. Try adjusting
              your search or filter criteria.
            </AlertDescription>
          </Alert>
        )}

        <Card className="border-blue-200">
          <CardHeader className="bg-blue-50">
            <CardTitle className="text-blue-700">{getStatusTitle()}</CardTitle>
            <CardDescription className="text-blue-600">
              {getStatusDescription()}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex flex-col gap-2 p-6">
                <Skeleton className="h-14 w-full bg-blue-100" />
                <Skeleton className="h-14 w-full bg-blue-100" />
                <Skeleton className="h-14 w-full bg-blue-100" />
                <Skeleton className="h-14 w-full bg-blue-100" />
                <Skeleton className="h-14 w-full bg-blue-100" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-white dark:bg-slate-900">
                    <tr className="border-b border-blue-200">
                      <th className="px-4 py-3 text-left font-medium text-blue-700">
                        User
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-blue-700">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-blue-700">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-blue-700">
                        Transaction ID
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-blue-700">
                        Date
                      </th>
                      {/* <th className="px-4 py-3 text-right font-medium text-blue-700">
                        Actions
                      </th> */}
                    </tr>
                  </thead>
                  <tbody>
                    {paymentHistory.map((payment) => (
                      <tr
                        key={payment.id}
                        className="border-b border-blue-100 hover:bg-blue-50"
                      >
                        <td className="px-4 py-4 font-medium">
                          <div
                            onClick={() =>
                              setLocation(`/admin/user/${payment.userId}`)
                            }
                            className="flex cursor-pointer flex-col border-b border-transparent hover:border-b-blue-600 w-fit"
                          >
                            <span className="font-semibold text-slate-800">
                              {payment.username}
                            </span>
                            <span className="text-xs text-slate-500">
                              {payment.email}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 font-mono text-slate-700">
                          {formatCurrency(payment.amount, payment.currency)}
                        </td>
                        <td className="px-4 py-4">
                          <Badge
                            variant={
                              payment.status === "succeeded"
                                ? "secondary"
                                : payment.status === "failed"
                                ? "destructive"
                                : "outline"
                            }
                            className={
                              payment.status === "succeeded"
                                ? "bg-green-100 text-green-700 border-green-200"
                                : payment.status === "processing"
                                ? "border-yellow-500 text-yellow-600"
                                : ""
                            }
                          >
                            {payment.status.charAt(0).toUpperCase() +
                              payment.status.slice(1)}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 font-mono text-xs text-slate-500">
                          {payment.paymentIntentId}
                        </td>
                        <td className="px-4 py-4">
                          {formatDate(payment.createdAt)}
                        </td>
                        {/* <td className="px-4 py-4 text-right">
                          <span className="text-sm text-muted-foreground">
                            No actions
                          </span>
                        </td> */}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between border-t border-blue-200 bg-blue-50 pt-4">
            <div className="text-sm text-blue-600">
              Showing{" "}
              <strong>{totalPayments > 0 ? (page - 1) * limit + 1 : 0}</strong>{" "}
              - <strong>{Math.min(page * limit, totalPayments)}</strong> of{" "}
              <strong>{totalPayments}</strong> payments
            </div>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-blue-200 text-blue-700 hover:bg-blue-100"
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  disabled={page === 1 || isLoading}
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={page === pageNum ? "default" : "outline"}
                        size="sm"
                        className={
                          page === pageNum
                            ? "h-8 w-8 p-0 bg-blue-600 hover:bg-blue-700"
                            : "h-8 w-8 p-0 border-blue-200 text-blue-700 hover:bg-blue-100"
                        }
                        onClick={() => setPage(pageNum)}
                        disabled={isLoading}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-blue-200 text-blue-700 hover:bg-blue-100"
                  onClick={() =>
                    setPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={page === totalPages || isLoading}
                >
                  Next
                </Button>
              </div>
            )}
          </CardFooter>
        </Card>
      </div>
    </AdminLayout>
  );
}
