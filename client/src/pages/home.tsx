import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import VehicleCard from "@/components/vehicle-card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { vehicleTypes } from "@shared/schema";
import type { Vehicle } from "@shared/schema";
import HeroSection from "@/components/hero-section";
import LiveAuctionSection from "@/components/live-auction-section";
import ExploreCategories from "@/components/explore-categories";
import SearchMakes from "@/components/search-makes";
import QualityBikesSection from "@/components/quality-bikes-section";
import BikesCollection from "@/components/bikes-collection";
import VansCollection from "@/components/vans-collection";
import { getFeaturedVehicles, getFavouriteVehicles } from "@/api";
import { useUser } from "@/hooks/use-store";
import Navbar from "@/components/navbar";
import { ChevronRight } from "lucide-react";
import { Link } from "wouter";
import RaffleHomeSection from "@/components/raffle-home-section";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";
import { useGlobalLoading, useFavouriteListings } from "@/hooks/use-store";
import Loader from "@/components/loader";

export default function Home() {
  const [activeCategory, setActiveCategory] = useState("Car");
  const { userId, role } = useUser();
  const [featuredVehicles, setFeaturedVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [_, setLocation] = useLocation();
  const { globalLoading, setGlobalLoading } = useGlobalLoading();
  const {vehicles,addVehicleToFavourite} = useFavouriteListings();

  useEffect(() => {
    async function fetch() {
      try {
        setLoading(true);
        const data = await getFeaturedVehicles(`name=${activeCategory}`);
        setFeaturedVehicles(data.featuredVehicles);
      } catch (err) {
        console.error("Error fetching featured vehicles:", err);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [activeCategory]);

  useEffect(() => {
    async function fetch() {
      try {
        const data = await getFavouriteVehicles();
        console.log(data);
        data.favourites?.forEach((fv:any)=> addVehicleToFavourite(fv));
      } catch (err) {
        console.error("Error fetching featured vehicles:", err);
      }
    }
    fetch();
  }, []);

  console.log(vehicles);

  console.log(userId);
  console.log(role);

  const vehicleCategories = vehicleTypes.map((type) =>
    type
      .split("")
      .map((char, index) => {
        if (index === 0) {
          return char.toUpperCase();
        }
        return char;
      })
      .join("")
  );

  if (globalLoading) {
    return <Loader />;
  }

  return (
    <div className="flex flex-col gap-8">
      <HeroSection />

      <div className="px-12 mx-auto w-full">
        <RaffleHomeSection />
      </div>

      {/* Featured Vehicles Section */}
      <section className="px-12  mx-auto w-full">
        <header className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Featured Vehicles</h2>
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
            {vehicleCategories.map((category: string) =>
              category.toLocaleLowerCase() == "all" ? (
                ""
              ) : (
                <TabsTrigger
                  key={category}
                  value={category}
                  className="min-w-[100px]"
                >
                  <span className="text-sm font-medium text-muted-foreground">
                    {category}
                  </span>
                </TabsTrigger>
              )
            )}
          </TabsList>
        </Tabs>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton className="w-60 h-56 flex flex-col ">
                <Skeleton className="ml-3 mt-3 w-44 h-20 bg-gray-300"></Skeleton>
                <div>
                  <Skeleton className="ml-3 mt-3 w-40 h-4 bg-gray-300"></Skeleton>
                  <Skeleton className="ml-3 mt-3 w-44 h-4 bg-gray-300"></Skeleton>
                </div>
              </Skeleton>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredVehicles?.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <p className="text-lg text-muted-foreground">
                    No featured vehicles found
                  </p>
                </div>
              ) : (
                featuredVehicles
                  ?.slice(0, 4)
                  .map((vehicle) => (
                    <VehicleCard key={vehicle.id} vehicle={vehicle} />
                  ))
              )}
            </div>

            <div className="mt-4 text-center">
              <Button
                size="lg"
                variant="outline"
                className="text-center border-blue-200 bg-white  font-normal "
                onClick={() => setLocation("/vehicle")}
              >
                View More <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </>
        )}
      </section>

      {/* Live Auction Section */}
      <section className="px-12 mx-auto w-full" id="live-auctions">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold">Live Auctions</h2>
          <Link
            href="/auction"
            className="text-sm bg-gray-100 px-4 py-1 rounded-full hover:bg-gray-200"
          >
            View All
          </Link>
        </div>
        <LiveAuctionSection itemType="VEHICLE" auctionVehicleType="" />
      </section>

      {/* Live Auction Section */}
      <section className="px-12 mx-auto w-full">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold">NumerPlate Auctions</h2>
          <Link
            href="/auction"
            className="text-sm bg-gray-100 px-4 py-1 rounded-full hover:bg-gray-200"
          >
            View All
          </Link>
        </div>
        <LiveAuctionSection itemType="NUMBERPLATE" />
      </section>

      {/* Explore Categories Section */}
      {/* <section className="  mx-auto w-full">
        <ExploreCategories />
      </section> */}

      {/* Search Makes Section */}
      <section className=" mx-auto w-full">
        <SearchMakes />
      </section>

      {/* Quality Bikes Section */}
      <section className=" mx-auto w-full">
        <QualityBikesSection />
      </section>

      {/* Bikes Collection Section */}
      <section className="px-4 md:px-8 lg:px-12  mx-auto w-full">
        {/* <BikesCollection /> */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold">Bikes Collection</h2>
          <Link
            href="/auction?itemType=VEHICLE&vehicleAuctionType=bike"
            className="text-sm bg-gray-100 px-4 py-1 rounded-full hover:bg-gray-200"
          >
            View All
          </Link>
        </div>
        <LiveAuctionSection vehicleAuctionType="bike" itemType="VEHICLE" />
      </section>

      {/* Vans Collection Section */}
      <section className="px-4 md:px-8 lg:px-12  mx-auto w-full">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold">Vans Collection</h2>
          <Link
            href="/auction?itemType=VEHICLE&vehicleAuctionType=van"
            className="text-sm bg-gray-100 px-4 py-1 rounded-full hover:bg-gray-200"
          >
            View All
          </Link>
        </div>
        <LiveAuctionSection auctionVehicleType="van" itemType="VEHICLE" />
      </section>
    </div>
  );
}
