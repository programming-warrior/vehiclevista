import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, MapPin, Car } from "lucide-react";
import { Link } from "wouter";
import type { Vehicle } from "@shared/schema";

export default function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  return (
    <Card className="group hover:shadow-lg transition-shadow">
      <Link href={`/vehicle/${vehicle.id}`} className="block">
        <CardContent className="p-0">
          <AspectRatio ratio={16/9}>
            <img 
              src={vehicle.images[0]} 
              alt={vehicle.title}
              className="object-cover w-full h-full rounded-t-lg"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "data:image/svg+xml," + encodeURIComponent(`
                  <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect width="20" height="16" x="2" y="4" rx="2"/>
                    <path d="M2 8h20"/>
                    <path d="M12 12v4"/>
                    <path d="M10 14h4"/>
                  </svg>
                `);
                target.classList.add("bg-muted", "p-4");
              }}
            />
          </AspectRatio>
          <div className="p-4">
            <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
              {vehicle.title}
            </h3>
            <p className="text-2xl font-bold mt-2">
              £{vehicle.price.toLocaleString()}
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge variant="secondary">{vehicle.year}</Badge>
              <Badge variant="secondary">{vehicle.mileage.toLocaleString()} miles</Badge>
              <Badge variant="secondary">{vehicle.transmission}</Badge>
              <Badge variant="secondary">{vehicle.fuelType}</Badge>
            </div>
            <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {vehicle.location}
            </div>
          </div>
        </CardContent>
      </Link>
      <CardFooter className="px-4 pb-4">
        <Button variant="outline" size="sm" className="w-full">
          <Heart className="h-4 w-4 mr-2" />
          Save
        </Button>
      </CardFooter>
    </Card>
  );
}