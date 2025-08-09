import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Gauge, Fuel, Settings, Heart } from "lucide-react";
import { Link } from "wouter";
import type { Vehicle } from "@shared/schema";
import { addOrRemoveVehicleToFavouriteApi, incrementVehicleClicks,  } from "@/api";
import { useFavouriteListings } from "@/hooks/use-store";

const conditionColors = {
  clean: "bg-green-100 text-green-800",
  catS: "bg-red-100 text-red-800",
  catA: "bg-yellow-100 text-yellow-800",
  catN: "bg-orange-100 text-orange-800",
} as const;

const conditionLabels = {
  clean: "Clean",
  catS: "Cat S",
  catA: "Cat A",
  catN: "Cat N",
} as const;

export default function VehicleCard({
  vehicle,
  className = "",
}: {
vehicle: Vehicle;
  className?: string;
}) {
  
  const VehicleCardRef = useRef<HTMLDivElement>(null);
  const {vehicles, addVehicleToFavourite, removeVehicleFromFavourite} = useFavouriteListings();
  console.log("vehicleId: ", vehicle.id)
  console.log(vehicles)
  const isFavorite= vehicles.find((v:any)=>vehicle.id==v.id) ? true : false;
  console.log(isFavorite)

  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    if(isFavorite) removeVehicleFromFavourite(vehicle.id)
    else addVehicleToFavourite(vehicle)
    //send an api request to store it in the db
    addOrRemoveVehicleToFavouriteApi(vehicle.id, !isFavorite).catch((e:any)=>console.error(e));
  };

  useEffect(() => {
    const handleClick = async () => {
      try {
        await incrementVehicleClicks(vehicle.id.toString());
      } catch (error) {
        console.error("Error incrementing vehicle clicks:", error);
      }
    };

    if (!VehicleCardRef.current) return;

    VehicleCardRef.current.addEventListener("click", handleClick);
    return () => {
      VehicleCardRef.current?.removeEventListener("click", handleClick);
    };
  }, [VehicleCardRef]);

  return (
    <Card
      ref={VehicleCardRef}
      className={`overflow-hidden group hover:shadow-lg transition-all duration-300 ${className}`}
    >
      <Link href={`/vehicle/${vehicle.id}`}>
        <div className="relative w-full aspect-video">
          <img
            src={vehicle.images[0]}
            alt={vehicle.title}
            className="object-cover w-full h-full absolute inset-0 group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute top-3 left-3">
            <Badge
              className={`${
                conditionColors[
                  vehicle.condition as keyof typeof conditionColors
                ]
              } border-none font-bold px-3 py-1 shadow-md`}
            >
              {
                conditionLabels[
                  vehicle.condition as keyof typeof conditionLabels
                ]
              }
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 bg-white/90 hover:bg-white rounded-full shadow-md"
            onClick={toggleFavorite}
          >
            <span className="sr-only">Save to favorites</span>
            <Heart
              className={`w-5 h-5 ${
                isFavorite ? "fill-red-500 text-red-500" : "text-gray-700"
              }`}
            />
          </Button>

          <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/70 to-transparent p-4">
            <p className="text-white font-bold text-xl drop-shadow-md">
              ${vehicle.price.toLocaleString()}
            </p>
          </div>
        </div>

        <CardContent className="p-4">
          <h3 className="text-lg font-bold mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors">
            {vehicle.title}
          </h3>
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {vehicle.description}
          </p>

          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col items-center p-2 bg-gray-50 rounded-lg">
              <Gauge className="h-5 w-5 text-gray-700 mb-1" />
              <span className="text-xs font-medium text-center">
                {vehicle.mileage.toLocaleString()} mi
              </span>
            </div>
            <div className="flex flex-col items-center p-2 bg-gray-50 rounded-lg">
              <Fuel className="h-5 w-5 text-gray-700 mb-1" />
              <span className="text-xs font-medium text-center">
                {vehicle.fuelType}
              </span>
            </div>
            <div className="flex flex-col items-center p-2 bg-gray-50 rounded-lg">
              <Settings className="h-5 w-5 text-gray-700 mb-1" />
              <span className="text-xs font-medium text-center">
                {vehicle.transmission}
              </span>
            </div>
          </div>
        </CardContent>
      </Link>

      <CardFooter className="px-4 pb-4 pt-0">
        <Link href={`/vehicle/${vehicle.id}`} className="w-full">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white w-full group relative overflow-hidden">
            <span className="relative z-10 flex items-center justify-center gap-2 group-hover:gap-3 transition-all duration-300">
              View Details
              <span className="text-lg">→</span>
            </span>
            <span className="absolute inset-0 w-0 bg-blue-800 transition-all duration-300 group-hover:w-full"></span>
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
