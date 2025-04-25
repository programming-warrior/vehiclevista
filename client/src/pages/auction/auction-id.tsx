import React, { useEffect, useState } from "react";
import { useParams } from "wouter";
import {
  Heart,
  Mail,
  Phone,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Clock,
  Tag,
  Users,
  DollarSign,
  Info,
  Calendar,
  Gauge,
  Palette,
} from "lucide-react";
import { getAuctionById, placeLiveBid, getBidsForAuction } from "@/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import ImageGallery from "@/components/image-gallery";
import { Button } from "@/components/ui/button";
import CountdownTimer from "@/components/countdown-timer";
import { useUser } from "@/hooks/use-store";
import { useToast } from "@/hooks/use-toast";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.bubble.css";

export default function AuctionIdPage() {
  const { id } = useParams<{ id: string }>();
  const [auction, setAuction] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bidOpen, setBidOpen] = useState(false);
  const [bidAmount, setBidAmount] = useState("");
  const [bidError, setBidError] = useState("");
  const { userId, role, card_verified } = useUser();
  const { toast } = useToast();

  const [bids, setBids] = useState<any>([]);

  const currentBid = auction?.currentBid ?? auction?.startingPrice ?? 0;
  const totalBids = bids.length;

  function handleBidInput(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setBidAmount(value);
    const num = Number(value);
    if (
      isNaN(num) ||
      num < (auction?.currentBid ?? auction?.startingPrice ?? 0) ||
      (totalBids === 0 && num < (auction?.startingPrice ?? 0))
    ) {
      setBidError("Bid must be equal to or greater than the current bid.");
    } else {
      setBidError("");
    }
  }

  async function handlePlaceBid() {
    if (!bidError && bidAmount) {
      try {
        if (!userId) {
          toast({
            variant: "destructive",
            title: "Login Required",
            description: "You need to logged in before placing bid",
          });
        } else if (!card_verified) {
          toast({
            variant: "destructive",
            title: "No Card Found",
            description: "You need to validate your card before placing bid",
          });
        } else {
          const result = await placeLiveBid(id, bidAmount);
          toast({
            title: "Bid Request Added",
            description:
              "You will be notified if your bid request is successfull or not",
          });
        }
      } catch (e: any) {
        toast({
          variant: "destructive",
          title: "Failed",
          description: e.message ?? "Something went wrong",
        });
      } finally {
        setBidOpen(false);
        setBidAmount("");
      }
    }
  }

  useEffect(() => {
    const fetchAuction = async () => {
      setLoading(true);
      try {
        const response = await getAuctionById(id as string);
        setAuction(response);
      } catch (error) {
        console.error("Error fetching auction:", error);
      } finally {
        setLoading(false);
      }
    };
    const fetchAuctionBids = async () => {
      try {
        const response = await getBidsForAuction(id as string);
        setBids(response.bids);
      } catch (error) {
        console.error("Error fetching bids:", error);
      }
    };

    fetchAuctionBids();
    fetchAuction();
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto p-8 flex items-center justify-center min-h-[50vh]">
        <div className="text-xl font-medium">Loading vehicle details...</div>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="container mx-auto p-8 text-center min-h-[50vh]">
        <div className="text-xl font-medium">Auction not found</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 bg-gray-50">
      {!auction ? (
        <div className="text-center py-16">Auction not found</div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          {/* Auction Status Bar */}
          <div className="bg-gray-800 text-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="flex flex-col">
                  <span className="text-sm uppercase tracking-wide">
                    Current Bid
                  </span>
                  <span className="text-2xl font-bold flex items-center">
                    <DollarSign size={20} className="mr-1" />
                    {auction.currentBid}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-sm uppercase tracking-wide">
                    Time Left
                  </span>
                  <span className="text-2xl font-medium flex items-center">
                    <Clock size={20} className="mr-1" />
                    <CountdownTimer auction={auction} setAuction={setAuction} />
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-sm uppercase tracking-wide">
                    Total Bids
                  </span>
                  <span className="text-2xl font-medium flex items-center">
                    <Users size={20} className="mr-1" />
                    {bids.length}
                  </span>
                </div>
              </div>

              <Button
                onClick={() => setBidOpen(true)}
                className="bg-green-600 hover:bg-green-700 text-white py-3 px-8 rounded-md"
              >
                Place Bid
              </Button>
            </div>
          </div>

          <div className="p-6">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">
                {auction.title ||
                  `${auction.vehicle?.make} ${auction.vehicle?.model} ${auction.vehicle?.year}`}
              </h1>
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin size={16} />
                <span>{auction.location || "Location not specified"}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left column - Gallery */}
              <div className="lg:col-span-2">
                {auction.vehicle?.images &&
                auction.vehicle.images.length > 0 ? (
                  <ImageGallery images={auction.vehicle.images} />
                ) : (
                  <div className="aspect-[4/3] bg-gray-200 flex items-center justify-center rounded-md mb-6">
                    <p>No images available</p>
                  </div>
                )}

                {/* Description with ReactQuill */}
                <div className="mt-8">
                  <h2 className="text-xl font-bold mb-4 flex items-center">
                    <Info size={20} className="mr-2" />
                    Vehicle Description
                  </h2>
                  <div className="border rounded-md p-4 bg-gray-50">
                    <ReactQuill
                      value={auction.description || "No description available."}
                      readOnly={true}
                      theme="bubble"
                    />
                  </div>
                </div>
              </div>

              {/* Right column - Vehicle details & Bid history */}
              <div className="lg:col-span-1 space-y-6">
                {/* Vehicle details card */}
                <div className="bg-gray-50 border rounded-lg p-5 shadow-sm">
                  <h2 className="text-xl font-bold mb-4 border-b pb-2">
                    Vehicle Details
                  </h2>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-gray-700">
                        <Tag size={18} className="mr-2" />
                        <span>Make</span>
                      </div>
                      <span className="font-medium">
                        {auction.vehicle?.make || "N/A"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-gray-700">
                        <Tag size={18} className="mr-2" />
                        <span>Model</span>
                      </div>
                      <span className="font-medium">
                        {auction.vehicle?.model || "N/A"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-gray-700">
                        <Calendar size={18} className="mr-2" />
                        <span>Year</span>
                      </div>
                      <span className="font-medium">
                        {auction.vehicle?.year || "N/A"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-gray-700">
                        <Gauge size={18} className="mr-2" />
                        <span>Mileage</span>
                      </div>
                      <span className="font-medium">
                        {auction.vehicle?.mileage || "N/A"} km
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-gray-700">
                        <Palette size={18} className="mr-2" />
                        <span>Color</span>
                      </div>
                      <span className="font-medium">
                        {auction.vehicle?.color || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bid history card */}
                <div className="bg-gray-50 border rounded-lg p-5 shadow-sm">
                  <h2 className="text-xl font-bold mb-4 border-b pb-2 flex items-center">
                    <Users size={20} className="mr-2" />
                    Bid History
                  </h2>

                  <div className="max-h-80 overflow-y-auto">
                    {bids.length === 0 ? (
                      <div className="text-center py-6 text-gray-500">
                        No bids placed yet
                      </div>
                    ) : (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-gray-600">
                            <th className="pb-2">User</th>
                            <th className="pb-2">Amount</th>
                            <th className="pb-2">Time</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bids.map((bid: any, idx: number) => (
                            <tr key={idx} className="border-t">
                              <td className="py-2 font-medium">
                                {bid.user.username}
                              </td>
                              <td className="py-2">${bid.bidAmount}</td>
                              <td className="py-2 text-gray-500">
                                {new Date(bid.createdAt).toLocaleString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                    hour: "numeric",
                                    minute: "2-digit",
                                    hour12: true,
                                  }
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Dialog open={bidOpen} onOpenChange={setBidOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Place Your Bid</DialogTitle>
            <DialogDescription>
              Enter your bid amount and confirm to place a live bid.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-4">
            <div className="space-y-4">
              <div className="rounded-md overflow-hidden">
                <img
                  src={auction.vehicle?.images?.[0]}
                  alt="Vehicle"
                  className="w-full aspect-video object-cover"
                />
              </div>

              <div className="bg-gray-50 p-4 rounded-md space-y-3">
                <div className="flex items-center">
                  <DollarSign size={18} className="mr-2 text-gray-600" />
                  <span className="font-semibold">Current Bid:</span>
                  <span className="ml-2">${currentBid}</span>
                </div>

                <div className="flex items-center">
                  <Users size={18} className="mr-2 text-gray-600" />
                  <span className="font-semibold">Total Bids:</span>
                  <span className="ml-2">{totalBids}</span>
                </div>

                <div className="flex items-center">
                  <Clock size={18} className="mr-2 text-gray-600" />
                  <span className="font-semibold">Time Left:</span>
                  <span className="ml-2">
                    <CountdownTimer auction={auction} setAuction={setAuction} />
                  </span>
                </div>
              </div>

              <div className="p-4 border rounded-md">
                <div className="font-semibold mb-2">Enter Bid Amount</div>
                <input
                  type="number"
                  className={`w-full border rounded-md px-3 py-2 ${
                    bidError ? "border-red-500 bg-red-50" : "border-gray-300"
                  }`}
                  placeholder={`Min bid: $${currentBid}`}
                  value={bidAmount}
                  onChange={handleBidInput}
                />
                {bidError && (
                  <div className="text-red-500 text-xs mt-1">{bidError}</div>
                )}

                <Button
                  className="mt-4 w-full bg-green-600 hover:bg-green-700"
                  disabled={!!bidError || !bidAmount}
                  onClick={handlePlaceBid}
                >
                  Place Bid Now
                </Button>
              </div>
            </div>

            <div>
              <div className="mb-3 font-semibold flex items-center">
                <Users size={18} className="mr-2" />
                Bid History
              </div>

              <div className="border rounded-md h-[400px] overflow-y-auto bg-white">
                {bids.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    No bids placed yet
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="text-left py-3 px-4 font-semibold">
                          Bidder
                        </th>
                        <th className="text-left py-3 px-4 font-semibold">
                          Amount
                        </th>
                        <th className="text-left py-3 px-4 font-semibold">
                          Time
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {bids.map((bid: any, idx: number) => (
                        <tr key={idx} className="border-t hover:bg-gray-50">
                          <td className="py-3 px-4">{bid.user.username}</td>
                          <td className="py-3 px-4 font-medium">
                            ${bid.bidAmount}
                          </td>
                          <td className="py-3 px-4 text-gray-500">
                            {bid.createdAt}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
