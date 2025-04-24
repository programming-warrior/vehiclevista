import React, { useEffect, useState, useRef } from "react";
import { useParams } from "wouter";
import {
  Heart,
  Mail,
  Phone,
  MapPin,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { getAuctionById } from "@/api";
import ImageGallery from "@/components/image-gallery";
import { Button } from "@/components/ui/button";
import CountdownTimer from "@/components/countdown-timer";

export default function AuctionIdPage() {
  const { id } = useParams<{ id: string }>();
  const [auction, setAuction] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAuction = async () => {
      setLoading(true);
      try {
        const response = await getAuctionById(id as string);
        setAuction(response);
      } catch (error) {
        console.error("Error fetching auction:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAuction();
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto p-8 text-center">
        Loading vehicle details...
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="container mx-auto p-8 text-center">Auction not found</div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      {!auction ? (
        <div className="text-center py-16">Auction not found</div>
      ) : (
        <div>
          <nav className="px-8 mb-8 flex items-center justify-between gap-8 lg:gap-16">
            <div className="flex items-center justify-between w-full ">
              <div className="flex flex-col">
                <span className="text-3xl font-bold">$ 2000</span>
                <span className="text-sm  text-gray-600 uppercase">
                  current bid
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-3xl">
                  <CountdownTimer auction={auction} setAuction={setAuction} />
                </span>
                <span className="text-sm  text-gray-600 uppercase">
                  time left
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-3xl ">40</span>
                <span className="text-sm  text-gray-600 uppercase">bids</span>
              </div>
            </div>
            <div className="w-full flex justify-end">
              <Button className=" py-6  w-full rounded-none bg-blue-500 hover:bg-blue-800">
                Place Bid
              </Button>
            </div>
          </nav>
          {/* <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              {auction.vehicle?.make} {auction.vehicle?.model} {auction.vehicle?.year}
            </h1>
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin size={16} />
              <span>{auction.location || "Location not specified"}</span>
            </div>
          </div> */}

          {auction.vehicle?.images && auction.vehicle.images.length > 0 ? (
            <ImageGallery images={auction.vehicle.images} />
          ) : (
            <div className="aspect-[4/3] bg-gray-200 flex items-center justify-center rounded-md mb-6">
              <p>No images available</p>
            </div>
          )}

          <div className="mt-16 flex flex-row gap-8 justify-between">
            <div>
              <div className="flex flex-col gap-3">
                <h2 className="text-4xl font-bold">{auction.title}</h2>
                <p className="text-lg">{auction.description}</p>
              </div>
            </div>
            <div>
              <div className="min-w-[300px] max-w-[400px] flex flex-col gap-4 bg-gray-100 px-6 py-6 rounded-sm">
                <h2 className="text-xl font-bold">Vehicle Overview</h2>
                <div className="text-base">
                  <div className="flex flex-row gap-2 items-center">
                    <span className="text-gray-600">Make:</span>
                    <span>{auction.vehicle?.make}</span>
                  </div>
                  <div className="flex flex-row gap-2 items-center">
                    <span className="text-gray-600">Model:</span>
                    <span>{auction.vehicle?.model}</span>
                  </div>
                  <div className="flex flex-row gap-2 items-center">
                    <span className="text-gray-600">Year:</span>
                    <span>{auction.vehicle?.year}</span>
                  </div>
                  <div className="flex flex-row gap-2 items-center">
                    <span className="text-gray-600">Mileage:</span>
                    <span>{auction.vehicle?.mileage} km</span>
                  </div>
                  <div className="flex flex-row gap-2 items-center">
                    <span className="text-gray-600">color:</span>
                    <span>{auction.vehicle?.color}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
