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
  CheckCircle,
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

export default function AdminVehicles() {
  const [vehicles, setVehicles] = useState<any>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<any>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("newest");
  const [statusFilter, setStatusFilter] = useState("ACTIVE"); // Changed from showBlacklisted
  const [blacklistDialogOpen, setBlacklistDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [blacklistReason, setBlacklistReason] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  const [totalVehicles, setTotalVehicles] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const debouncedSearch = useDebounce(searchQuery, 500);
    async function fetch(page:number) {
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


  const handleBlacklistVehicle = (vehicle: any) => {
    setSelectedVehicle(vehicle);
    setBlacklistDialogOpen(true);
  };

  const confirmBlacklist = async () => {
    try {
      await blacklistVehicle(selectedVehicle.id, blacklistReason);
      setVehicles(
        vehicles.map((vehicle: any) =>
          vehicle.id === selectedVehicle?.id
            ? { ...vehicle, status: "BLACKLISTED", blacklistReason }
            : vehicle
        )
      );
      setFilteredVehicles(
        filteredVehicles.filter(
          (vehicle: any) => vehicle.id !== selectedVehicle?.id
        )
      );
      setBlacklistDialogOpen(false);
      setBlacklistReason("");
    } catch (error) {
      console.error("Error blacklisting vehicle:", error);
    }
  };

  const removeFromBlacklist = async (vehicleId: any) => {
    try {
      await unBlacklistVehicle(vehicleId, "");
      setVehicles(
        vehicles.map((vehicle: any) =>
          vehicle.id === vehicleId
            ? { ...vehicle, status: "ACTIVE", blacklistReason: "" }
            : vehicle
        )
      );
      setFilteredVehicles(
        filteredVehicles.filter((vehicle: any) => vehicle.id !== vehicleId)
      );
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
      case "ACTIVE":
        return "Active Vehicles";
      case "BLACKLISTED":
        return "Blacklisted Vehicles";
      case "SOLD":
        return "Sold Vehicles";
      default:
        return "All Vehicles";
    }
  };

  const getStatusDescription = () => {
    switch (statusFilter) {
      case "ACTIVE":
        return "Manage existing vehicle listings";
      case "BLACKLISTED":
        return "Vehicles that have been blacklisted from the platform";
      case "SOLD":
        return "Vehicles that have been marked as sold";
      default:
        return "All vehicle listings";
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
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

        <div className="flex justify-between items-center space-x-2">
          <div className="flex items-center space-x-2">
            <Button
              variant={statusFilter === "ACTIVE" ? "default" : "outline"}
              className={
                statusFilter === "ACTIVE" ? "bg-blue-600 hover:bg-blue-700" : ""
              }
              onClick={() => setStatusFilter("ACTIVE")}
            >
              <ShieldCheck className="mr-2 h-4 w-4" />
              Active Vehicles
            </Button>
            <Button
              variant={statusFilter === "BLACKLISTED" ? "default" : "outline"}
              className={statusFilter === "BLACKLISTED" ? "bg-blue-600 hover:bg-blue-700" : ""}
              onClick={() => setStatusFilter("BLACKLISTED")}
            >
              <ShieldAlert className="mr-2 h-4 w-4" />
              Blacklisted Vehicles
            </Button>
            <Button
              variant={statusFilter === "SOLD" ? "default" : "outline"}
              className={statusFilter === "SOLD" ? "bg-blue-600 hover:bg-blue-700" : ""}
              onClick={() => setStatusFilter("SOLD")}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Sold Vehicles
            </Button>
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

        {((statusFilter === "BLACKLISTED" && filteredVehicles.length === 0) ||
          (statusFilter === "SOLD" && filteredVehicles.length === 0)) && (
          <Alert className="border-blue-200 bg-blue-50">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-700">
              No {statusFilter.toLowerCase()} vehicles
            </AlertTitle>
            <AlertDescription className="text-blue-600">
              There are currently no {statusFilter.toLowerCase()} vehicles in the system.
            </AlertDescription>
          </Alert>
        )}

        <Card className="border-blue-200">
          <CardHeader className="bg-blue-50">
            <CardTitle className="text-blue-700">
              {getStatusTitle()}
            </CardTitle>
            <CardDescription className="text-blue-600">
              {getStatusDescription()}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {isLoading ? (
              <div className="py-2 flex flex-col gap-4 border-blue-200">
                <Skeleton className="w-full h-16 bg-blue-100" />
                <Skeleton className="w-full h-16 bg-blue-100" />
                <Skeleton className="w-full h-16 bg-blue-100" />
                <Skeleton className="w-full h-16 bg-blue-100" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-blue-100">
                      <th className="text-left py-3 px-4 font-medium text-blue-700">
                        Vehicle
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-blue-700">
                        Type
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-blue-700">
                        Make & Model
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-blue-700">
                        Location
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
                      <th className="text-left py-3 px-4 font-medium text-blue-700">
                        Listed On
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-blue-700">
                        Status
                      </th>
                      <th className="text-right py-3 px-4 font-medium text-blue-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVehicles.map((vehicle: any) => (
                      <tr
                        key={vehicle.id}
                        className="border-b border-blue-100 hover:bg-blue-50"
                      >
                        <td className="py-4 px-4 ">
                          <div className="flex items-center font-medium">
                            {vehicle.title}
                          </div>
                        </td>
                        <td className="py-4 px-4 ">
                          <div className="flex items-center">
                            {vehicle.type === "car" ? (
                              <Car size={30} className="stroke-blue-500 mr-1" />
                            ) : vehicle.type === "bike" ? (
                              <Bike
                                size={30}
                                className="stroke-blue-500 mr-1"
                              />
                            ) : vehicle.type == "truck" ? (
                              <Truck
                                size={30}
                                className="stroke-blue-500 mr-1"
                              />
                            ) : vehicle.type == "van" ? (
                              <Bus size={30} className="stroke-blue-500 mr-1" />
                            ) : (
                              ""
                            )}
                            {vehicle.type}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          {vehicle.make} {vehicle.model}
                        </td>
                        <td className="py-4 px-4 max-w-xs truncate">
                          {vehicle.location}
                        </td>
                        <td className="py-4 px-4 text-center">
                          {parseInt(vehicle.reports_count) > 0 ? (
                            <Badge variant="destructive">
                              {vehicle.reports_count}
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
                              <Eye className="mr-1 h-3 w-3" /> {vehicle.views}
                            </Badge>
                            <Badge
                              variant="secondary"
                              className="text-xs flex items-center"
                            >
                              <MessageSquare className="mr-1 h-3 w-3" />{" "}
                              {vehicle.leads}
                            </Badge>
                            <Badge
                              variant="secondary"
                              className="text-xs flex items-center"
                            >
                              <MousePointer className="mr-1 h-3 w-3" />{" "}
                              {vehicle.clicks}
                            </Badge>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          {formatDate(vehicle.createdAt)}
                        </td>
                        <td className="py-4 px-4">
                          <Badge
                            variant={
                              vehicle.status === "ACTIVE"
                                ? "outline"
                                : vehicle.status === "SOLD"
                                ? "secondary"
                                : "destructive"
                            }
                            className={
                              vehicle.status === "ACTIVE"
                                ? "border-blue-500 text-blue-600"
                                : vehicle.status === "SOLD"
                                ? "bg-green-100 text-green-700 border-green-200"
                                : ""
                            }
                          >
                            {vehicle.status === "BLACKLISTED"
                              ? "Blacklisted"
                              : vehicle.status === "SOLD"
                              ? "Sold"
                              : "Active"}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-right">
                          {vehicle.status === "ACTIVE" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                              onClick={() => handleBlacklistVehicle(vehicle)}
                            >
                              <ShieldAlert className="mr-2 h-4 w-4" />
                              Blacklist
                            </Button>
                          ) : vehicle.status === "BLACKLISTED" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
                              onClick={() => removeFromBlacklist(vehicle.id)}
                            >
                              <ShieldCheck className="mr-2 h-4 w-4" />
                              Restore
                            </Button>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              No actions available
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
          <CardFooter className="pt-2 flex justify-between bg-blue-50">
            <div className="text-sm text-blue-600">
              Showing {filteredVehicles.length} of {totalVehicles} vehicles
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
                Blacklist Vehicle
              </DialogTitle>
              <DialogDescription className="text-blue-600">
                Are you sure you want to blacklist this {selectedVehicle?.make}{" "}
                {selectedVehicle?.model}? This will remove it from active
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
                Blacklist Vehicle
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}