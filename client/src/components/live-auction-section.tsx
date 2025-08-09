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
import AuctionCard from "./auction-card";

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
  vehicleAuctionType = "",
}: any) {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAuctions = async () => {
      try {
        setLoading(true);
        const data: AuctionResponse = await getActiveAuctions(
          `itemType=${itemType}&type=${vehicleAuctionType}`
        );
        setAuctions(data.auctions);
      } catch (err) {
        setError("Failed to load auctions");
        console.error("Failed to load auctions:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAuctions();
  }, []);

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
              <AuctionCard
                auction={auction}
                idx={idx}
                setAuctions={setAuctions}
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
