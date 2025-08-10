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
import { getUsersAuctionListings, markAuctionListingSold } from "@/api";
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
import { useFavouriteListings } from "@/hooks/use-store";
import CountdownTimer from "../countdown-timer";

const ProfileFavouriteAuctionTab = () => {
    const {auctions: favouriteAuctions, addAuctionToFavourite, removeAuctionFromFavourite} = useFavouriteListings();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalListings, setTotalListings] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const { userId } = useUser();
  const [sortOption, setSortOption] = useState("newest");
  const [status, setStatus] = useState("RUNNING");
  const [limit, setLimit] = useState(5);
  const [location, setLocation] = useLocation();


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
        case "running":
          return "bg-green-100 text-green-800 border-green-200";
        case "blacklisted":
          return "bg-red-100 text-red-800 border-red-200";
        case "sold":
          return "bg-gray-100 text-gray-800 border-gray-200";
        case "ended":
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
          <CardTitle className="text-black">Your Favourite Auctions</CardTitle>
          <CardDescription className="text-gray-600">
            Auctions you've listed to favourites
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center space-x-2 mb-4">

            {/* <div className="flex items-center space-x-2">
              <span className="text-sm text-blue-600">Sort by:</span>
              <Select value={sortOption} onValueChange={setSortOption}>
                <SelectTrigger className="w-40 border-blue-200">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                </SelectContent>
              </Select>
            </div> */}
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
              {favouriteAuctions.length === 0 ? (
                <Alert className="bg-blue-50 text-blue-800 border-blue-200">
                  <Package className="h-4 w-4" />
                  <AlertTitle>You haven't saved any auctions</AlertTitle>
                  <AlertDescription></AlertDescription>
                </Alert>
              ) : (
                favouriteAuctions.map((listing: any) => (
                  <motion.div
                    key={listing.id}
                    variants={{
                      hidden: { y: 20, opacity: 0 },
                      visible: {
                        y: 0,
                        opacity: 1,
                        transition: { duration: 0.3 },
                      },
                    }}
                    className="cursor-pointer relative p-4 md:p-6 border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200 bg-white"
                    onClick={() => setLocation(`/auction/${listing.id}`)}
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

                          <DropdownMenuSeparator />
                          
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                removeAuctionFromFavourite(listing.id)
                              }}
                              className="cursor-pointer text-red-600 focus:text-red-600 "
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Remove
                            </DropdownMenuItem>
                          
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </span>
                    <div className="flex flex-col lg:flex-row gap-4">
                      {/* Vehicle Image */}
                      <div className="w-full lg:w-48 h-32 lg:h-32 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {listing.itemType == "VEHICLE" &&
                          listing.vehicle.images &&
                          listing.vehicle.images.length > 0 && (
                            <img
                              src={listing.vehicle.images[0]}
                              alt={listing.title}
                              className="w-full h-full object-cover"
                            />
                          )}
                        {listing.itemType== "NUMBERPLATE" &&
                          listing.numberPlate && (
                            <div className="flex items-center justify-center h-full">
                              <span
                                className="bg-yellow-300 border-2 border-black rounded-md px-6 py-2 text-2xl font-bold tracking-widest text-black shadow-inner"
                                style={{
                                  letterSpacing: "0.2em",
                                  fontFamily: "monospace",
                                  minWidth: "120px",
                                  display: "inline-block",
                                }}
                              >
                                {listing.numberPlate.plate_number}
                              </span>
                            </div>
                          )}
                      </div>

                      <div className="flex-1 space-y-3  w-full">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-end gap-2">
                              <h3 className="text-lg md:text-xl font-bold text-black line-clamp-2">
                                {listing.title && listing.title.length > 15
                                  ? listing.title.slice(0, 15) + "..."
                                  : listing.title}
                              </h3>
                              {listing.endDate &&
                                listing.status == "RUNNING" && (
                                 <CountdownTimer auction={listing}/>
                                )}
                            </div>

                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-sm md:text-lg font-semibold text-blue-600 flex items-center">
                                <PoundSterling size={10} />{" "}
                                {listing.currentBid?.toLocaleString()}
                              </p>
                              <StatusBadge status={listing.status} />
                            </div>
                          </div>
                        </div>

                      </div>

                      {/* Stats & Actions */}
                      {/* <div className="w-full lg:w-32 flex lg:flex-col gap-4 lg:gap-2 justify-between lg:justify-start">
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
                        </div>
                        <div className="text-xs text-gray-500 lg:text-center">
                          <Clock size={12} className="inline mr-1" />
                          <span className="text-xs text-gray-500">
                            Started at {formatDate(listing.startDate)}
                          </span>
                        </div>
                      </div> */}
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}
        </CardContent>
        <CardFooter className="pt-2 flex flex-col sm:flex-row sm:justify-between gap-2 bg-blue-50">
          <div className="text-sm text-blue-600 order-2 sm:order-1">
            Showing {favouriteAuctions.length} of {favouriteAuctions.length} listings
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
    </>
  );
};

export default ProfileFavouriteAuctionTab;
