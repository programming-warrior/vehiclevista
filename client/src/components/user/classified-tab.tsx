import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  Car,
  CreditCard,
  Eye,
  Heart,
  History,
  Package,
  Settings,
  ShoppingCart,
  User,
  Loader2,
  MapPin,
  Calendar,
  Fuel,
  Gauge,
  Palette,
  RotateCcw,
  Clock,
  MousePointer,
  TrendingUp,
  PoundSterling,
  Package2Icon,
  EllipsisVertical,
  Edit,
  Trash2,
} from "lucide-react";
import { motion } from "framer-motion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useUser } from "@/hooks/use-store";
import { getUsersClassifiedListings, markClassifiedListingSold } from "@/api";
import Loader from "@/components/loader";
import { Skeleton } from "../ui/skeleton";

import { toast, useToast } from "@/hooks/use-toast";
import { vehicles } from "@shared/schema";
import { useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const ProfileClassifiedTab = () => {
  const [classifiedListings, setClassifiedListings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalListings, setTotalListings] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const { userId } = useUser();
  const [sortOption, setSortOption] = useState("newest");
  const [status, setStatus] = useState("ACTIVE");
  const [limit, setLimit] = useState(5);
  const [location, setLocation] = useLocation();
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<number | null>(null);

  useEffect(() => {
    const fetchClassifiedListings = async () => {
      try {
        setIsLoading(true);
        const filter = {
          search: "",
          status,
        };
        const data = await getUsersClassifiedListings({
          page,
          limit,
          sortBy: sortOption,
          filter: JSON.stringify(filter),
        });
        setClassifiedListings(data.listings || []);
        setTotalListings(parseInt(data.totalListings));
        setTotalPages(data.totalPages);
      } catch (error) {
        console.error("Error fetching classified listings:", error);
        setClassifiedListings([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClassifiedListings();
  }, [userId, sortOption, status, page]);

  function markVehicleSold(listingId: number) {}

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const timeDiff = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((date.getTime() - now.getTime()) / 1000);
    if (seconds < 60) return `${seconds} seconds`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours`;
    const days = Math.floor(hours / 24);
    return `${days} days`;
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const getStatusColor = (status: string) => {
      switch (status.toLowerCase()) {
        case "active":
          return "bg-green-100 text-green-800 border-green-200";
        case "blacklisted":
          return "bg-red-100 text-red-800 border-red-200";
        case "sold":
          return "bg-gray-100 text-gray-800 border-gray-200";
        case "expired":
          return "bg-red-100 text-red-600 border-red-200";
        default:
          return "bg-gray-100 text-gray-800 border-gray-200";
      }
    };

    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(
          status
        )}`}
      >
        {status}
      </span>
    );
  };

  return (
    <>
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-black">Your Classified Listings</CardTitle>
          <CardDescription className="text-gray-600">
            Vehicles you've listed for sale as classified ads
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center space-x-2 mb-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-blue-600">Status</span>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-40 border-blue-200">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="EXPIRED">Expired</SelectItem>
                  <SelectItem value="BLACKLISTED">Blacklisted</SelectItem>
                  <SelectItem value="SOLD">Sold</SelectItem>
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
                  <SelectItem value="views">Views (High to Low)</SelectItem>
                  <SelectItem value="leads">Leads (High to Low)</SelectItem>
                  <SelectItem value="clicks">Clicks (High to Low)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {isLoading ? (
            <div className="py-2 flex flex-col gap-4 border-blue-200">
              <Skeleton className="w-full h-16 bg-blue-100" />
              <Skeleton className="w-full h-16 bg-blue-100" />
              <Skeleton className="w-full h-16 bg-blue-100" />
              <Skeleton className="w-full h-16 bg-blue-100" />
            </div>
          ) : (
            <motion.div
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    when: "beforeChildren",
                    staggerChildren: 0.1,
                  },
                },
              }}
              initial="hidden"
              animate="visible"
              className="space-y-4"
            >
              {classifiedListings.length === 0 ? (
                <Alert className="bg-blue-50 text-blue-800 border-blue-200">
                  <Package className="h-4 w-4" />
                  <AlertTitle>No Classified Listings Found</AlertTitle>
                  <AlertDescription></AlertDescription>
                </Alert>
              ) : (
                classifiedListings.map((listing: any) => (
                  <motion.div
                    key={listing.vehicleId}
                    variants={{
                      hidden: { y: 20, opacity: 0 },
                      visible: {
                        y: 0,
                        opacity: 1,
                        transition: { duration: 0.3 },
                      },
                    }}
                    className="cursor-pointer relative p-4 md:p-6 border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200 bg-white"
                    onClick={() => setLocation(`/vehicle/${listing.vehicleId}`)}
                  >
                    <span className="absolute top-3 right-2 cursor-pointer">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                            <EllipsisVertical
                              size={16}
                              className="text-gray-500"
                            />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          {listing.status === "EXPIRED" &&
                            listing.isRebookable && (
                              <DropdownMenuItem
                                // onClick={handleRebook}
                                className="cursor-pointer"
                              >
                                <Calendar className="mr-2 h-4 w-4" />
                                Rebook
                              </DropdownMenuItem>
                            )}
                          {listing.status === "EXPIRED" &&
                            !listing.isRebookable && (
                              <DropdownMenuItem
                                // onClick={handleRebuy}
                                className="cursor-pointer"
                              >
                                <ShoppingCart className="mr-2 h-4 w-4" />
                                Re-new
                              </DropdownMenuItem>
                            )}

                          <DropdownMenuItem
                            onClick={(e)=>{
                              e.stopPropagation();

                              setLocation(`/vehicle/edit/${listing.vehicleId}`)
                            }}
                            className="cursor-pointer"
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={(e) => {
                              setIsConfirmDialogOpen(true);
                              setSelectedListing(listing.vehicleId);
                              e.stopPropagation();
                            }}
                            className="cursor-pointer text-red-600 focus:text-red-600 "
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Mark Sold
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </span>
                    <div className="flex flex-col lg:flex-row gap-4">
                      {/* Vehicle Image */}
                      <div className="w-full lg:w-48 h-32 lg:h-32 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {listing.images && listing.images.length > 0 ? (
                          <img
                            src={listing.images[0]}
                            alt={listing.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Car size={32} className="text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Vehicle Details */}
                      <div className="flex-1 space-y-3  w-full">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-end gap-2">
                              <h3 className="text-lg md:text-xl font-bold text-black line-clamp-2">
                                {listing.title && listing.title.length > 15
                                  ? listing.title.slice(0, 15) + "..."
                                  : listing.title}
                              </h3>
                              {listing.expiresAt &&
                                listing.status == "ACTIVE" && (
                                  <p className="text-xs text-gray-500">
                                    Expires in {timeDiff(listing.expiresAt)}
                                  </p>
                                )}
                            </div>

                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-sm md:text-lg font-semibold text-blue-600 flex items-center">
                                <PoundSterling size={10} />{" "}
                                {listing.price?.toLocaleString()}
                              </p>
                              <StatusBadge status={listing.status} />
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                          <div className="flex flex-col text-gray-600">
                            <span className="truncate">
                              {listing.make} | {listing.model}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-gray-600 ">
                          <div className="flex items-center gap-1">
                            <Package2Icon size={14} />
                            <span className="truncate font-bold">
                              {listing.packageName}
                            </span>
                          </div>
                        </div>

                        {/* <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-gray-600 ">
                        <div className="flex items-center gap-1">
                          <Package2Icon size={14} />
                          <span className="truncate" title={listing.location}>
                            {listing.location && listing.location.length > 30
                              ? listing.location.slice(0, 30) + "..."
                              : listing.location}
                          </span>
                        </div>
                      </div> */}

                        {listing.blacklistReason && (
                          <Alert className="bg-red-50 text-red-800 border-red-200">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                              <strong>Blacklisted:</strong>{" "}
                              {listing.blacklistReason}
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>

                      {/* Stats & Actions */}
                      <div className="w-full lg:w-32 flex lg:flex-col gap-4 lg:gap-2 justify-between lg:justify-start">
                        <div className="flex lg:flex-col gap-4 lg:gap-2 lg:text-center">
                          <div className="flex items-center lg:justify-center gap-1 text-xs text-gray-500">
                            <Eye size={12} />
                            <span>{listing.views}</span>
                            <span className="hidden sm:inline">views</span>
                          </div>
                          <div className="flex items-center lg:justify-center gap-1 text-xs text-gray-500">
                            <MousePointer size={12} />
                            <span>{listing.clicks}</span>
                            <span className="hidden sm:inline">clicks</span>
                          </div>
                          <div className="flex items-center lg:justify-center gap-1 text-xs text-gray-500">
                            <TrendingUp size={12} />
                            <span>{listing.leads}</span>
                            <span className="hidden sm:inline">leads</span>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 lg:text-center">
                          <Clock size={12} className="inline mr-1" />
                          <span className="text-xs text-gray-500">
                            Created at {formatDate(listing.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}
        </CardContent>
        <CardFooter className="pt-2 flex flex-col sm:flex-row sm:justify-between gap-2 bg-blue-50">
          <div className="text-sm text-blue-600 order-2 sm:order-1">
            Showing {classifiedListings.length} of {totalListings} listings
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-2 order-1 sm:order-2">
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

      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent >
          <DialogHeader>
            <DialogTitle>Mark as Sold</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            Are you sure you want to mark this listing as sold? It will remove
            the vehicle from the listing and cannot be undone.
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsConfirmDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                console.log(selectedListing);
                if (selectedListing) {
                  console.log('calling mark classified listing sold');
                  markClassifiedListingSold(selectedListing)
                    .then((data) => {
                      toast({
                        title: "success",
                        description: "listing flagged as sold",
                      });
                    })
                    .catch((error: any) => {
                      console.log(error);
                      toast({
                        title: "Failed",
                        variant: "destructive",
                        description: error.message || "something went wrong",
                      });
                    });
                }
                setIsConfirmDialogOpen(false);
              }}
            >
              Okay
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProfileClassifiedTab;
