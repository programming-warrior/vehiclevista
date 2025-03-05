import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Gauge, Fuel, Settings } from "lucide-react";
import { Link } from "wouter";
import type { Vehicle } from "@shared/schema";

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

export default function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  return (
    <Card className="group hover:shadow-lg transition-shadow">
      <Link href={`/vehicle/${vehicle.id}`}>
        <CardContent className="p-0">
          {/* Image with Category Badge and Bookmark */}
          <AspectRatio ratio={16/9} className="relative">
            <img 
              src={vehicle.images[0]}
              alt={vehicle.title}
              className="object-cover w-full h-full rounded-t-lg"
            />
            <div className="absolute top-3 left-3">
              <Badge 
                className={`${conditionColors[vehicle.condition as keyof typeof conditionColors]} border-none font-medium px-3 py-1`}
              >
                {conditionLabels[vehicle.condition as keyof typeof conditionLabels]}
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
          </AspectRatio>

          {/* Price Display in Speedometer Style */}
          <div className="absolute -bottom-6 left-3 w-32 h-16 bg-black rounded-lg overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black flex items-center justify-center">
              <div className="text-white text-center">
                <span className="text-2xl font-bold">£{(vehicle.price / 1000).toFixed(0)}k</span>
              </div>
            </div>
          </div>

          {/* Vehicle Details */}
          <div className="p-4 pt-8">
            <h3 className="text-lg font-semibold mb-2 mt-2">
              {vehicle.title}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {vehicle.description}
            </p>

            {/* Vehicle Specifications */}
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Gauge className="h-4 w-4 text-gray-500" />
                <span className="text-sm">{vehicle.mileage.toLocaleString()} Miles</span>
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
      </Link>

      <CardFooter className="px-4 pb-4 pt-2">
        <Link href={`/vehicle/${vehicle.id}`} className="w-full">
          <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
            Buy →
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}