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
import { Repeat, Check, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getPackagesWithAmount, selectPackage } from "@/api";


export default function Packages({
  type,
  vehiclePrice,
  draftId,
  pullData
}: {
  type: string;
  vehiclePrice?: number;
  draftId?: number;
  pullData?: (data:any) => void;
}) {
  console.log("packages")
  const { toast } = useToast();
  const [packages, setPackages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        setIsLoading(true);
        if (vehiclePrice !== undefined && vehiclePrice > 0) {
          console.log('fetchingpackages ')
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

  async function handleSelectPackage(packageId: number) {
    if(true){
      try{
        setSelectedPackage(packageId);
        const res= await selectPackage(packageId ?? 1, draftId ?? 1);
        if(pullData && typeof pullData === 'function'){
          pullData(res);
        }
      }
      catch(e){
        toast({
          title: "Error",
          description: "Failed to select package. Please try again.",
          variant: "destructive",
        });
      }
      finally {
        setSelectedPackage(null);
      }
    }
    else{
      toast({
        title: "Error",
        description: "Draft ID is required to select a package.",
        variant: "destructive",
      });
      return;
    }
  }
    

  if (isLoading) {
    return <div className="text-center">Loading packages...</div>;
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Standard 2-Week Package */}
      {packages.map((pkg) => (
        <Card key={pkg.id} className={pkg.is_ultra ? "border-primary" : ""}>
          <CardHeader>
            <CardTitle>{pkg.name}</CardTitle>
            <CardDescription>{pkg.duration_days} days</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Price varies based on vehicle value
            </p>
            <p className="text-2xl font-bold">From {formatPrice(pkg.amount)}</p>
            <ul className="space-y-2 mt-4">
              {pkg.features.map((feature: string, index: number) => (
                <li key={index} className="flex items-center">
                  <Check className="h-4 w-4 mr-2 text-green-500" />
                  {feature}
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
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
      ))}
    </div>
  );
}
