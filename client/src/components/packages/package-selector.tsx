import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Package, UserPackage } from "@shared/schema";

export default function PackageSelector() {
  const user = null; 
  const { toast } = useToast();
  const [selectedVehicleValue, setSelectedVehicleValue] = useState<number>(0);

  const { data: packages, isLoading: loadingPackages } = useQuery<Package[]>({
    queryKey: ["/api/packages"],
  });

  const { data: activePackage } = useQuery<UserPackage>({
    queryKey: ["/api/user-packages/active"],
    enabled: !!user,
  });

  const purchaseMutation = useMutation({
    mutationFn: async ({ packageId, vehicleValue }: { packageId: number, vehicleValue: number }) => {
      await apiRequest("POST", "/api/user-packages", { packageId, vehicleValue });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Package purchased successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const calculatePrice = (basePrice: number, thresholds: any, vehicleValue: number) => {
    // Find the applicable price tier based on vehicle value
    const tier = Object.entries(thresholds)
      .reverse()
      .find(([threshold]) => vehicleValue >= parseInt(threshold));
    
    return tier ? basePrice + parseInt(tier[1]) : basePrice;
  };

  if (loadingPackages) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Subscription Packages</h2>
      <p className="text-muted-foreground">
        Choose the package that best suits your business needs
      </p>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {packages?.map((pkg) => {
          const price = calculatePrice(
            pkg.basePrice,
            pkg.vehicleValueThresholds,
            selectedVehicleValue
          );
          const isActive = activePackage?.packageId === pkg.id;

          return (
            <Card key={pkg.id} className={isActive ? "border-primary" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {pkg.name}
                  {isActive && <Check className="h-5 w-5 text-primary" />}
                </CardTitle>
                <CardDescription>{pkg.duration} days listing period</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-3xl font-bold">£{price}</div>
                <ul className="space-y-2">
                  {pkg.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <Check className="h-4 w-4 mr-2 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full"
                  disabled={isActive || purchaseMutation.isPending}
                  onClick={() => purchaseMutation.mutate({ 
                    packageId: pkg.id,
                    vehicleValue: selectedVehicleValue 
                  })}
                >
                  {purchaseMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : isActive ? (
                    "Current Package"
                  ) : (
                    "Select Package"
                  )}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
