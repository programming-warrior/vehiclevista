import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Bookmark } from "lucide-react";
import { useState, useEffect } from "react";

type BikeModel = {
  id: string;
  image: string;
  name: string;
  specs: string;
  price: number;
  endTime: Date;
};

const bikes: BikeModel[] = [
  {
    id: "1",
    image: "https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?auto=format&fit=crop&w=800",
    name: "BMW Bike model 2023",
    specs: "4.0 D5 PowerPulse Momentum 5dr AWD Geartronic",
    price: 22000,
    endTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
  },
  {
    id: "2",
    image: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800",
    name: "Sport Bike model 2023",
    specs: "4.0 D5 PowerPulse Momentum 5dr AWD Geartronic",
    price: 22000,
    endTime: new Date(Date.now() + 48 * 60 * 60 * 1000),
  },
  {
    id: "3",
    image: "https://images.unsplash.com/photo-1558981359-219d6364c9c8?auto=format&fit=crop&w=800",
    name: "Java classic bike",
    specs: "3.5 D5 PowerPulse Momentum 5dr AWD Geartronic",
    price: 3500,
    endTime: new Date(Date.now() + 12 * 60 * 60 * 1000),
  },
  {
    id: "4",
    image: "https://images.unsplash.com/photo-1558981852-426c6c22a060?auto=format&fit=crop&w=800",
    name: "Corolla Altis – 2023",
    specs: "3.5 D5 PowerPulse Momentum 5dr AW",
    price: 4000,
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

export default function BikesCollection() {
  return (
    <section className="">
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold">Bikes Collection</h2>
          <Link href="/bikes" className="text-sm bg-gray-100 px-4 py-1 rounded-full hover:bg-gray-200">
            View All
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {bikes.map((bike) => (
            <Card key={bike.id} className="group relative overflow-hidden">
              <div className="relative aspect-[4/3]">
                <img
                  src={bike.image}
                  alt={bike.name}
                  className="object-cover w-full h-full"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 bg-white/80 hover:bg-white rounded-md"
                >
                  <Bookmark className="h-4 w-4" />
                </Button>
                <CountdownTimer endTime={bike.endTime} />
              </div>
              <div className="p-4">
                <h3 className="font-medium text-lg mb-1">{bike.name}</h3>
                <p className="text-sm text-gray-500 mb-3">{bike.specs}</p>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold">${bike.price.toLocaleString()}</span>
                  <Link href={`/auction/${bike.id}`} className="text-blue-600 hover:text-blue-700">
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
