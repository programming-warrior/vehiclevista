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
  Bike,
  Truck,
  Bus,
  CheckCircle,
  ExternalLink,
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
import { adminGetVehicles, blacklistVehicle, unBlacklistVehicle } from "@/api";
import { useDebounce } from "@/hooks/use-debounce";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";

/* Optional: For a custom scrollbar that matches the design, you can add the following
  CSS to your global stylesheet (e.g., index.css or app.css). This will make the 
  browser scrollbar thinner and color it to match the blue theme.

  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  ::-webkit-scrollbar-track {
    background: #eff6ff; // blue-50
  }
  ::-webkit-scrollbar-thumb {
    background: #3b82f6; // blue-500
    border-radius: 4px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: #2563eb; // blue-600
  }
*/

export default function AdminVehicles() {
  const [vehicles, setVehicles] = useState<any>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<any>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("newest");
  const [statusFilter, setStatusFilter] = useState("ACTIVE");
  const [blacklistDialogOpen, setBlacklistDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [blacklistReason, setBlacklistReason] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalVehicles, setTotalVehicles] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [location, setLocation] = useLocation();

  const debouncedSearch = useDebounce(searchQuery, 500);

  async function fetch(page: number) {
    try {
      setIsLoading(true);
      const filter = {
        search: debouncedSearch,
        status: statusFilter,
      };
      const data = await adminGetVehicles({
        page,
        limit,
        sortBy: sortOption,
        filter: JSON.stringify(filter),
      });
      setVehicles(data.vehicles);
      setFilteredVehicles(data.vehicles);
      setTotalPages(data.totalPages);
      setTotalVehicles(parseInt(data.totalVehicles));
    } catch (e) {
      console.error("Failed to fetch vehicles:", e);
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

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleBlacklistVehicle = (vehicle: any) => {
    setSelectedVehicle(vehicle);
    setBlacklistDialogOpen(true);
  };

  const confirmBlacklist = async () => {
    if (!selectedVehicle) return;
    try {
      await blacklistVehicle(selectedVehicle.id, blacklistReason);
      fetch(page); // Refetch to get the updated list
      setBlacklistDialogOpen(false);
      setBlacklistReason("");
    } catch (error) {
      console.error("Error blacklisting vehicle:", error);
    }
  };

  const removeFromBlacklist = async (vehicleId: any) => {
    try {
      await unBlacklistVehicle(vehicleId, "");
      fetch(page); // Refetch to get the updated list
    } catch (error) {
      console.error("Error unblacklisting vehicle:", error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusTitle = () => {
    switch (statusFilter) {
      case "ACTIVE": return "Active Vehicles";
      case "BLACKLISTED": return "Blacklisted Vehicles";
      case "SOLD": return "Sold Vehicles";
      default: return "All Vehicles";
    }
  };

  const getStatusDescription = () => {
    switch (statusFilter) {
      case "ACTIVE": return "Manage existing vehicle listings";
      case "BLACKLISTED": return "Vehicles that have been blacklisted from the platform";
      case "SOLD": return "Vehicles that have been marked as sold";
      default: return "All vehicle listings";
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        {/* --- Sticky Header for Controls --- */}
        <div className="space-y-4  py-4 backdrop-blur-md dark:bg-slate-950">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-blue-700">
              Vehicle Listing Management
            </h2>
            <div className="flex gap-2">
              <Input
                placeholder="Search vehicles..."
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
                  <SelectItem value="ACTIVE">
                    <span className="flex items-center">
                      <ShieldCheck className="mr-2 h-4 w-4 text-blue-600" />
                      Active Vehicles
                    </span>
                  </SelectItem>
                  <SelectItem value="BLACKLISTED">
                    <span className="flex items-center">
                      <ShieldAlert className="mr-2 h-4 w-4 text-red-600" />
                      Blacklisted Vehicles
                    </span>
                  </SelectItem>
                  <SelectItem value="SOLD">
                    <span className="flex items-center">
                      <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                      Sold Vehicles
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
                    <SelectItem value="leads">Leads (High to Low)</SelectItem>
                    <SelectItem value="clicks">Clicks (High to Low)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* --- Main Content Area --- */}
        {!isLoading && filteredVehicles.length === 0 && (
          <Alert className="border-blue-200 bg-blue-50">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-700">
              No vehicles found
            </AlertTitle>
            <AlertDescription className="text-blue-600">
              There are no vehicles matching the current filters.
            </AlertDescription>
          </Alert>
        )}

        <Card className="border-blue-200 ">
          <CardHeader className="bg-blue-50">
            <CardTitle className="text-blue-700">{getStatusTitle()}</CardTitle>
            <CardDescription className="text-blue-600">
              {getStatusDescription()}
            </CardDescription>
          </CardHeader>

          {/* --- The table no longer has a fixed height or internal scroll --- */}
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex flex-col gap-2 p-6">
                <Skeleton className="h-16 w-full bg-blue-100" />
                <Skeleton className="h-16 w-full bg-blue-100" />
                <Skeleton className="h-16 w-full bg-blue-100" />
                <Skeleton className="h-16 w-full bg-blue-100" />
                <Skeleton className="h-16 w-full bg-blue-100" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-white dark:bg-slate-900">
                    <tr className="border-b border-blue-200">
                      <th className="px-4 py-3 text-left font-medium text-blue-700">Vehicle</th>
                      <th className="px-4 py-3 text-left font-medium text-blue-700">Type</th>
                      <th className="px-4 py-3 text-left font-medium text-blue-700">Make & Model</th>
                      <th className="px-4 py-3 text-center font-medium text-blue-700">
                        <div className="flex items-center justify-center">
                          Reports <ArrowUpDown className="ml-1 h-4 w-4" />
                        </div>
                      </th>
                      <th className="px-4 py-3 text-center font-medium text-blue-700">Stats</th>
                      <th className="px-4 py-3 text-left font-medium text-blue-700">Listed On</th>
                      <th className="px-4 py-3 text-left font-medium text-blue-700">Status</th>
                      <th className="px-4 py-3 text-right font-medium text-blue-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVehicles.map((vehicle: any) => (
                      <tr key={vehicle.id} className="border-b border-blue-100 hover:bg-blue-50">
                        <td className="px-4 py-4 font-medium">
                          <div
                            onClick={() => setLocation("/vehicle/" + vehicle.id)}
                            className="flex cursor-pointer items-center border-b border-transparent hover:border-b-blue-600 w-fit"
                          >
                            {vehicle.title}
                            <ExternalLink className="ml-1 h-3 w-3 text-gray-500" />
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center capitalize">
                            {vehicle.type === "car" ? (<Car size={24} className="stroke-blue-500 mr-2" />)
                            : vehicle.type === "bike" ? (<Bike size={24} className="stroke-blue-500 mr-2" />)
                            : vehicle.type == "truck" ? (<Truck size={24} className="stroke-blue-500 mr-2" />)
                            : vehicle.type == "van" ? (<Bus size={24} className="stroke-blue-500 mr-2" />)
                            : null}
                            {vehicle.type}
                          </div>
                        </td>
                        <td className="px-4 py-4">{vehicle.make} {vehicle.model}</td>
                        <td className="px-4 py-4 text-center">
                          {parseInt(vehicle.reports_count) > 0 ? (
                            <Badge variant="destructive">{vehicle.reports_count}</Badge>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center space-x-2">
                            <Badge variant="secondary" className="flex items-center text-xs">
                              <Eye className="mr-1 h-3 w-3" /> {vehicle.views}
                            </Badge>
                            <Badge variant="secondary" className="flex items-center text-xs">
                              <MessageSquare className="mr-1 h-3 w-3" /> {vehicle.leads}
                            </Badge>
                            <Badge variant="secondary" className="flex items-center text-xs">
                              <MousePointer className="mr-1 h-3 w-3" /> {vehicle.clicks}
                            </Badge>
                          </div>
                        </td>
                        <td className="px-4 py-4">{formatDate(vehicle.createdAt)}</td>
                        <td className="px-4 py-4">
                          <Badge
                            variant={vehicle.status === "ACTIVE" ? "outline" : vehicle.status === "SOLD" ? "secondary" : "destructive"}
                            className={
                                vehicle.status === "ACTIVE" ? "border-blue-500 text-blue-600"
                              : vehicle.status === "SOLD" ? "bg-green-100 text-green-700 border-green-200"
                              : ""
                            }
                          >
                            {vehicle.status === "BLACKLISTED" ? "Blacklisted" : vehicle.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 text-right">
                          {vehicle.status === "ACTIVE" ? (
                            <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700" onClick={() => handleBlacklistVehicle(vehicle)}>
                              <ShieldAlert className="mr-2 h-4 w-4" /> Blacklist
                            </Button>
                          ) : vehicle.status === "BLACKLISTED" ? (
                            <Button variant="outline" size="sm" className="text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700" onClick={() => removeFromBlacklist(vehicle.id)}>
                              <ShieldCheck className="mr-2 h-4 w-4" /> Restore
                            </Button>
                          ) : (
                            <span className="text-sm text-muted-foreground">No actions</span>
                          )}
                        </td>
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
                <strong>{(page - 1) * limit + 1}</strong>
                {" "}-{" "}
                <strong>{Math.min(page * limit, totalVehicles)}</strong>
                {" "}of <strong>{totalVehicles}</strong> vehicles
            </div>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="border-blue-200 text-blue-700 hover:bg-blue-100" onClick={() => setPage((prev) => Math.max(prev - 1, 1))} disabled={page === 1 || isLoading}>
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {/* Pagination Logic Remains the Same */}
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                     let pageNum;
                     if (totalPages <= 5) { pageNum = i + 1; } 
                     else if (page <= 3) { pageNum = i + 1; } 
                     else if (page >= totalPages - 2) { pageNum = totalPages - 4 + i; } 
                     else { pageNum = page - 2 + i; }
                     return (
                        <Button
                          key={pageNum}
                          variant={page === pageNum ? "default" : "outline"}
                          size="sm"
                          className={page === pageNum ? "h-8 w-8 p-0 bg-blue-600 hover:bg-blue-700" : "h-8 w-8 p-0 border-blue-200 text-blue-700 hover:bg-blue-100"}
                          onClick={() => setPage(pageNum)}
                          disabled={isLoading}
                        >
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
              <DialogTitle className="text-blue-700">Blacklist Vehicle</DialogTitle>
              <DialogDescription className="text-blue-600">
                Are you sure you want to blacklist this {selectedVehicle?.make}{" "}
                {selectedVehicle?.model}? This will remove it from active listings.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="reason" className="text-sm font-medium text-blue-700">
                  Reason for blacklisting
                </label>
                <Input id="reason" placeholder="Enter reason for blacklisting" value={blacklistReason} onChange={(e) => setBlacklistReason(e.target.value)} className="border-blue-200" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" className="border-blue-200 text-blue-700" onClick={() => setBlacklistDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmBlacklist} className="bg-red-600 hover:bg-red-700">
                Blacklist Vehicle
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}