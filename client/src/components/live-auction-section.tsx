import { useEffect, useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Gauge, Fuel, Settings, Calendar, Clock, Bookmark } from "lucide-react";
import { Link } from "wouter";
import { useWebSocket } from "@/hooks/use-store";
import { getActiveAuctions } from "@/api";
import CountdownTimer from "@/components/countdown-timer";

type Vehicle = {
  id: string | number;
  make: string;
  model: string;
  year: number;
  color: string;
  registration_num: string;
  bodyType: string;
  mileage: number;
  fuelType: string;
  transmission: string;
  price: number;
  images: string[];
};

type NumberPlate = {
  id: string | number;
  document_urls: string[];
  plate_number: string;
  plate_value: number;
};

type Auction = {
  id: string | number;
  title: string;
  description: string;
  startingPrice: number;
  currentBid: number;
  endTime: string;
  status: string;
  vehicle?: Vehicle;
  numberPlate?: NumberPlate;
  remainingTime?: number;
};

type AuctionResponse = {
  auctions: Auction[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
};

export default function LiveAuctionSection({
  itemType = "",
  auctionVehicleType = "",
}: any) {
  const { socket } = useWebSocket();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedAuctions, setSavedAuctions] = useState<Set<string | number>>(
    new Set()
  );

  useEffect(() => {
    const fetchAuctions = async () => {
      try {
        setLoading(true);
        const data: AuctionResponse = await getActiveAuctions(
          `itemType=${itemType}&type=${auctionVehicleType}`
        );

        setAuctions(data.auctions);

        // Only attempt to subscribe if socket is open
        if (socket && socket.readyState === WebSocket.OPEN) {
          // data.auctions.forEach((auction) => {
          //   console.log("sending message to the websocket server");
          //   socket.send(
          //     JSON.stringify({
          //       type: "subscribe",
          //       payload: {
          //         auctionId: auction.id,
          //       },
          //     })
          //   );
          // });
        } else {
          console.warn("WebSocket not open, using client-side timers");
        }
      } catch (err) {
        setError("Failed to load auctions");
        console.error("Failed to load auctions:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAuctions();

    // Handle WebSocket messages
    const handleWebSocketMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);

        if (data.event === "AUCTION_TIMER") {
          // Update the specific auction with the new remaining time
          setAuctions((prevAuctions) =>
            prevAuctions.map((auction) =>
              auction.id.toString() === data.message.auctionId
                ? { ...auction, remainingTime: data.message.remainingTime }
                : auction
            )
          );
        }
      } catch (err) {
        console.error("Error processing WebSocket message:", err);
      }
    };

    // if (socket) {
    //   socket.addEventListener("message", handleWebSocketMessage);
    // }

    return () => {
      // Cleanup: unsubscribe from auctions
      // if (socket && socket.readyState === WebSocket.OPEN) {
      //   auctions.forEach((auction) => {
      //     socket.send(
      //       JSON.stringify({
      //         type: "unsubscribe",
      //         payload: auction.id,
      //       })
      //     );
      //   });
      // }
      // if (socket) {
      //   socket.removeEventListener("message", handleWebSocketMessage);
      // }
    };
  }, [socket]); // Re-run effect if socket changes

  const toggleSaveAuction = (
    e: React.MouseEvent,
    auctionId: string | number
  ) => {
    e.preventDefault();
    e.stopPropagation();

    setSavedAuctions((prev) => {
      const newSaved = new Set(prev);
      if (newSaved.has(auctionId)) {
        newSaved.delete(auctionId);
      } else {
        newSaved.add(auctionId);
      }
      return newSaved;
    });
  };

  if (loading) {
    return <div className="text-center py-8">Loading auctions...</div>;
  }

  // if (error) {
  //   return <div className="text-center py-8 text-red-500">{error}</div>;
  // }

  if (auctions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        No active auctions at the moment.
      </div>
    );
  }

  return (
    <section className="">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {auctions.map((auction, idx) => (
            <Link key={auction.id} href={`/auction/${auction.id}`}>
              <Card className="group relative overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <div className="relative aspect-[4/3]">
                  {auction.vehicle &&
                  auction.vehicle.images &&
                  auction.vehicle.images.length > 0  && (
                    <img
                      src={auction.vehicle.images[0]}
                      alt={`${auction.vehicle.make} ${auction.vehicle.model}`}
                      className="object-cover w-full h-full"
                    />
                  )}

                  {auction.numberPlate && auction.numberPlate.plate_number && (
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
                  )}

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => toggleSaveAuction(e, auction.id)}
                    className="absolute top-2 right-2 bg-white/80 hover:bg-white rounded-md"
                  >
                    <Bookmark
                      className={`h-4 w-4 ${
                        savedAuctions.has(auction.id) ? "fill-current" : ""
                      }`}
                    />
                  </Button>

                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-center py-2 px-4">
                    <CountdownTimer
                      auction={auction}
                      setAuction={(updater: any) =>
                        setAuctions((prev) =>
                          prev.map((a, i) =>
                            i === idx
                              ? typeof updater === "function"
                                ? updater(a)
                                : updater
                              : a
                          )
                        )
                      }
                    />
                  </div>
                </div>

                <div className="p-4">
                  {auction.vehicle && (
                    <h3 className="font-medium text-lg mb-1">
                      {auction.vehicle.make} {auction.vehicle.model}
                    </h3>
                  )}

                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                    {auction.description}
                  </p>

                  {auction.vehicle && (
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Calendar size={16} />
                        <span>{auction.vehicle.year}</span>
                      </div>

                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Gauge size={16} />
                        <span>
                          {auction.vehicle.mileage.toLocaleString()} mi
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Fuel size={16} />
                        <span>{auction.vehicle.fuelType}</span>
                      </div>

                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Settings size={16} />
                        <span>{auction.vehicle.transmission}</span>
                      </div>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold">
                      $
                      {auction.currentBid
                        ? auction.currentBid.toLocaleString()
                        : auction.startingPrice.toLocaleString()}
                    </span>
                    <span className="text-blue-600 hover:text-blue-700">
                      Auction →
                    </span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
