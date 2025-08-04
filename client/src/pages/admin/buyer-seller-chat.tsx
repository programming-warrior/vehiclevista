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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"; // Added Tooltip imports
import AdminLayout from "@/components/admin/layout";
import { adminGetChatHistory } from "@/api";
import { useDebounce } from "@/hooks/use-debounce";
import {
  AlertCircle,
  AlertTriangle,
  CheckCheck,
  Send,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

// Helper to format date and time for chat
const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

export default function AdminBuyerSellerChatHistory() {
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("newest");
  const [statusFilter, setStatusFilter] = useState("delivered");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalChats, setTotalChats] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [location, setLocation] = useLocation();
  const debouncedSearch = useDebounce(searchQuery, 500);
  const { toast } = useToast();

  async function fetchChats(currentPage: number) {
    try {
      setIsLoading(true);
      const filter = {
        search: debouncedSearch,
        status: statusFilter,
      };
      const data = await adminGetChatHistory({
        page: currentPage,
        limit,
        sortBy: sortOption,
        filter: JSON.stringify(filter),
      });

      setChatHistory(data.chatHistory || []);
      setTotalPages(data.totalPages || 1);
      setTotalChats(data.totalChats || 0);
    } catch (e: any) {
      console.error("Failed to fetch chat history:", e);
      toast({
        variant: "destructive",
        title: "Error Fetching Messages",
        description: "There was a problem loading the chat history.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Refetch hooks remain the same
  useEffect(() => {
    setPage(1);
    fetchChats(1);
  }, [debouncedSearch, statusFilter, sortOption]);

  useEffect(() => {
    fetchChats(page);
  }, [page, limit]);

  const getStatusTitle = () => {
    switch (statusFilter) {
      case "pending":
        return "Pending Messages";
      case "delivered":
        return "Delivered Messages";
      case "failed":
        return "Failed Messages";
      default:
        return "All Messages";
    }
  };

  const getStatusDescription = () => {
    switch (statusFilter) {
      case "pending":
        return "A log of all messages waiting to be sent.";
      case "delivered":
        return "Messages that have been successfully delivered.";
      case "failed":
        return "Messages that failed to be delivered.";
      default:
        return `Showing ${totalChats} total messages.`;
    }
  };

  return (
    <AdminLayout>
      <TooltipProvider>
        <div className="space-y-6">
          {/* --- Sticky Header for Controls (No Changes) --- */}
          <div className="space-y-4 py-4 backdrop-blur-md dark:bg-slate-950">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-blue-700">
                Buyer-Seller Chat History
              </h2>
              <div className="flex gap-2">
                <Input
                  placeholder="Search by user, email, or message..."
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
                    <SelectItem value="pending">
                      <span className="flex items-center">
                        <Send className="mr-2 h-4 w-4 text-blue-600" />
                        Pending
                      </span>
                    </SelectItem>
                    <SelectItem value="delivered">
                      <span className="flex items-center">
                        <CheckCheck className="mr-2 h-4 w-4 text-green-600" />
                        Delivered
                      </span>
                    </SelectItem>
                    <SelectItem value="failed">
                      <span className="flex items-center">
                        <AlertTriangle className="mr-2 h-4 w-4 text-red-600" />
                        Failed
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
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
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
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>


          {/* --- Main Content Area --- */}
          {!isLoading && chatHistory.length === 0 && (
            <Alert className="border-blue-200 bg-blue-50">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-700">No Messages Found</AlertTitle>
              <AlertDescription className="text-blue-600">
                There are no messages matching the current filters.
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
                  {/* Skeletons remain the same */}
                  <Skeleton className="h-16 w-full bg-blue-100" />
                  <Skeleton className="h-16 w-full bg-blue-100" />
                  <Skeleton className="h-16 w-full bg-blue-100" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-white dark:bg-slate-900">
                      <tr className="border-b border-blue-200">
                        <th className="px-4 py-3 text-left font-medium text-blue-700">Buyer</th>
                        <th className="px-4 py-3 text-left font-medium text-blue-700">Seller</th>
                        <th className="px-4 py-3 text-left font-medium text-blue-700">Message</th>
                        <th className="px-4 py-3 text-left font-medium text-blue-700">Status</th>
                        <th className="px-4 py-3 text-left font-medium text-blue-700">Sent On</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chatHistory.map((chat) => (
                        <tr key={chat.id} className="border-b border-blue-100 hover:bg-blue-50">
                          <td className="px-4 py-4 align-top">
                            <div className="flex cursor-pointer flex-col w-fit">
                              <span className="font-semibold text-slate-800">{chat.buyer.username}</span>
                              <span className="text-xs text-slate-500">{chat.buyer.email}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 align-top">
                            <div className="flex cursor-pointer flex-col w-fit">
                              <span className="font-semibold text-slate-800">{chat.seller.username}</span>
                              <span className="text-xs text-slate-500">{chat.seller.email}</span>
                            </div>
                          </td>
                          
                          {/* MODIFICATION START: Truncate and add tooltip for long messages */}
                          <td className="px-4 py-4 max-w-sm align-top">
                            {chat.message.length > 50 ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <p className="truncate text-slate-700 cursor-default">
                                    {chat.message.split('').slice(0,50).join("") } + {chat.message.length > 50 ? "..."  : ""  } 
                                  </p>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-md bg-slate-800 text-white border-slate-700">
                                  <p className="whitespace-pre-wrap">{chat.message}</p>
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              <p className="text-slate-700">{chat.message}</p>
                            )}
                          </td>
                          {/* MODIFICATION END */}

                          <td className="px-4 py-4 align-top">
                            <Badge
                              variant={
                                chat.status === "failed" ? "destructive"
                                : chat.status === "delivered" ? "secondary"
                                : "outline"
                              }
                              className={
                                chat.status === "delivered"
                                  ? "bg-green-100 text-green-700 border-green-200"
                                  : chat.status === "pending"
                                  ? "border-blue-300 text-blue-700"
                                  : ""
                              }
                            >
                              {chat.status.charAt(0).toUpperCase() + chat.status.slice(1)}
                            </Badge>
                          </td>
                          <td className="px-4 py-4 text-xs text-slate-500 align-top whitespace-nowrap">
                            {formatDateTime(chat.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
            {/* CardFooter remains the same */}
            <CardFooter className="flex justify-between border-t border-blue-200 bg-blue-50 pt-4">
              <div className="text-sm text-blue-600">
                Showing{" "}
                <strong>{totalChats > 0 ? (page - 1) * limit + 1 : 0}</strong> -{" "}
                <strong>{Math.min(page * limit, totalChats)}</strong> of{" "}
                <strong>{totalChats}</strong> messages
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
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-blue-200 text-blue-700 hover:bg-blue-100"
                    onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={page === totalPages || isLoading}
                  >
                    Next
                  </Button>
                </div>
              )}
            </CardFooter>
          </Card>
        </div>
      </TooltipProvider>
    </AdminLayout>
  );
}