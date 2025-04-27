import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Bookmark } from "lucide-react";
import { useState, useEffect } from "react";

type VanModel = {
  id: string;
  image: string;
  name: string;
  specs: string;
  mileage: number;
  fuelType: string;
  transmission: string;
  price: number;
  endTime: Date;
};

const vans: VanModel[] = [
  {
    id: "1",
    image: "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=800",
    name: "Ford Transit – 2021",
    specs: "4.0 D5 PowerPulse Momentum 5dr AWD",
    mileage: 2500,
    fuelType: "Diesel",
    transmission: "Manual",
    price: 22000,
    endTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
  },
  {
    id: "2",
    image: "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=800",
    name: "New GLC – 2023",
    specs: "4.0 D5 PowerPulse Momentum 5dr AWD",
    mileage: 50,
    fuelType: "Petrol",
    transmission: "Automatic",
    price: 95000,
    endTime: new Date(Date.now() + 48 * 60 * 60 * 1000),
  },
  {
    id: "3",
    image: "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=800",
    name: "Audi A6 3.5 – New",
    specs: "3.5 D5 PowerPulse Momentum 5dr AWD",
    mileage: 100,
    fuelType: "Petrol",
    transmission: "Automatic",
    price: 58000,
    endTime: new Date(Date.now() + 12 * 60 * 60 * 1000),
  },
  {
    id: "4",
    image: "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=800",
    name: "Corolla Altis – 2023",
    specs: "3.5 D5 PowerPulse Momentum 5dr AW",
    mileage: 15000,
    fuelType: "Petrol",
    transmission: "Automatic",
    price: 45000,
    endTime: new Date(Date.now() + 36 * 60 * 60 * 1000),
  },
];

function CountdownTimer({ endTime }: { endTime: Date }) {
  const [timeLeft, setTimeLeft] = useState<string>("00:00:00:00");

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = endTime.getTime() - now;

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft(`${days.toString().padStart(2, '0')}:${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime]);

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-center py-2 px-4">
      {timeLeft}
    </div>
  );
}

export default function VansCollection() {
  return (
    <section className="">
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold">Vans Collection</h2>
          <Link href="/vans" className="text-sm bg-gray-100 px-4 py-1 rounded-full hover:bg-gray-200">
            View All
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {vans.map((van) => (
            <Card key={van.id} className="group">
              <div className="relative aspect-[4/3]">
                <img
                  src={van.image}
                  alt={van.name}
                  className="object-cover w-full h-full"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 bg-white/80 hover:bg-white rounded-md"
                >
                  <Bookmark className="h-4 w-4" />
                </Button>
                <CountdownTimer endTime={van.endTime} />
              </div>
              <div className="p-4">
                <h3 className="font-medium text-lg mb-1">{van.name}</h3>
                <p className="text-sm text-gray-500 mb-3">{van.specs}</p>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="flex flex-col items-center text-center">
                    <span className="text-sm text-gray-600">{van.mileage} Miles</span>
                    <span className="text-xs text-gray-400">Mileage</span>
                  </div>
                  <div className="flex flex-col items-center text-center">
                    <span className="text-sm text-gray-600">{van.fuelType}</span>
                    <span className="text-xs text-gray-400">Fuel Type</span>
                  </div>
                  <div className="flex flex-col items-center text-center">
                    <span className="text-sm text-gray-600">{van.transmission}</span>
                    <span className="text-xs text-gray-400">Transmission</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold">${van.price.toLocaleString()}</span>
                  <Link href={`/auction/${van.id}`} className="text-blue-600 hover:text-blue-700">
                    Auction →
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}