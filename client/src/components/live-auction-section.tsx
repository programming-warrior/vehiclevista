import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Gauge, Fuel, Settings } from "lucide-react";
import { Link } from "wouter";
import type { Vehicle } from "@shared/schema";

export default function LiveAuctionSection() {
  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold">Live Auction</h2>
          <Link href="/auction" className="text-sm text-gray-500">View All</Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Example auction items - replace with real data */}
          {[
            {
              id: 1,
              title: "Ford Transit - 2021",
              description: "4.0 D5 PowerPulse Momentum 5dr AW...",
              price: 22000,
              mileage: 2500,
              fuelType: "Diesel",
              transmission: "Manual",
              condition: "catS",
              timeLeft: "09:09:24:52"
            },
            {
              id: 2,
              title: "New GLC - 2023",
              description: "4.0 D5 PowerPulse Momentum 5dr AW...",
              price: 95000,
              mileage: 50,
              fuelType: "Petrol",
              transmission: "Automatic",
              condition: "catA",
              timeLeft: "00:02:51:28"
            }
          ].map((vehicle) => (
            <Card key={vehicle.id} className="group hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <AspectRatio ratio={16/9} className="relative">
                  <img 
                    src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=800"
                    alt={vehicle.title}
                    className="object-cover w-full h-full rounded-t-lg"
                  />
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-red-100 text-red-800 border-none font-medium px-3 py-1">
                      Cat S
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-3 right-3 bg-white/80 hover:bg-white rounded-md"
                  >
                    <span className="sr-only">Save to favorites</span>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                    </svg>
                  </Button>

                  {/* Countdown Timer */}
                  <div className="absolute bottom-3 right-3">
                    <div className="bg-white shadow-md rounded-lg px-3 py-1">
                      <div className="font-mono text-sm font-medium text-gray-900">
                        {vehicle.timeLeft.split(':').map((unit, i) => (
                          <span key={i} className="inline-block">
                            {unit}
                            {i < 3 && <span className="mx-1">:</span>}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </AspectRatio>

                {/* Vehicle Details */}
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-2">
                    {vehicle.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {vehicle.description}
                  </p>

                  {/* Vehicle Specifications */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <Gauge className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{vehicle.mileage} Miles</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Fuel className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{vehicle.fuelType}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{vehicle.transmission}</span>
                    </div>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="px-4 pb-4 pt-2">
                <div className="w-full flex justify-between items-center">
                  <span className="text-xl font-bold">${vehicle.price.toLocaleString()}</span>
                  <Link href={`/auction/${vehicle.id}`}>
                    <Button className="text-blue-600 hover:text-blue-700 font-medium">
                      Auction →
                    </Button>
                  </Link>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}