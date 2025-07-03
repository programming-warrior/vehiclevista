import LiveAuctionSection from "@/components/live-auction-section";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

export default function AuctionPage() {
  const params = new URLSearchParams(window.location.search);
  const itemType = params.get("itemType") || "";
  const vehicleAuctionType = params.get("vehicleAuctionType") || "";

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Live Auctions</h1>

        <LiveAuctionSection
          itemType={itemType || "VEHICLE"}
          vehicleAuctionType={vehicleAuctionType || "car"}
        />
      </div>
    </div>
  );
}
