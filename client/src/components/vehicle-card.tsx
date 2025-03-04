import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, MapPin } from "lucide-react";
import { Link } from "wouter";
import type { Vehicle } from "@shared/schema";

export default function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  return (
    <Card className="group hover:shadow-lg transition-shadow">
      <Link href={`/vehicle/${vehicle.id}`}>
        <a className="block">
          <CardContent className="p-0">
            <AspectRatio ratio={16/9}>
              <img 
                src={vehicle.images[0]} 
                alt={vehicle.title}
                className="object-cover w-full h-full rounded-t-lg"
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
        </a>
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
