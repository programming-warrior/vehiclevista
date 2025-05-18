import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowUpDown,
  Car,
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserX,
  Eye,
  MousePointer,
  MessageSquare,
  Bike,
  Truck,
  Bus,
  Clock,
  CheckCircle
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "wouter";

export default function AdminVehicles() {
  const [auctions, setAuctions] = useState<any>([]);
  const [filteredAuctions, setFilteredAuctions] = useState<any>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("newest");
  const [activeTab, setActiveTab] = useState("RUNNING");
  const [blacklistDialogOpen, setBlacklistDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [blacklistReason, setBlacklistReason] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAuctions, setTotalAuctions] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const [, setLocation] = useLocation();

  const debouncedSearch = useDebounce(searchQuery, 500);

  async function fetch(page:number) {
    try {
      setIsLoading(true);
      const filter = {
        search: debouncedSearch,
        status: activeTab,
      };
      const data = await adminGetAuctions({
        page,
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
  }, [debouncedSearch, activeTab]);

  const handleBlacklistVehicle = (vehicle:any) => {
    setSelectedVehicle(vehicle);
    setBlacklistDialogOpen(true);
  };

  const confirmBlacklist = async () => {
    try {
      // await blacklistVehicle(selectedVehicle.id, blacklistReason);
      setAuctions(
        auctions.map((vehicle:any) =>
          vehicle.id === selectedVehicle?.id
            ? { ...vehicle, status: "BLACKLISTED", blacklistReason }
            : vehicle
        )
      );
      setFilteredAuctions(
        filteredAuctions.filter(
          (vehicle:any) => vehicle.id !== selectedVehicle?.id
        )
      );
      setBlacklistDialogOpen(false);
      setBlacklistReason("");
    } catch (error) {
      console.error("Error blacklisting vehicle:", error);
    }
  };

  const removeFromBlacklist = async (vehicleId:number) => {
    try {
      // await unBlacklistVehicle(vehicleId, "");
      setAuctions(
        auctions.map((vehicle:any) =>
          vehicle.id === vehicleId
            ? { ...vehicle, status: "ACTIVE", blacklistReason: "" }
            : vehicle
        )
      );
      setFilteredAuctions(
        filteredAuctions.filter((vehicle:any) => vehicle.id !== vehicleId)
      );
    } catch (error) {
      console.error("Error unblacklisting vehicle:", error);
    }
  };

  const formatDate = (dateString:string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute:"2-digit",
    });
  };

  const getStatusBadge = (status:string) => {
    switch (status) {
      case "RUNNING":
        return <Badge variant="outline" className="border-green-500 text-green-600">Running</Badge>;
      case "UPCOMING":
        return <Badge variant="outline" className="border-blue-500 text-blue-600">Upcoming</Badge>;
      case "ENDED":
        return <Badge variant="outline" className="border-gray-500 text-gray-600">Ended</Badge>;
      case "BLACKLISTED":
        return <Badge variant="destructive">Blacklisted</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status:string) => {
    switch (status) {
      case "RUNNING":
        return <Car className="mr-2 h-4 w-4" />;
      case "UPCOMING":
        return <Clock className="mr-2 h-4 w-4" />;
      case "ENDED":
        return <CheckCircle className="mr-2 h-4 w-4" />;
      case "BLACKLISTED":
        return <ShieldAlert className="mr-2 h-4 w-4" />;
      default:
        return <Car className="mr-2 h-4 w-4" />;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold text-blue-700">
             Auction Management
          </h2>
          <div className="flex gap-2">
            <Input
              placeholder="Search auctions..."
              className="w-64 border-blue-200 focus:border-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <Card className="border-blue-200">
          <CardHeader className="bg-blue-50 pb-2">
            <CardTitle className="text-blue-700">
              Auction Listings
            </CardTitle>
            <CardDescription className="text-blue-600">
              Manage all vehicle auction listings on the platform
            </CardDescription>
          </CardHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="px-6 pt-2 bg-blue-50">
              <TabsList className="grid grid-cols-4 bg-blue-100">
                <TabsTrigger value="RUNNING" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  <Car className="mr-2 h-4 w-4" />
                  Running
                </TabsTrigger>
                <TabsTrigger value="UPCOMING" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  <Clock className="mr-2 h-4 w-4" />
                  Upcoming
                </TabsTrigger>
                <TabsTrigger value="ENDED" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Ended
                </TabsTrigger>
                <TabsTrigger value="BLACKLISTED" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  <ShieldAlert className="mr-2 h-4 w-4" />
                  Blacklisted
                </TabsTrigger>

              </TabsList>
            </div>

            <div className="flex justify-end px-6 py-2 bg-blue-50">
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
                    <SelectItem value="leads">Leads (High to Low)</SelectItem>
                    <SelectItem value="clicks">Clicks (High to Low)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <TabsContent value={activeTab} className="mt-0">
              <CardContent>
                {filteredAuctions.length === 0 && !isLoading && (
                  <Alert className="border-blue-200 bg-blue-50">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <AlertTitle className="text-blue-700">
                      No {activeTab.toLowerCase()} auctions
                    </AlertTitle>
                    <AlertDescription className="text-blue-600">
                      There are currently no {activeTab.toLowerCase()} auctions in the system.
                    </AlertDescription>
                  </Alert>
                )}

                {isLoading ? (
                  <div className="py-2 flex flex-col gap-4 border-blue-200">
                    <Skeleton className="w-full h-16 bg-blue-100" />
                    <Skeleton className="w-full h-16 bg-blue-100" />
                    <Skeleton className="w-full h-16 bg-blue-100" />
                    <Skeleton className="w-full h-16 bg-blue-100" />
                  </div>
                ) : filteredAuctions.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-blue-100">
                          <th className="text-left py-3 px-4 font-medium text-blue-700">
                            Title
                          </th>
                          <th className="text-left py-3 px-4 font-medium text-blue-700">
                            Start Date
                          </th>
                          <th className="text-left py-3 px-4 font-medium text-blue-700">
                            End Date
                          </th>
                          <th className="text-center py-3 px-4 font-medium text-blue-700">
                            <div className="flex items-center justify-center">
                              Reports
                              <ArrowUpDown className="ml-1 h-4 w-4" />
                            </div>
                          </th>
                          <th className="text-center py-3 px-4 font-medium text-blue-700">
                            Stats
                          </th>
                          <th className="text-center py-3 px-4 font-medium text-blue-700">
                            Bids
                          </th>
                          <th className="text-left py-3 px-4 font-medium text-blue-700">
                            Status
                          </th>
                          <th className="text-right py-3 px-4 font-medium text-blue-700">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAuctions.map((auction:any) => (
                          <tr
                            key={auction.id}
                            onClick={()=>setLocation(`/auction/${auction.id}`)}
                            className="border-b border-blue-100 hover:bg-blue-50 cursor-pointer"
                          >
                            <td className="py-4 px-4">
                              <div className="flex items-center font-medium">
                                {auction.title}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              {formatDate(auction.startDate)}
                            </td>
                            <td className="py-4 px-4">
                              {formatDate(auction.endDate)}
                            </td>
                            <td className="py-4 px-4 text-center">
                              {parseInt(auction.reports_count) > 0 ? (
                                <Badge variant="destructive">
                                  {auction.reports_count}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">0</span>
                              )}
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center justify-center space-x-2">
                                <Badge
                                  variant="secondary"
                                  className="text-xs flex items-center"
                                >
                                  <Eye className="mr-1 h-3 w-3" /> {auction.views}
                                </Badge>
                                <Badge
                                  variant="secondary"
                                  className="text-xs flex items-center"
                                >
                                  <MessageSquare className="mr-1 h-3 w-3" />{" "}
                                  {auction.leads}
                                </Badge>
                                <Badge
                                  variant="secondary"
                                  className="text-xs flex items-center"
                                >
                                  <MousePointer className="mr-1 h-3 w-3" />{" "}
                                  {auction.clicks}
                                </Badge>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-center">
                              <Badge variant="outline" className="border-blue-500 text-blue-600">
                                {auction.total_bids}
                              </Badge>
                            </td>
                            <td className="py-4 px-4">
                              {getStatusBadge(auction.status)}
                            </td>
                            <td className="py-4 px-4 text-right">
                              {auction.status !== "BLACKLISTED" ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                                  onClick={() => handleBlacklistVehicle(auction)}
                                >
                                  <ShieldAlert className="mr-2 h-4 w-4" />
                                  Blacklist
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
                                  onClick={() => removeFromBlacklist(auction.id)}
                                >
                                  <ShieldCheck className="mr-2 h-4 w-4" />
                                  Restore
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </TabsContent>
          </Tabs>

          <CardFooter className="pt-2 flex justify-between bg-blue-50">
            <div className="text-sm text-blue-600">
              Showing {filteredAuctions.length} of {totalAuctions} auctions
            </div>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-blue-200 hover:bg-blue-100 text-blue-700"
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
                            ? "w-8 h-8 p-0 bg-blue-600 hover:bg-blue-700"
                            : "w-8 h-8 p-0 border-blue-200 text-blue-700 hover:bg-blue-100"
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
                  className="border-blue-200 hover:bg-blue-100 text-blue-700"
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

        <Dialog
          open={blacklistDialogOpen}
          onOpenChange={setBlacklistDialogOpen}
        >
          <DialogContent className="border-blue-300">
            <DialogHeader>
              <DialogTitle className="text-blue-700">
                Blacklist Auction
              </DialogTitle>
              <DialogDescription className="text-blue-600">
                Are you sure you want to blacklist "{selectedVehicle?.title}"? This will remove it from active
                listings.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label
                  htmlFor="reason"
                  className="text-sm font-medium text-blue-700"
                >
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
              <Button
                variant="outline"
                className="border-blue-200 text-blue-700"
                onClick={() => setBlacklistDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmBlacklist}
                className="bg-red-600 hover:bg-red-700"
              >
                Blacklist Auction
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}