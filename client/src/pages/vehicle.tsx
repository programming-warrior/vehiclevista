import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import VehicleGallery from "@/components/vehicle-gallery";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Heart, Mail, Phone, MapPin } from "lucide-react";
import type { Vehicle } from "@shared/schema";

export default function VehiclePage() {
  const { id } = useParams<{ id: string }>();

  const { data: vehicle, isLoading } = useQuery<Vehicle>({
    queryKey: [`/api/vehicles/${id}`],
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-[400px] rounded-lg bg-muted animate-pulse" />
        <div className="h-8 w-64 bg-muted animate-pulse" />
        <div className="h-6 w-32 bg-muted animate-pulse" />
      </div>
    );
  }

  if (!vehicle) {
    return <div>Vehicle not found</div>;
  }

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <VehicleGallery images={vehicle.images} title={vehicle.title} />
        
        <div className="mt-8">
          <h1 className="text-3xl font-bold">{vehicle.title}</h1>
          <p className="text-3xl font-bold text-primary mt-4">
            £{vehicle.price.toLocaleString()}
          </p>
          
          <div className="flex flex-wrap gap-2 mt-4">
            <Badge>{vehicle.year}</Badge>
            <Badge>{vehicle.mileage.toLocaleString()} miles</Badge>
            <Badge>{vehicle.transmission}</Badge>
            <Badge>{vehicle.fuelType}</Badge>
            <Badge>{vehicle.bodyType}</Badge>
            <Badge>{vehicle.color}</Badge>
          </div>

          <Separator className="my-8" />
          
          <div>
            <h2 className="text-xl font-semibold mb-4">Description</h2>
            <p className="text-muted-foreground whitespace-pre-line">
              {vehicle.description}
            </p>
          </div>
        </div>
      </div>

      <div className="lg:col-span-1">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
              <MapPin className="h-4 w-4" />
              {vehicle.location}
            </div>

            <div className="space-y-4">
              <Button className="w-full" size="lg">
                <Phone className="h-4 w-4 mr-2" />
                Show Phone Number
              </Button>
              
              <Button variant="outline" className="w-full" size="lg">
                <Mail className="h-4 w-4 mr-2" />
                Contact Seller
              </Button>
              
              <Button variant="secondary" className="w-full" size="lg">
                <Heart className="h-4 w-4 mr-2" />
                Save Vehicle
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
