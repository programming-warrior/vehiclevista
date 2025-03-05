import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import VehicleCard from "@/components/vehicle-card";
import type { Vehicle } from "@shared/schema";
import { Loader2 } from "lucide-react";

export default function BrandPage() {
  const { brand } = useParams();
  
  const { data: vehicles, isLoading } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles", { make: brand }],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8 capitalize">{brand} Vehicles</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vehicles?.map((vehicle) => (
          <VehicleCard key={vehicle.id} vehicle={vehicle} />
        ))}
      </div>
    </div>
  );
}
