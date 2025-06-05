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
import { getAuctionById, placeLiveBid, getBidsForAuction, verifyBidPayment} from "@/api";
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
import ReportDialog from "@/components/ui/report-dialog";
import PaymentFormWrapper from "@/components/payment-form";

export default function AuctionIdPage() {
  const { id } = useParams<{ id: string }>();
  const [auction, setAuction] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bidOpen, setBidOpen] = useState(false);
  const [bidAmount, setBidAmount] = useState("");
  const [bidError, setBidError] = useState("");
  const { userId, role, card_verified } = useUser();
  const { toast } = useToast();
  const [reportOpen, setReportOpen] = useState(false);
  const [paymentformOpen, setPaymentformOpen] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<any>({});

  const [bids, setBids] = useState<any>([]);

  const currentBid = auction?.currentBid ?? auction?.startingPrice ?? 0;
  const totalBids = bids.length;

  function handleBidInput(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setBidAmount(value);
    const num = Number(value);
    if (
      isNaN(num) ||
      num <= (auction?.currentBid ?? auction?.startingPrice ?? 0) ||
      (totalBids === 0 && num <= (auction?.startingPrice ?? 0))
    ) {
      setBidError("Bid must be greater than the current bid.");
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
        }
        // else if (!card_verified) {
        //   toast({
        //     variant: "destructive",
        //     title: "No Card Found",
        //     description: "You need to validate your card before placing bid",
        //   });
        // }
        else {
          const result = await placeLiveBid(id, bidAmount);
          setPaymentInfo({
            clientSecret: result.clientSecret,
            timeout: result.timeout,
            chargedAmount: result.chargedAmount,
            currency: result.currency,
          });
          setPaymentformOpen(true);
          toast({
            title: "Pay the fees to make your bid",
            description: "You have 2 minutes!",
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
      <div className="container mx-auto p-8 flex items-center justify-center min-h-[50vh] bg-gradient-to-br from-blue-50 to-white">
        <div className="text-xl font-medium text-blue-900">Loading vehicle details...</div>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="container mx-auto p-8 text-center min-h-[50vh] bg-gradient-to-br from-blue-50 to-white">
        <div className="text-xl font-medium text-blue-900">Auction not found</div>
      </div>
    );
  }

  

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      <div className="container mx-auto p-4 md:p-6">
        {!auction ? (
          <div className="text-center py-16">Auction not found</div>
        ) : (
          <div className="bg-white shadow-2xl rounded-2xl overflow-hidden border border-blue-100">
            {/* Auction Status Bar */}
            <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 text-white p-6">
              <div className="flex flex-wrap items-center justify-between gap-6">
                <div className="flex items-center gap-8">
                  <div className="flex flex-col bg-blue-800 bg-opacity-50 rounded-lg p-4 backdrop-blur-sm">
                    <span className="text-xs uppercase tracking-wide text-blue-200 mb-1">
                      Current Bid
                    </span>
                    <span className="text-3xl font-bold flex items-center text-white">
                      <DollarSign size={24} className="mr-1 text-yellow-400" />
                      {auction.currentBid}
                    </span>
                  </div>

                  <div className="flex flex-col bg-blue-800 bg-opacity-50 rounded-lg p-4 backdrop-blur-sm">
                    <span className="text-xs uppercase tracking-wide text-blue-200 mb-1">
                      Time Left
                    </span>
                    <span className="text-xl font-medium flex items-center text-white">
                      <Clock size={20} className="mr-2 text-red-400" />
                      <CountdownTimer auction={auction} setAuction={setAuction} />
                    </span>
                  </div>

                  <div className="flex flex-col bg-blue-800 bg-opacity-50 rounded-lg p-4 backdrop-blur-sm">
                    <span className="text-xs uppercase tracking-wide text-blue-200 mb-1">
                      Total Bids
                    </span>
                    <span className="text-xl font-medium flex items-center text-white">
                      <Users size={20} className="mr-2 text-green-400" />
                      {bids.length}
                    </span>
                  </div>
                </div>

                <Button
                  onClick={() => setBidOpen(true)}
                  className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white py-4 px-10 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 font-semibold text-lg"
                >
                  Place Bid
                </Button>
              </div>
            </div>

            <div className="p-8">
              <div className="mb-10">
                <h1 className="text-4xl font-bold mb-4 text-gray-900 bg-gradient-to-r from-blue-900 to-blue-700 bg-clip-text text-transparent">
                  {auction.title ||
                    `${auction.vehicle?.make} ${auction.vehicle?.model} ${auction.vehicle?.year}`}
                </h1>
                <div className="flex items-center gap-3 text-blue-600 bg-blue-50 rounded-lg p-3 w-fit">
                  <MapPin size={18} className="text-blue-500" />
                  <span className="font-medium">{auction.location || "Location not specified"}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Left column - Gallery */}
                <div className="lg:col-span-2">
                  <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-6 shadow-lg border border-blue-100">
                    {auction.vehicle?.images &&
                    auction.vehicle.images.length > 0 ? (
                      <ImageGallery images={auction.vehicle.images} />
                    ) : (
                      <div className="aspect-[4/3] bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center rounded-xl mb-6 border-2 border-dashed border-blue-200">
                        <p className="text-blue-600 font-medium">No images available</p>
                      </div>
                    )}
                  </div>

                  {/* Description with ReactQuill */}
                  <div className="mt-8">
                    <h2 className="text-2xl font-bold mb-6 flex items-center text-gray-900">
                      <div className="bg-blue-100 rounded-lg p-2 mr-3">
                        <Info size={24} className="text-blue-600" />
                      </div>
                      Vehicle Description
                    </h2>
                    <div className="border border-blue-200 rounded-xl p-6 bg-gradient-to-br from-blue-50 to-white shadow-lg">
                      <ReactQuill
                        value={auction.description || "No description available."}
                        readOnly={true}
                        theme="bubble"
                      />
                    </div>
                  </div>
                </div>

                {/* Right column - Vehicle details & Bid history */}
                <div className="lg:col-span-1 space-y-8">
                  {/* Vehicle details card */}
                  <div className="bg-gradient-to-br from-white to-blue-50 border border-blue-200 rounded-2xl p-6 shadow-xl">
                    <h2 className="text-xl font-bold mb-6 border-b border-blue-200 pb-3 text-gray-900 flex items-center">
                      <div className="bg-blue-100 rounded-lg p-2 mr-3">
                        <Tag size={20} className="text-blue-600" />
                      </div>
                      Vehicle Details
                    </h2>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between py-2">
                        <div className="flex items-center text-blue-700">
                          <div className="bg-blue-100 rounded-lg p-1.5 mr-3">
                            <Tag size={16} className="text-blue-600" />
                          </div>
                          <span className="font-medium">Make</span>
                        </div>
                        <span className="font-semibold text-gray-900">
                          {auction.vehicle?.make || "N/A"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between py-2">
                        <div className="flex items-center text-blue-700">
                          <div className="bg-blue-100 rounded-lg p-1.5 mr-3">
                            <Tag size={16} className="text-blue-600" />
                          </div>
                          <span className="font-medium">Model</span>
                        </div>
                        <span className="font-semibold text-gray-900">
                          {auction.vehicle?.model || "N/A"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between py-2">
                        <div className="flex items-center text-blue-700">
                          <div className="bg-blue-100 rounded-lg p-1.5 mr-3">
                            <Calendar size={16} className="text-blue-600" />
                          </div>
                          <span className="font-medium">Year</span>
                        </div>
                        <span className="font-semibold text-gray-900">
                          {auction.vehicle?.year || "N/A"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between py-2">
                        <div className="flex items-center text-blue-700">
                          <div className="bg-blue-100 rounded-lg p-1.5 mr-3">
                            <Gauge size={16} className="text-blue-600" />
                          </div>
                          <span className="font-medium">Mileage</span>
                        </div>
                        <span className="font-semibold text-gray-900">
                          {auction.vehicle?.mileage || "N/A"} km
                        </span>
                      </div>

                      <div className="flex items-center justify-between py-2">
                        <div className="flex items-center text-blue-700">
                          <div className="bg-blue-100 rounded-lg p-1.5 mr-3">
                            <Palette size={16} className="text-blue-600" />
                          </div>
                          <span className="font-medium">Color</span>
                        </div>
                        <span className="font-semibold text-gray-900">
                          {auction.vehicle?.color || "N/A"}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      className="mt-6 w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-xl py-3 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                      size="lg"
                      onClick={() => setReportOpen(true)}
                    >
                      <Info className="h-4 w-4 mr-2" />
                      Report Auction
                    </Button>
                  </div>

                  {/* Bid history card */}
                  <div className="bg-gradient-to-br from-white to-blue-50 border border-blue-200 rounded-2xl p-6 shadow-xl">
                    <h2 className="text-xl font-bold mb-6 border-b border-blue-200 pb-3 flex items-center text-gray-900">
                      <div className="bg-blue-100 rounded-lg p-2 mr-3">
                        <Users size={20} className="text-blue-600" />
                      </div>
                      Bid History
                    </h2>

                    <div className="max-h-80 overflow-y-auto rounded-lg">
                      {bids.length === 0 ? (
                        <div className="text-center py-8 text-blue-600 bg-blue-50 rounded-lg">
                          <Users size={48} className="mx-auto mb-3 text-blue-400" />
                          <p className="font-medium">No bids placed yet</p>
                        </div>
                      ) : (
                        <div className="bg-white rounded-lg border border-blue-100 overflow-hidden">
                          <table className="w-full text-sm">
                            <thead className="bg-gradient-to-r from-blue-50 to-blue-100">
                              <tr className="text-left text-blue-800">
                                <th className="pb-3 pt-3 px-3 font-semibold">User</th>
                                <th className="pb-3 pt-3 px-3 font-semibold">Amount</th>
                                <th className="pb-3 pt-3 px-3 font-semibold">Time</th>
                              </tr>
                            </thead>
                            <tbody>
                              {bids.map((bid: any, idx: number) => (
                                <tr key={idx} className="border-t border-blue-100 hover:bg-blue-50 transition-colors duration-150">
                                  <td className="py-3 px-3 font-medium text-gray-900">
                                    {bid.user.username}
                                  </td>
                                  <td className="py-3 px-3 font-semibold text-blue-600">${bid.bidAmount}</td>
                                  <td className="py-3 px-3 text-gray-500 text-xs">
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
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Payment Dialog */}
        <Dialog open={paymentformOpen} onOpenChange={setPaymentformOpen}>
          <DialogContent className="sm:max-w-3xl bg-gradient-to-br from-white to-blue-50 border border-blue-200">
            <DialogHeader>
              <DialogTitle className="text-2xl text-blue-900">Pay the fee</DialogTitle>
              <DialogDescription className="text-blue-700">
                {paymentInfo.timeout && (
                  <h1 className="font-semibold">Payment Expires in {paymentInfo.timeout}</h1>
                )}
                {paymentInfo.chargedAmount && (
                  <h1 className="font-semibold">
                    Amount of {paymentInfo.chargedAmount}{" "}
                    {paymentInfo.chargedAmount} would be deducted
                  </h1>
                )}
              </DialogDescription>
            </DialogHeader>
            <PaymentFormWrapper verifyPayment={verifyBidPayment} clientSecret={paymentInfo.clientSecret} />
          </DialogContent>
        </Dialog>
        
        {/* Bid Dialog */}
        <Dialog open={bidOpen} onOpenChange={setBidOpen}>
          <DialogContent className="sm:max-w-4xl bg-gradient-to-br from-white to-blue-50 border border-blue-200">
            <DialogHeader>
              <DialogTitle className="text-3xl font-bold text-blue-900">Place Your Bid</DialogTitle>
              <DialogDescription className="text-blue-700">
                Enter your bid amount and confirm to place a live bid.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-6">
              <div className="space-y-6">
                <div className="rounded-xl overflow-hidden shadow-lg border border-blue-200">
                  <img
                    src={auction.vehicle?.images?.[0]}
                    alt="Vehicle"
                    className="w-full aspect-video object-cover"
                  />
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-xl space-y-4 border border-blue-200 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-blue-700">
                      <DollarSign size={20} className="mr-3 text-yellow-500" />
                      <span className="font-semibold">Current Bid:</span>
                    </div>
                    <span className="font-bold text-xl text-gray-900">${currentBid}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-blue-700">
                      <Users size={20} className="mr-3 text-green-500" />
                      <span className="font-semibold">Total Bids:</span>
                    </div>
                    <span className="font-bold text-xl text-gray-900">{totalBids}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-blue-700">
                      <Clock size={20} className="mr-3 text-red-500" />
                      <span className="font-semibold">Time Left:</span>
                    </div>
                    <span className="font-bold text-xl text-gray-900">
                      <CountdownTimer auction={auction} setAuction={setAuction} />
                    </span>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-white to-blue-50 p-6 border border-blue-200 rounded-xl shadow-lg">
                  <div className="font-bold mb-4 text-blue-900 text-lg">Enter Bid Amount</div>
                  <input
                    type="number"
                    className={`w-full border-2 rounded-xl px-4 py-3 text-lg font-semibold transition-all duration-200 ${
                      bidError ? "border-red-500 bg-red-50 focus:border-red-600" : "border-blue-300 bg-white focus:border-blue-500"
                    } focus:outline-none focus:ring-4 focus:ring-blue-100`}
                    placeholder={`Min bid: $${currentBid}`}
                    value={bidAmount}
                    onChange={handleBidInput}
                  />
                  {bidError && (
                    <div className="text-red-500 text-sm mt-2 font-medium">{bidError}</div>
                  )}

                  <Button
                    className="mt-6 w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 rounded-xl py-4 text-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                    disabled={!!bidError || !bidAmount}
                    onClick={handlePlaceBid}
                  >
                    Place Bid Now
                  </Button>
                </div>
              </div>

              <div>
                <div className="mb-4 font-bold flex items-center text-blue-900 text-lg">
                  <div className="bg-blue-100 rounded-lg p-2 mr-3">
                    <Users size={20} className="text-blue-600" />
                  </div>
                  Bid History
                </div>

                <div className="border-2 border-blue-200 rounded-xl h-[450px] overflow-y-auto bg-white shadow-lg">
                  {bids.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-blue-600 p-6">
                      <Users size={64} className="mb-4 text-blue-400" />
                      <p className="font-semibold text-lg">No bids placed yet</p>
                      <p className="text-sm text-blue-500 mt-2">Be the first to bid!</p>
                    </div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead className="bg-gradient-to-r from-blue-100 to-blue-200 sticky top-0">
                        <tr>
                          <th className="text-left py-4 px-4 font-bold text-blue-800">
                            Bidder
                          </th>
                          <th className="text-left py-4 px-4 font-bold text-blue-800">
                            Amount
                          </th>
                          <th className="text-left py-4 px-4 font-bold text-blue-800">
                            Time
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {bids.map((bid: any, idx: number) => (
                          <tr key={idx} className="border-t border-blue-100 hover:bg-blue-50 transition-colors duration-150">
                            <td className="py-4 px-4 font-semibold text-gray-900">{bid.user.username}</td>
                            <td className="py-4 px-4 font-bold text-blue-600">
                              ${bid.bidAmount}
                            </td>
                            <td className="py-4 px-4 text-gray-500 text-xs">
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
        
        <ReportDialog
          isOpen={reportOpen}
          onOpenChange={setReportOpen}
          type="auction"
          targetId={id}
        />
      </div>
    </div>
  );
}