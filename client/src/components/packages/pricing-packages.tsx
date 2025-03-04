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
import { Repeat, Check, Star } from "lucide-react";
import type { Package } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function PricingPackages() {
  const { toast } = useToast();
  const { data: packages, isLoading } = useQuery<Package[]>({
    queryKey: ["/api/packages"],
  });

  const purchaseMutation = useMutation({
    mutationFn: async (packageId: number) => {
      const res = await apiRequest("POST", "/api/user-packages", {
        packageId,
        // Vehicle value will be set in a proper form
        vehicleValue: 10000,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-packages"] });
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

  const formatPrice = (price: number) => `£${price.toLocaleString()}`;

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Standard 2-Week Package */}
      <Card>
        <CardHeader>
          <CardTitle>Standard 2-Week</CardTitle>
          <CardDescription>
            Perfect for quick sales with competitive pricing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-2xl font-bold">From {formatPrice(1499)}</p>
            <p className="text-sm text-muted-foreground">
              Price varies based on vehicle value
            </p>
            <ul className="space-y-2 mt-4">
              <li className="flex items-center">
                <Check className="h-4 w-4 mr-2 text-green-500" />
                14 days listing duration
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 mr-2 text-green-500" />
                Basic photo gallery
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 mr-2 text-green-500" />
                Standard search visibility
              </li>
            </ul>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            className="w-full" 
            onClick={() => purchaseMutation.mutate(1)}
            disabled={purchaseMutation.isPending}
          >
            Select Package
          </Button>
        </CardFooter>
      </Card>

      {/* Standard 4-Week Package */}
      <Card>
        <CardHeader>
          <CardTitle>Standard 4-Week</CardTitle>
          <CardDescription>
            Extended visibility for better exposure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-2xl font-bold">From {formatPrice(2499)}</p>
            <p className="text-sm text-muted-foreground">
              Price varies based on vehicle value
            </p>
            <ul className="space-y-2 mt-4">
              <li className="flex items-center">
                <Check className="h-4 w-4 mr-2 text-green-500" />
                28 days listing duration
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 mr-2 text-green-500" />
                Enhanced photo gallery
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 mr-2 text-green-500" />
                Improved search ranking
              </li>
            </ul>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            className="w-full" 
            onClick={() => purchaseMutation.mutate(2)}
            disabled={purchaseMutation.isPending}
          >
            Select Package
          </Button>
        </CardFooter>
      </Card>

      {/* Ultra Package */}
      <Card className="border-primary">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Ultra Package</CardTitle>
            <Star className="h-5 w-5 text-primary" />
          </div>
          <CardDescription>
            Premium features for maximum exposure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-2xl font-bold">From {formatPrice(4999)}</p>
            <p className="text-sm text-muted-foreground">
              Price varies based on vehicle value
            </p>
            <ul className="space-y-2 mt-4">
              <li className="flex items-center">
                <Check className="h-4 w-4 mr-2 text-green-500" />
                Until Sold (12-week refresh)
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 mr-2 text-green-500" />
                YouTube video showcase
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 mr-2 text-green-500" />
                Premium placement
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 mr-2 text-green-500" />
                Free re-listing every 12 weeks
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 mr-2 text-green-500" />
                Priority customer support
              </li>
            </ul>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            variant="default" 
            className="w-full" 
            onClick={() => purchaseMutation.mutate(3)}
            disabled={purchaseMutation.isPending}
          >
            Select Ultra Package
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
