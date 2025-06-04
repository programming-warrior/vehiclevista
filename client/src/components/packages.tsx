import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useEffect, useState } from "react";
import { Repeat, Check, Star, Clock, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getPackagesWithAmount, selectPackage } from "@/api";

export default function Packages({
  type,
  vehiclePrice,
  draftId,
  pullData,
}: {
  type: "AUCTION" | "CLASSIFIED";
  vehiclePrice?: number;
  draftId?: number;
  pullData?: (data: any) => void;
}) {
  console.log("packages");
  const { toast } = useToast();
  const [packages, setPackages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        setIsLoading(true);
        if (vehiclePrice !== undefined && vehiclePrice > 0) {
          console.log("fetchingpackages ");
          const packages = await getPackagesWithAmount(type, vehiclePrice);
          console.log("Fetched packages:", packages);
          setPackages(packages);
        }
      } catch (error) {
        console.error("Error fetching packages:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPackages();
  }, []);

  const formatPrice = (price: number) => `£${price.toLocaleString()}`;

  const getPriceForVehicle = (pkg: any, vehiclePrice: number) => {
    if (!pkg.prices || pkg.prices.length === 0) return pkg.amount;
    
    for (const priceRange of pkg.prices) {
      const [min, max, price] = priceRange;
      if (max === -1) {
        // Unlimited range
        if (vehiclePrice >= min) return price;
      } else if (vehiclePrice >= min && vehiclePrice <= max) {
        return price;
      }
    }
    return pkg.amount; // fallback
  };

  async function handleSelectPackage(packageId: number) {
    if (true) {
      try {
        setSelectedPackage(packageId);
        const res = await selectPackage(packageId ?? 1, type, draftId ?? 1);
        if (pullData && typeof pullData === "function") {
          pullData(res);
        }
      } catch (e) {
        toast({
          title: "Error",
          description: "Failed to select package. Please try again.",
          variant: "destructive",
        });
      } finally {
        setSelectedPackage(null);
      }
    } else {
      toast({
        title: "Error",
        description: "Draft ID is required to select a package.",
        variant: "destructive",
      });
      return;
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-blue-600">Loading packages...</div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {packages.map((pkg) => {
        const currentPrice = vehiclePrice ? getPriceForVehicle(pkg, vehiclePrice) : pkg.amount;
        
        return (
          <Card 
            key={pkg.id} 
            className={`border-2 transition-all duration-200 hover:shadow-lg ${
              pkg.is_ultra 
                ? "border-blue-500 bg-blue-50" 
                : "border-gray-200 hover:border-blue-300"
            }`}
          >
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold text-gray-900">
                  {pkg.name}
                </CardTitle>
                {pkg.is_ultra && (
                  <Star className="h-5 w-5 text-blue-500 fill-blue-500" />
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>
                    {pkg.is_until_sold ? "Until Sold" : `${pkg.duration_days} days`}
                  </span>
                </div>
                {pkg.is_rebookable && (
                  <div className="flex items-center gap-1">
                    <RefreshCw className="h-4 w-4" />
                    <span>Rebookable</span>
                  </div>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="pb-6">
              {/* Pricing Information */}
              <div className="mb-6">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {formatPrice(currentPrice)}
                </div>
                {pkg.prices && pkg.prices.length > 0 && (
                  <div className="text-sm text-gray-600">
                    <div className="font-medium mb-2">Pricing tiers:</div>
                    {pkg.prices.map((priceRange: any, index: number) => {
                      const [min, max, price] = priceRange;
                      return (
                        <div 
                          key={index} 
                          className={`text-xs py-1 px-2 rounded mb-1 ${
                            vehiclePrice && vehiclePrice >= min && (max === -1 || vehiclePrice <= max)
                              ? "bg-blue-100 text-blue-800 font-medium"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {formatPrice(min)} - {max === -1 ? "Above" : formatPrice(max)}: £{price}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Features List */}
              <div>
                <div className="font-medium text-gray-900 mb-3">Features included:</div>
                <ul className="space-y-2">
                  {pkg.features.map((feature: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-4 w-4 mt-0.5 text-blue-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
            
            <CardFooter>
              <Button
                className={`w-full font-medium transition-all duration-200 ${
                  pkg.is_ultra
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-gray-900 hover:bg-black text-white"
                }`}
                onClick={() => handleSelectPackage(pkg.id)}
                disabled={selectedPackage ? true : false}
              >
                Select Package
                {selectedPackage === pkg.id && (
                  <span className="ml-2 animate-spin">
                    <Repeat className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}