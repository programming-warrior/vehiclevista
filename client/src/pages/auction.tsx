import LiveAuctionSection from "@/components/live-auction-section";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

export default function AuctionPage() {
  const { data: auctions, isLoading } = useQuery({
    queryKey: ["/api/auctions"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Live Auctions</h1>
        <LiveAuctionSection />
      </div>
    </div>
  );
}