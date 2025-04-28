import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, Car, DollarSign, Calendar, User, BarChart2 } from "lucide-react";
import { getTopListings } from "@/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface TopListingType {
  vehicleId: number;
  auctionId?: number;
  id?: number;
  title: string;
  description: string;
  clicks: number;
  views: number;
  image_url: string;
  type: "vehicle" | "auction";
  sellerId: number;
  sellerUsername: string;
  sellerEmail: string;
  createdAt: string;
  price: number;
  make: string;
  model: string;
  year: number;
}

const TopListing = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [topListings, setTopListings] = useState<TopListingType[]>([]);
  const [selectedListing, setSelectedListing] = useState<TopListingType | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchTopListings() {
      try {
        setIsLoading(true);
        const data = await getTopListings();
        setTopListings(data);
      } catch (error) {
        console.error("Error fetching top listings:", error);
        toast({
          title: "Error",
          description: "Failed to load top listings. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchTopListings();
  }, [toast]);

  const handleViewDetails = (listing: TopListingType) => {
    setSelectedListing(listing);
    setIsDialogOpen(true);
  };

  const formatCurrency = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Card className="shadow-lg border-t-4 border-t-blue-500">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-white">
        <div className="flex justify-between items-center">
          <CardTitle className="text-2xl font-bold text-blue-900">Top Listings</CardTitle>
          {isLoading && <Loader2 className="animate-spin text-blue-500" />}
        </div>
        <p className="text-gray-500 font-medium">
          Highest performing vehicle listings based on user engagement
        </p>
      </CardHeader>
      
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <span className="ml-2 text-gray-500">Loading listings...</span>
          </div>
        ) : topListings.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No top listings found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">Vehicle</TableHead>
                  <TableHead className="font-semibold">Details</TableHead>
                  <TableHead className="font-semibold">Listing Type</TableHead>
                  <TableHead className="font-semibold">Seller</TableHead>
                  <TableHead className="font-semibold text-center">Views</TableHead>
                  <TableHead className="font-semibold text-center">Clicks</TableHead>
                  <TableHead className="font-semibold">Listed On</TableHead>
                  <TableHead className="font-semibold w-24 text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topListings.map((listing, i) => (
                  <TableRow
                    key={i}
                    id={listing.auctionId ? listing.auctionId.toString() : listing.vehicleId.toString()}
                    className="hover:bg-blue-50 transition-colors duration-150"
                  >
                    <TableCell className="font-medium">
                      {listing.year} {listing.make} {listing.model}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      <div className="font-medium">{listing.title}</div>
                      <div className="text-sm text-gray-500 truncate">{listing.description}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={listing.type === "auction" ? "secondary" : "default"} className="capitalize">
                        {listing.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{listing.sellerUsername}</div>
                      <div className="text-xs text-gray-500">{listing.sellerEmail}</div>
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      <div className="flex flex-col items-center">
                        <span className="text-blue-700">{listing.views}</span>
                        <span className="text-xs text-gray-500">views</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      <div className="flex flex-col items-center">
                        <span className="text-green-700">{listing.clicks}</span>
                        <span className="text-xs text-gray-500">clicks</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(listing.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center">
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="flex items-center gap-1 hover:bg-blue-100 hover:text-blue-700 transition-colors"
                          onClick={() => handleViewDetails(listing)}
                        >
                          <Eye size={16} />
                          View
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Detailed View Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          {selectedListing && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl flex items-center gap-2 text-blue-900">
                  <Car className="h-6 w-6" />
                  {selectedListing.year} {selectedListing.make} {selectedListing.model}
                </DialogTitle>
                <DialogDescription>
                  <Badge variant={selectedListing.type === "auction" ? "secondary" : "default"} className="mb-2 capitalize">
                    {selectedListing.type}
                  </Badge>
                  <div className="text-lg font-medium text-gray-800 mt-1">{selectedListing.title}</div>
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-6 py-4">
                {selectedListing.image_url && (
                  <div className="aspect-video bg-gray-100 rounded-md overflow-hidden">
                    <img 
                      src="/api/placeholder/640/360" 
                      alt={`${selectedListing.year} ${selectedListing.make} ${selectedListing.model}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-1">
                    <h4 className="font-medium text-gray-500">Description</h4>
                    <p className="text-gray-800">{selectedListing.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      <div>
                        <div className="text-sm text-gray-500">Price</div>
                        <div className="font-semibold">{formatCurrency(selectedListing.price)}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      <div>
                        <div className="text-sm text-gray-500">Listed On</div>
                        <div className="font-semibold">
                          {new Date(selectedListing.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5 text-purple-600" />
                      <div>
                        <div className="text-sm text-gray-500">Seller</div>
                        <div className="font-semibold">{selectedListing.sellerUsername}</div>
                        <div className="text-xs text-gray-500">{selectedListing.sellerEmail}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <BarChart2 className="h-5 w-5 text-orange-600" />
                      <div>
                        <div className="text-sm text-gray-500">Performance</div>
                        <div className="font-semibold">{selectedListing.views} views</div>
                        <div className="text-xs text-gray-500">{selectedListing.clicks} clicks</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Close
                </Button>
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => {
                    // Navigate to full detail page
                    toast({
                      title: "Action",
                      description: `Navigating to full details for ${selectedListing.make} ${selectedListing.model}`,
                    });
                  }}
                >
                  View Full Details
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default TopListing;