import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, MapPin, Gauge, Fuel, Settings } from "lucide-react";
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
      <Link href={`/vehicle/${vehicle.id}`} className="block">
        <CardContent className="p-0">
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
              className="absolute top-3 right-3 bg-white/80 hover:bg-white"
            >
              <Heart className="h-4 w-4" />
            </Button>
          </AspectRatio>

          <div className="p-4">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                {vehicle.title}
              </h3>
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
                  <div className="text-white text-center">
                    <div className="text-xs">from</div>
                    <div className="font-bold">£{(vehicle.price / 1000).toFixed(1)}k</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Gauge className="h-4 w-4" />
                {vehicle.mileage.toLocaleString()} mi
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Fuel className="h-4 w-4" />
                {vehicle.fuelType}
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Settings className="h-4 w-4" />
                {vehicle.transmission}
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {vehicle.location}
            </div>
          </div>
        </CardContent>
      </Link>
      <CardFooter className="px-4 pb-4">
        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
          Buy
        </Button>
      </CardFooter>
    </Card>
  );
}