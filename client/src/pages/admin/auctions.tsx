import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowUpDown,
  Car,
  ShieldAlert,
  ShieldCheck,
  Eye,
  MousePointer,
  MessageSquare,
  Clock,
  CheckCircle,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import AdminLayout from "@/components/admin/admin-layout";
import { adminGetAuctions } from "@/api"; 
import { useDebounce } from "@/hooks/use-debounce";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";
import { adminToggleAuctionVisibility } from "@/api";
import { Separator } from "@radix-ui/react-select";
import { toast } from "@/hooks/use-toast";

export default function AdminAuctions() {
  const [auctions, setAuctions] = useState<any>([]);
  const [filteredAuctions, setFilteredAuctions] = useState<any>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("newest");
  const [statusFilter, setStatusFilter] = useState("RUNNING");
  const [blacklistDialogOpen, setBlacklistDialogOpen] = useState(false);
  const [selectedAuction, setSelectedAuction] = useState<any>(null);
  const [blacklistReason, setBlacklistReason] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAuctions, setTotalAuctions] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [visibilityDialogOpen, setVisibilityDialogOpen] = useState(false);
  const [visibilityAction, setVisibilityAction] = useState<"enable" | "disable">("enable");

  const [, setLocation] = useLocation();

  const debouncedSearch = useDebounce(searchQuery, 500);

  async function fetch(pageToFetch: number) {
    try {
      setIsLoading(true);
      const filter = {
        search: debouncedSearch,
        status: statusFilter,
      };
      const data = await adminGetAuctions({
        page: pageToFetch,
        limit,
        sortBy: sortOption,
        filter: JSON.stringify(filter),
      });
      setAuctions(data.auctions);
      setFilteredAuctions(data.auctions);
      setTotalPages(data.totalPages);
      setTotalAuctions(parseInt(data.totalAuctions));
    } catch (e) {
      console.error("Error fetching auctions:", e);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetch(page);
  }, [page, limit, sortOption]);

  useEffect(() => {
    fetch(1);
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  const handleBlacklistAuction = (auction: any) => {
    setSelectedAuction(auction);
    setBlacklistDialogOpen(true);
  };

  const confirmBlacklist = async () => {
    if (!selectedAuction) return;
    try {
      // await blacklistAuction(selectedAuction.id, blacklistReason);
      setBlacklistDialogOpen(false);
      setBlacklistReason("");
    } catch (error) {
      console.error("Error blacklisting auction:", error);
    }
  };

  const removeFromBlacklist = async (auctionId: number) => {
    try {
      // await unBlacklistAuction(auctionId, "");
      // fetch(page); // Refetch data
    } catch (error) {
      console.error("Error unblacklisting auction:", error);
    }
  };

  const confirmVisibilityChange = async () => {
    try {
      await adminToggleAuctionVisibility(visibilityAction === "enable" ? "disable" : "enable");
      setVisibilityDialogOpen(false);
      toast({
        title: "Success",
        description: `Auctions visibility ${visibilityAction == 'enable' ? "disabled" : "enabled"}, successfully.`,
      })
      setVisibilityAction(visibilityAction === "enable" ? "disable" : "enable");
    } catch (err:any) {
      console.error(err);
      setVisibilityDialogOpen(false);
      toast({
        variant: "destructive",
        title:"Failed",
        description: err.message || "An error occurred while changing auctions visibility. Please try again.",
      })
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "RUNNING":
        return <Badge className="bg-green-100 text-green-700 border-green-200">Running</Badge>;
      case "UPCOMING":
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Upcoming</Badge>;
      case "SOLD":
        return <Badge className="bg-purple-100 text-purple-700 border-purple-200">Sold</Badge>;
      case "ENDED":
        return <Badge className="bg-gray-100 text-gray-700 border-gray-200">Ended</Badge>;
      case "BLACKLISTED":
        return <Badge variant="destructive">Blacklisted</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getStatusTitle = () => {
    switch (statusFilter) {
      case "RUNNING": return "Running Auctions";
      case "SOLD": return "Sold Auctions";
      case "UPCOMING": return "Upcoming Auctions";
      case "ENDED": return "Ended Auctions";
      default: return "Auction Listings";
    }
  };

  const getStatusDescription = () => {
    switch (statusFilter) {
      case "RUNNING": return "Manage all currently active auctions.";
      case "SOLD": return "Auctions where the vehicle has been sold.";
      case "UPCOMING": return "Auctions scheduled to start in the future.";
      case "ENDED": return "Auctions that have finished without a sale.";
      default: return "Manage all vehicle auction listings on the platform.";
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-blue-700">Auction Management</h2>
          <div className="flex gap-2">
            <Input
              placeholder="Search auctions..."
              className="w-64 border-blue-200 focus:border-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-blue-600">Enable/Disable Auctions View:</span>
            <button
              className="p-1 rounded-md "
              onClick={() => { setVisibilityDialogOpen(true) }}
            >
              {visibilityAction == 'enable' ? <ToggleRight className="text-blue-600" size={30} /> : <ToggleLeft className="text-gray-400" size={30} />}
            </button>
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
                <SelectItem value="RUNNING">
                  <span className="flex items-center">
                    <Car className="mr-2 h-4 w-4 text-green-600" /> Running
                  </span>
                </SelectItem>
                <SelectItem value="SOLD">
                  <span className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-purple-600" /> Sold
                  </span>
                </SelectItem>
                <SelectItem value="UPCOMING">
                  <span className="flex items-center">
                    <Clock className="mr-2 h-4 w-4 text-blue-600" /> Upcoming
                  </span>
                </SelectItem>
                <SelectItem value="ENDED">
                  <span className="flex items-center">
                    <ShieldCheck className="mr-2 h-4 w-4 text-gray-600" /> Ended
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-blue-600">Show:</span>
              <Select value={limit.toString()} onValueChange={(val) => setLimit(parseInt(val))}>
                <SelectTrigger className="w-20 border-blue-200">
                  <SelectValue placeholder="Entries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-blue-600">Sort by:</span>
              <Select value={sortOption} onValueChange={setSortOption}>
                <SelectTrigger className="w-40 border-blue-200">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                  <SelectItem value="reports">Reports (High to Low)</SelectItem>
                  <SelectItem value="views">Views (High to Low)</SelectItem>
                  <SelectItem value="bids">Bids (High to Low)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>


        <Card className="border-blue-200">
          <CardHeader className="bg-blue-50">
            <CardTitle className="text-blue-700">{getStatusTitle()}</CardTitle>
            <CardDescription className="text-blue-600">{getStatusDescription()}</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {!isLoading && filteredAuctions.length === 0 && (
              <div className="p-6">
                <Alert className="border-blue-200 bg-blue-50">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertTitle className="text-blue-700">No auctions found</AlertTitle>
                  <AlertDescription className="text-blue-600">
                    There are no auctions matching the current filters.
                  </AlertDescription>
                </Alert>
              </div>
            )}
            {isLoading ? (
              <div className="flex flex-col gap-2 p-6">
                <Skeleton className="h-16 w-full bg-blue-100" />
                <Skeleton className="h-16 w-full bg-blue-100" />
                <Skeleton className="h-16 w-full bg-blue-100" />
                <Skeleton className="h-16 w-full bg-blue-100" />
                <Skeleton className="h-16 w-full bg-blue-100" />
              </div>
            ) : (
              filteredAuctions.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-white dark:bg-slate-900">
                      <tr className="border-b border-blue-200">
                        <th className="px-4 py-3 text-left font-medium text-blue-700">Auction Title</th>
                        <th className="px-4 py-3 text-left font-medium text-blue-700">Time Frame</th>
                        <th className="px-4 py-3 text-center font-medium text-blue-700">Reports</th>
                        <th className="px-4 py-3 text-center font-medium text-blue-700">Stats</th>
                        <th className="px-4 py-3 text-center font-medium text-blue-700">Bids</th>
                        <th className="px-4 py-3 text-left font-medium text-blue-700">Status</th>
                        <th className="px-4 py-3 text-right font-medium text-blue-700">Visibility</th>
                        {/* <th className="px-4 py-3 text-right font-medium text-blue-700">Actions</th> */}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAuctions.map((auction: any) => (
                        <tr key={auction.id} className="border-b border-blue-100 hover:bg-blue-50">
                          <td className="px-4 py-4 font-medium">
                            <span onClick={() => setLocation(`/auction/${auction.id}`)} className="cursor-pointer hover:underline">{auction.title}</span>
                          </td>
                          <td className="px-4 py-4 text-xs">
                            <div className="flex flex-col">
                              <span>Starts: {formatDate(auction.startDate)}</span>
                              <span>Ends: {formatDate(auction.endDate)}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            {parseInt(auction.reports_count) > 0 ? (
                              <Badge variant="destructive">{auction.reports_count}</Badge>
                            ) : (
                              <span className="text-muted-foreground">0</span>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center justify-center space-x-2">
                              <Badge variant="secondary" className="flex items-center text-xs">
                                <Eye className="mr-1 h-3 w-3" /> {auction.views}
                              </Badge>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <Badge variant="outline" className="border-blue-500 text-blue-600">
                              {auction.total_bids}
                            </Badge>
                          </td>
                          <td className="px-4 py-4">{getStatusBadge(auction.status)}</td>

                          {/* <td className="px-4 py-4 text-right">
                                {auction.status !== "BLACKLISTED" ? (
                                    <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700" onClick={(e) => { e.stopPropagation(); handleBlacklistAuction(auction); }}>
                                        <ShieldAlert className="mr-2 h-4 w-4" /> Blacklist
                                    </Button>
                                ) : (
                                    <Button variant="outline" size="sm" className="text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700" onClick={(e) => { e.stopPropagation(); removeFromBlacklist(auction.id); }}>
                                        <ShieldCheck className="mr-2 h-4 w-4" /> Restore
                                    </Button>
                                )}
                            </td> */}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </CardContent>
          <CardFooter className="flex justify-between border-t border-blue-200 bg-blue-50 pt-4">
            <div className="text-sm text-blue-600">
              Showing{" "}<strong>{(page - 1) * limit + 1}</strong> -{" "}<strong>{Math.min(page * limit, totalAuctions)}</strong> of{" "}<strong>{totalAuctions}</strong> auctions
            </div>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="border-blue-200 text-blue-700 hover:bg-blue-100" onClick={() => setPage((prev) => Math.max(prev - 1, 1))} disabled={page === 1 || isLoading}>
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) pageNum = i + 1;
                    else if (page <= 3) pageNum = i + 1;
                    else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                    else pageNum = page - 2 + i;

                    return (
                      <Button key={pageNum} variant={page === pageNum ? "default" : "outline"} size="sm" className={page === pageNum ? "h-8 w-8 p-0 bg-blue-600 hover:bg-blue-700" : "h-8 w-8 p-0 border-blue-200 text-blue-700 hover:bg-blue-100"} onClick={() => setPage(pageNum)} disabled={isLoading}>
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button variant="outline" size="sm" className="border-blue-200 text-blue-700 hover:bg-blue-100" onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))} disabled={page === totalPages || isLoading}>
                  Next
                </Button>
              </div>
            )}
          </CardFooter>
        </Card>

        <Dialog open={blacklistDialogOpen} onOpenChange={setBlacklistDialogOpen}>
          <DialogContent className="border-blue-300">
            <DialogHeader>
              <DialogTitle className="text-blue-700">Blacklist Auction</DialogTitle>
              <DialogDescription className="text-blue-600">
                Are you sure you want to blacklist "{selectedAuction?.title}"? This
                will remove it from public view and halt bidding.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="reason" className="text-sm font-medium text-blue-700">
                  Reason for blacklisting
                </label>
                <Input
                  id="reason"
                  placeholder="Enter reason for blacklisting"
                  value={blacklistReason}
                  onChange={(e) => setBlacklistReason(e.target.value)}
                  className="border-blue-200"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" className="border-blue-200 text-blue-700" onClick={() => setBlacklistDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmBlacklist} className="bg-red-600 hover:bg-red-700">
                Blacklist Auction
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog open={visibilityDialogOpen} onOpenChange={setVisibilityDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-blue-700">{visibilityAction === 'enable' ? 'Disable Auction Visibility' : 'Enable Auction Visibility'}</DialogTitle>
              <DialogDescription className="text-red-600 mt-2">
                {visibilityAction === 'enable' ? (
                  <>
                    Turning off visibility will hide this auction from regular users — they will not be able to see the auction page. But they would be able to create or update it.
                  </>
                ) : (
                  <>
                    Turning on visibility will make the auction visible to regular users. They will be able to view and participate in the auction if it's active.
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="text-sm text-gray-700">
                Are you sure you want to {visibilityAction =='enable' ? 'disable' : 'enable'} visibility all the auctions?
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" className="border-blue-200 text-blue-700" onClick={() => setVisibilityDialogOpen(false)}>Cancel</Button>
              <Button variant={visibilityAction === 'disable' ? 'destructive' : 'default'} onClick={confirmVisibilityChange}>
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}