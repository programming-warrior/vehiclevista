import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function QualityBikesSection() {
  return (
    <section className="py-12 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          <div className="max-w-xl">
            <h2 className="text-5xl font-bold mb-4" style={{ 
              fontFamily: "ClashDisplay-Variable, sans-serif",
              lineHeight: "1.2"
            }}>
              Quality Bikes.
              <br />
              Built For Every Journey.
            </h2>
            <p className="text-gray-600 text-lg mb-8">
              Explore Rare And Collectible Fine Bikes, With New Listings Added Daily.
            </p>
            <div className="flex gap-4">
              <Link href="/auction">
                <Button 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8"
                  size="lg"
                >
                  Live Auction
                </Button>
              </Link>
              <Link href="/bikes">
                <Button 
                  variant="outline"
                  className="border-2 px-8"
                  size="lg"
                >
                  View All Bikes
                </Button>
              </Link>
            </div>
          </div>
          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?auto=format&fit=crop&w=800"
              alt="Sport Motorcycle"
              className="w-[600px] h-auto object-contain"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
