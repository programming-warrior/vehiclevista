import { useEffect, useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gauge, Fuel, Settings, Calendar, Clock, Bookmark } from "lucide-react";
import { Link } from "wouter";
import CountdownTimer from "@/components/countdown-timer";
import { useFavouriteListings } from "@/hooks/use-store";
import { addOrRemoveAuctionToFavouriteApi } from "@/api";

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
  startingPrice?: number;
  currentBid: number;
  endDate: string;
  status: string;
  vehicle?: Vehicle;
  numberPlate?: NumberPlate;
  remainingTime?: number;
};

type AuctionCardProps = {
  auction: Auction;
  idx: number;
  setAuctions?: React.Dispatch<React.SetStateAction<Auction[]>>;
};

const AuctionCard = ({ auction, idx, setAuctions }: AuctionCardProps) => {
  const { auctions, addAuctionToFavourite, removeAuctionFromFavourite } =
    useFavouriteListings();
  const isFavorite = auctions.find((a: any) => a.id == auction.id)
    ? true
    : false;

  const toggleSaveAuction = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isFavorite) {
      addAuctionToFavourite(auction);
    } else {
      removeAuctionFromFavourite(auction.id);
    }
    addOrRemoveAuctionToFavouriteApi(auction.id,!isFavorite).catch(e=>console.error(e))
  };
  return (
    <Card className="group relative overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="relative aspect-[4/3]">
        {auction.vehicle &&
          auction.vehicle.images &&
          auction.vehicle.images.length > 0 && (
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
          onClick={(e) => toggleSaveAuction(e)}
          className="absolute top-2 right-2 bg-white/80 hover:bg-white rounded-md"
        >
          <Bookmark className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
        </Button>

        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-center py-2 px-4">
          <CountdownTimer
            auction={auction}
            // setAuction={ (updater: any) =>
            //   // setAuctions((prev) =>
            //   //   prev.map((a, i) =>
            //   //     i === idx
            //   //       ? typeof updater === "function"
            //   //         ? updater(a)
            //   //         : updater
            //   //       : a
            //   //   )
            //   // )
            // }
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
              <span>{auction.vehicle.mileage.toLocaleString()} mi</span>
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
            
            { 
              auction.currentBid.toLocaleString()
              }
          </span>
          <span className="text-blue-600 hover:text-blue-700">Auction →</span>
        </div>
      </div>
    </Card>
  );
};

export default AuctionCard;
