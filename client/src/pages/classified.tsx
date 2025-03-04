import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import ClassifiedListing from "@/components/classified/classified-listing";
import type { Vehicle } from "@shared/schema";

export default function ClassifiedPage() {
  const { data: vehicles, isLoading } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles", { category: "classified" }],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Classified Listings</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vehicles?.filter(v => v.category === 'classified').map((vehicle) => (
          <ClassifiedListing key={vehicle.id} vehicle={vehicle} />
        ))}
      </div>
    </div>
  );
}
