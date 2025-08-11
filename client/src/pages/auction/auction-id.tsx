import React, { useEffect, useState } from "react";
import { useParams } from "wouter";
import {
  // Base Icons
  Heart,
  Mail,
  MapPin,
  Clock,
  Tag,
  Users,
  DollarSign,
  Info,
  Calendar,
  Gauge,
  Palette,
  FileText,
  Hash,
  MessageSquare,
  Check,
  // Imported from VehicleIdPage for new sections
  DoorOpen,
  Armchair,
  Cog,
  Wind,
  GitCommitHorizontal,
  UserCircle,
  CarFront,
  Gavel,
  CalendarDays,
} from "lucide-react";
import {
  getAuctionById,
  placeLiveBid,
  getBidsForAuction,
  verifyBidPayment,
  addToRecentViewApi,
} from "@/api";
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
import { useUser, useWebSocket } from "@/hooks/use-store";
import { useToast } from "@/hooks/use-toast";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.bubble.css";
import ReportDialog from "@/components/ui/report-dialog";
import PaymentFormWrapper from "@/components/payment-form";
import { useRecentViews } from "@/hooks/use-store";
import { Separator } from "@radix-ui/react-select";
import Loader from "@/components/loader";

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
  const { socket } = useWebSocket();
  const { addToRecentView } = useRecentViews();

  const [bids, setBids] = useState<any>([]);
  const [newBidId, setNewBidId] = useState<string | null>(null);
  const [bidPlacedEffect, setBidPlacedEffect] = useState(false);
  const [currentBidPulse, setCurrentBidPulse] = useState(false);

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

  useEffect(() => {
    const handleBidPlaceEvent = (msg: any) => {
      const newBid = {
        ...msg,
      };

      setBids((prev: any) => {
        const updatedBids = [...prev, newBid].sort(
          (a, b) => b.bidAmount - a.bidAmount
        );
        return updatedBids;
      });

      // Update auction current bid if this is the highest
      if (auction && msg.bidAmount > auction.currentBid) {
        setAuction((prev: any) => ({ ...prev, currentBid: msg.bidAmount }));
        setCurrentBidPulse(true);
        setTimeout(() => setCurrentBidPulse(false), 2000);
      }

      // Trigger visual effects
      setNewBidId(newBid.id);
      setBidPlacedEffect(true);

      // Remove effects after animation
      setTimeout(() => {
        setNewBidId(null);
        setBidPlacedEffect(false);
      }, 5000);

      toast({
        title: "New Bid Placed! 🎯",
        description: `New bid of ${msg.bidAmount} has been placed!`,
        duration: 4000,
      });
    };

    const handleSocketMessage = (e: any) => {
      const data = JSON.parse(e.data);
      if (data.event === "BID_PLACED") {
        handleBidPlaceEvent(data.message);
      }
    };

    if (socket && socket.OPEN) {
      socket.addEventListener("message", handleSocketMessage);
    }

    return () => {
      socket?.removeEventListener("message", handleSocketMessage);
    };
  }, [auction, socket, toast]);

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
            description: "It will expire in 2 minutes!",
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
        addToRecentViewApi(Number(id), "auction")
          .then((data) => addToRecentView(data.savedRecord))
          .catch((e) => console.error(e));
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

  // Helper function to format strings (e.g., "MANUAL" => "Manual")
  const formatString = (str: string | null | undefined): string => {
    if (!str || typeof str !== "string") return "N/A";
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  if (loading) {
    return (
      <div className="container mx-auto p-8 flex items-center justify-center min-h-[50vh]">
          <Loader/>
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

  const isVehicleAuction = auction.itemType === "VEHICLE";
  const isNumberplateAuction = auction.itemType === "NUMBERPLATE";

  return (
    <div className="container mx-auto p-4 md:p-6 bg-gray-50">
      {!auction ? (
        <div className="text-center py-16">Auction not found</div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          {/* Auction Status Bar */}
          <div
            className={`bg-gray-800 text-white p-4 transition-all duration-500 ${
              bidPlacedEffect
                ? "bg-gradient-to-r from-green-600 to-blue-600 shadow-lg transform scale-[1.02]"
                : ""
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="flex flex-col">
                  <span className="text-sm uppercase tracking-wide">
                    Current Bid
                  </span>
                  <span
                    className={`text-2xl font-bold flex items-center transition-all duration-500 ${
                      currentBidPulse
                        ? "text-green-400 scale-110 animate-pulse"
                        : ""
                    }`}
                  >
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
                  <span
                    className={`text-2xl font-medium flex items-center transition-all duration-300 ${
                      bidPlacedEffect ? "text-yellow-400 scale-110" : ""
                    }`}
                  >
                    <Users size={20} className="mr-1" />
                    {bids.length}
                  </span>
                </div>
              </div>

              <Button
                onClick={() => setBidOpen(true)}
                className={`bg-blue-600 hover:bg-blue-700 text-white py-3 px-8 rounded-md transition-all duration-300 ${
                  bidPlacedEffect ? "animate-bounce shadow-lg" : ""
                }`}
              >
                Place Bid
              </Button>
            </div>
          </div>

          <div className="p-6">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">
                {auction.title ||
                  (isVehicleAuction
                    ? `${auction.vehicle?.make} ${auction.vehicle?.model} ${auction.vehicle?.year}`
                    : isNumberplateAuction
                    ? `Number Plate: ${auction.numberPlate?.plate_number}`
                    : "Auction Item")}
              </h1>
              <div className="flex items-center gap-4 text-gray-600">
                {/* <div className="flex items-center gap-2">
                  {
                    
                  }
                  <MapPin size={16} />
                  <span>{auction.vehicle.location || "Location not specified"}</span>
                </div> */}
                <div className="flex items-center gap-2">
                  <Tag size={16} />
                  <span className="capitalize">
                    {auction.itemType.toLowerCase()}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left column - Gallery/Images */}
              <div className="lg:col-span-2">
                {isVehicleAuction &&
                auction.vehicle?.images &&
                auction.vehicle.images.length > 0 ? (
                  <ImageGallery images={auction.vehicle.images} />
                ) : isNumberplateAuction ? (
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
                      {auction.numberPlate.plate_number}
                    </span>
                  </div>
                ) : (
                  <div className="aspect-[4/3] bg-gray-200 flex items-center justify-center rounded-md mb-6">
                    <p>No images available</p>
                  </div>
                )}

                {/* Description with ReactQuill */}
                <div className="mt-8">
                  <h2 className="text-xl font-bold mb-4 flex items-center">
                    <Info size={20} className="mr-2" />
                    {isVehicleAuction
                      ? "Vehicle Description"
                      : isNumberplateAuction
                      ? "Number Plate Description"
                      : "Item Description"}
                  </h2>
                  <div className="border rounded-md p-4 bg-gray-50">
                    <ReactQuill
                      value={auction.description || "No description available."}
                      readOnly={true}
                      theme="bubble"
                    />
                  </div>
                </div>

                {/* Number Plate Documents */}
                {isNumberplateAuction &&
                  auction.numberPlate?.document_urls &&
                  auction.numberPlate.document_urls.length > 0 && (
                    <div className="mt-6">
                      <h2 className="text-xl font-bold mb-4 flex items-center">
                        <FileText size={20} className="mr-2" />
                        Documents
                      </h2>
                      <div className="border rounded-md p-4 bg-gray-50">
                        {auction.numberPlate.document_urls.map(
                          (url: string, index: number) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 bg-white rounded border mb-2"
                            >
                              <div className="flex items-center">
                                <FileText
                                  size={20}
                                  className="mr-3 text-blue-600"
                                />
                                <span>Document {index + 1}</span>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(url, "_blank")}
                              >
                                View
                              </Button>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
              </div>

              {/* Right column - Item details & Bid history */}
              <div className="lg:col-span-1 space-y-6">
                {/* Item details card */}
                <div className="bg-gray-50 border rounded-lg p-5 shadow-sm">
                  <h2 className="text-xl font-bold mb-4 border-b pb-2">
                    {isVehicleAuction
                      ? "Vehicle Details"
                      : isNumberplateAuction
                      ? "Number Plate Details"
                      : "Item Details"}
                  </h2>

                  <div className="space-y-3">
                    {isVehicleAuction && auction.vehicle && (
                      <>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-gray-700">
                            <Tag size={18} className="mr-2" />
                            <span>Make</span>
                          </div>
                          <span className="font-medium">
                            {formatString(auction.vehicle.make) || "N/A"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-gray-700">
                            <Tag size={18} className="mr-2" />
                            <span>Model</span>
                          </div>
                          <span className="font-medium">
                            {formatString(auction.vehicle.model) || "N/A"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-gray-700">
                            <Calendar size={18} className="mr-2" />
                            <span>Year</span>
                          </div>
                          <span className="font-medium">
                            {auction.vehicle.year || "N/A"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-gray-700">
                            <Gauge size={18} className="mr-2" />
                            <span>Mileage</span>
                          </div>
                          <span className="font-medium">
                            {auction.vehicle.mileage || "N/A"} km
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-gray-700">
                            <Palette size={18} className="mr-2" />
                            <span>Color</span>
                          </div>
                          <span className="font-medium">
                            {formatString(auction.vehicle.color) || "N/A"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-gray-700">
                            <DoorOpen size={16} className="mr-2" />
                            <span>Doors</span>
                          </div>
                          <span className="font-medium">
                            {auction.vehicle.others?.number_doors ?? "N/A"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-gray-700">
                            <Armchair size={16} className="mr-2" />
                            <span>Seats</span>
                          </div>
                          <span className="font-medium">
                            {auction.vehicle.others?.number_seats ?? "N/A"}
                          </span>
                        </div>
                        <Separator className="my-6" />

                        {/* Vehicle specifications */}

                        <div className="">
                          {/* Card 2: Engine & Performance */}
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <h2 className="text-lg font-semibold mb-4 flex items-center">
                              <Cog size={18} className="mr-2" /> Engine &
                              Performance
                            </h2>
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="flex items-center text-gray-700">
                                  <Cog size={16} className="mr-2" /> Engine
                                </span>
                                <span className="font-medium">
                                  {auction.vehicle.engine?.capacity
                                    ? `${auction.vehicle.engine.capacity.toFixed(
                                        1
                                      )}L`
                                    : "N/A"}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="flex items-center text-gray-700">
                                  <GitCommitHorizontal
                                    size={16}
                                    className="mr-2"
                                  />{" "}
                                  Drive Train
                                </span>
                                <span className="font-medium">
                                  {formatString(auction.vehicle.drive_train)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="flex items-center text-gray-700">
                                  <Wind size={16} className="mr-2" /> CO₂
                                  Emission
                                </span>
                                <span className="font-medium">
                                  {auction.vehicle.engine?.co2_emission
                                    ? `${auction.vehicle.engine.co2_emission} g/km`
                                    : "N/A"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {isNumberplateAuction && auction.numberPlate && (
                      <>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-gray-700">
                            <Hash size={18} className="mr-2" />
                            <span>Plate Number</span>
                          </div>
                          <span className="font-medium">
                            {auction.numberPlate.plate_number || "N/A"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-gray-700">
                            <DollarSign size={18} className="mr-2" />
                            <span>Plate Value</span>
                          </div>
                          <span className="font-medium">
                            {auction.numberPlate.plate_value ||
                              auction.startingPrice ||
                              "N/A"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-gray-700">
                            <FileText size={18} className="mr-2" />
                            <span>Documents</span>
                          </div>
                          <span className="font-medium">
                            {auction.numberPlate.document_urls?.length || 0}{" "}
                            file(s)
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  <Button
                    variant="destructive"
                    className="mt-4 w-full"
                    size="lg"
                    onClick={() => setReportOpen(true)}
                  >
                    <Info className="h-4 w-4 mr-2" />
                    Report Auction
                  </Button>
                </div>

                {/* Bid history card */}
                <div
                  className={`bg-gray-50 border rounded-lg p-5 shadow-sm transition-all duration-500 ${
                    bidPlacedEffect
                      ? "border-green-400 shadow-lg bg-green-50"
                      : ""
                  }`}
                >
                  <h2 className="text-xl font-bold mb-4 border-b pb-2 flex items-center">
                    <Users size={20} className="mr-2" />
                    Bid History
                    {bidPlacedEffect && (
                      <span className="ml-2 text-sm bg-green-500 text-white px-2 py-1 rounded-full animate-pulse">
                        NEW BID!
                      </span>
                    )}
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
                            <tr
                              key={bid.id || idx}
                              className={`border-t transition-all duration-1000 ${
                                bid.id === newBidId
                                  ? "bg-gradient-to-r from-green-100 to-blue-100 animate-pulse transform scale-105 shadow-md"
                                  : "hover:bg-gray-50"
                              }`}
                            >
                              <td className="py-2 font-medium">
                                {bid.user.username}
                                {bid.id === newBidId && (
                                  <span className="ml-2 text-xs bg-green-500 text-white px-1 py-0.5 rounded">
                                    NEW
                                  </span>
                                )}
                              </td>
                              <td
                                className={`py-2 ${
                                  bid.id === newBidId
                                    ? "font-bold text-green-600"
                                    : ""
                                }`}
                              >
                                {bid.bidAmount}
                              </td>
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

      <Dialog open={paymentformOpen} onOpenChange={setPaymentformOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Pay the fee</DialogTitle>
            <DialogDescription>
              {paymentInfo.timeout && (
                <h1>Payment Expires in {paymentInfo.timeout}</h1>
              )}
              {paymentInfo.chargedAmount && (
                <h1>
                  Amount of {paymentInfo.chargedAmount}{" "}
                  {paymentInfo.chargedAmount} would be deducted
                </h1>
              )}
            </DialogDescription>
          </DialogHeader>
          <PaymentFormWrapper
            verifyPayment={verifyBidPayment}
            clientSecret={paymentInfo.clientSecret}
          />
        </DialogContent>
      </Dialog>

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
                {isVehicleAuction && auction.vehicle?.images?.[0] ? (
                  <img
                    src={auction.vehicle.images[0]}
                    alt="Vehicle"
                    className="w-full aspect-video object-cover"
                  />
                ) : isNumberplateAuction ? (
                  <div className="w-full aspect-video bg-gradient-to-br from-blue-50 to-blue-100 flex flex-col items-center justify-center border-2 border-dashed border-blue-300">
                    <Hash size={32} className="text-blue-600 mb-2" />
                    <div className="text-xl font-bold text-blue-900">
                      {auction.numberPlate?.plate_number}
                    </div>
                  </div>
                ) : (
                  <div className="w-full aspect-video bg-gray-200 flex items-center justify-center">
                    <span>No image available</span>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 p-4 rounded-md space-y-3">
                <div className="flex items-center">
                  <DollarSign size={18} className="mr-2 text-gray-600" />
                  <span className="font-semibold">Current Bid:</span>
                  <span className="ml-2">{currentBid}</span>
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
                  placeholder={`Min bid: ${currentBid}`}
                  value={bidAmount}
                  onChange={handleBidInput}
                />
                {bidError && (
                  <div className="text-red-500 text-xs mt-1">{bidError}</div>
                )}

                <Button
                  className="mt-4 w-full bg-blue-600 hover:bg-blue-700"
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
                        <tr
                          key={bid.id || idx}
                          className={`border-t transition-all duration-1000 ${
                            bid.id === newBidId
                              ? "bg-gradient-to-r from-green-100 to-blue-100 animate-pulse hover:bg-green-50"
                              : "hover:bg-gray-50"
                          }`}
                        >
                          <td className="py-3 px-4">
                            {bid.user.username}
                            {bid.id === newBidId && (
                              <span className="ml-2 text-xs bg-green-500 text-white px-1 py-0.5 rounded animate-bounce">
                                NEW
                              </span>
                            )}
                          </td>
                          <td
                            className={`py-3 px-4 font-medium ${
                              bid.id === newBidId
                                ? "font-bold text-green-600"
                                : ""
                            }`}
                          >
                            {bid.bidAmount}
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

      <ReportDialog
        isOpen={reportOpen}
        onOpenChange={setReportOpen}
        type="auction"
        targetId={id}
      />
    </div>
  );
}
