import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import VehicleCard from "@/components/vehicle-card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { categories } from "@/lib/mock-data";
import type { Vehicle } from "@shared/schema";
import HeroSection from "@/components/hero-section";
import LiveAuctionSection from "@/components/live-auction-section";
import ExploreCategories from "@/components/explore-categories";
import SuperAdSection from "@/components/super-ad-section";
import SearchMakes from "@/components/search-makes";
import SelectedPartsSection from "@/components/selected-parts-section";

export default function Home() {
  const [activeCategory, setActiveCategory] = useState("all");

  const { data: vehicles, isLoading } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles", activeCategory],
  });

  return (
    <div>
      <HeroSection />

      {/* Featured Vehicles Section */}
      <div className="container mx-auto px-4 py-12">
        <header className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Featured Vehicles</h2>
          <p className="text-lg text-muted-foreground">
            Browse our extensive collection of quality vehicles
          </p>
        </header>

        <Tabs
          value={activeCategory}
          onValueChange={setActiveCategory}
          className="mb-8"
        >
          <TabsList className="w-full justify-start overflow-auto">
            {categories.map((category) => (
              <TabsTrigger
                key={category.id}
                value={category.id}
                className="min-w-[100px]"
              >
                {category.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-[400px] rounded-lg bg-muted animate-pulse"
              />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vehicles?.map((vehicle) => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} />
              ))}
            </div>

            <div className="mt-8 text-center">
              <Button size="lg">Load More Vehicles</Button>
            </div>
          </>
        )}
      </div>

      {/* Live Auction Section */}
      <LiveAuctionSection />

      {/* Explore Categories Section */}
      <ExploreCategories />

      {/* Super Ad Section */}
      <SuperAdSection />

      {/* Search Makes Section */}
      <SearchMakes />

      {/* Selected Parts Section */}
      <SelectedPartsSection />
    </div>
  );
}