import { useQuery } from "@tanstack/react-query";
import { useSearch } from "wouter";
import VehicleCard from "@/components/vehicle-card";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { bodyTypes, makes } from "@/lib/mock-data";
import type { Vehicle } from "@shared/schema";

export default function SearchPage() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const query = params.get("q") || "";

  const { data: vehicles, isLoading } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles/search", query],
  });

  return (
    <div className="grid lg:grid-cols-4 gap-8">
      <Card className="lg:col-span-1 h-fit">
        <CardContent className="p-6 space-y-6">
          <div>
            <h3 className="font-medium mb-4">Make</h3>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Any make" />
              </SelectTrigger>
              <SelectContent>
                {makes.map((make) => (
                  <SelectItem key={make} value={make}>
                    {make}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <h3 className="font-medium mb-4">Body Type</h3>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Any body type" />
              </SelectTrigger>
              <SelectContent>
                {bodyTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <h3 className="font-medium mb-4">Price Range</h3>
            <Slider
              defaultValue={[0, 100000]}
              max={100000}
              step={1000}
              className="mt-6"
            />
            <div className="flex justify-between mt-2 text-sm text-muted-foreground">
              <span>£0</span>
              <span>£100,000+</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="lg:col-span-3">
        <h2 className="text-2xl font-bold mb-6">
          {query ? `Search results for "${query}"` : "All Vehicles"}
        </h2>

        {isLoading ? (
          <div className="grid md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-[400px] rounded-lg bg-muted animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {vehicles?.map((vehicle) => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
