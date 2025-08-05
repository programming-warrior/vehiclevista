import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { getVehicles } from "@/api";
import { useVehicleLists, useHeroSectionSearch } from "@/hooks/use-store";
import { useToast } from "@/hooks/use-toast";
import VehicleCard from "@/components/vehicle-card";
import { AlertCircle, Infinity } from "lucide-react";
import { ALL_MAKE, MAKE_MODEL_MAP } from "@/lib/constants";
import { vehicleConditions, vehicleTypes } from "@shared/schema";
import {
  vehicleTransmissionsTypes,
  vehicleFuelTypes,
} from "@shared/zodSchema/vehicleSchema";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { validatePostalCode } from "@/api";
import { useDebounce } from "@/hooks/use-debounce";
import { DISTANCES } from "@/lib/constants";

export default function VehiclePage() {
  const {
    brand,
    maxBudget,
    minBudget,
    model,
    vehicleType,
    transmissionType,
    color,
    fuelType,
    longitude,
    latitude,
    postalCode,
    distance,
    setSearch,
  } = useHeroSectionSearch();

  const { toast } = useToast();

  const { vehicles, setVehicles } = useVehicleLists();
  const limit = 6;
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalVehicles, setTotalVehicles] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const debouncedColor = useDebounce(color);

  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        console.log("maxBudget: ",maxBudget);
        let searchParam = `page=${page}&limit=${limit}&`;
        if (brand) {
          searchParam += `brand=${brand}&`;
        }
        if (model) {
          searchParam += `model=${model}&`;
        }
        if (minBudget && minBudget > 0.0) {
          searchParam += `minBudget=${minBudget}&`;
        }
        if (maxBudget && maxBudget > 0.0) {
          searchParam += `maxBudget=${maxBudget}&`;
        }
        if (vehicleType) {
          searchParam += `type=${vehicleType}&`;
        }
        if (debouncedColor) {
          searchParam += `color=${debouncedColor}&`;
        }
        if (transmissionType) {
          searchParam += `transmissionType=${transmissionType}&`;
        }
        if (fuelType) {
          searchParam += `fuelType=${fuelType}&`;
        }
        if (latitude && longitude) {
          searchParam += `latitude=${latitude}&longitude=${longitude}&`;
          if (distance) searchParam += `distance=${distance}&`;
        }

        const res: any = await getVehicles(searchParam);
        setVehicles(res.vehicles);
        setTotalVehicles(res.totalVehicles);
        setTotalPages(res.totalPages);
        setHasNextPage(res.hasNextPage);
      } catch (e: any) {
        toast({
          title: "Failed",
          description: e.message || "Error Fetching Vehicle list",
        });
      } finally {
        setIsLoading(false);
      }
    })();
  }, [
    page,
    brand,
    model,
    maxBudget,
    minBudget,
    vehicleType,
    transmissionType,
    fuelType,
    debouncedColor,
    latitude,
    longitude,
    distance,
  ]);

  const debouncedPostalCode = useDebounce(postalCode);

  useEffect(() => {
    let ignore = false;
    async function fetch() {
      try {
        if(!debouncedPostalCode) return;
        const res = await validatePostalCode(debouncedPostalCode);
        if (
          res.data.result &&
          res.data.result.latitude &&
          res.data.result.longitude
        ) {
          setSearch({
            latitude: res.data.result.latitude,
            longitude: res.data.result.longitude,
          });
        }
      } catch (e: any) {
        console.error("before setting error", e.message);
      }
    }
    fetch();
    return () => {
      ignore = true;
    };
  }, [debouncedPostalCode]);


  return (
    <div className="flex min-h-screen">
      {/* Filter Sidebar */}
      <div className="w-80 p-6 border-r">
        {/* <h2 className="text-xl font-bold mb-6 text-blue-500">Filters</h2> */}

        <div className="space-y-6">
          <div>
            <h3 className="font-medium mb-2 text-blue-800">Location Filter</h3>
            <div className="flex gap-2">
              <div className="w-1/2">
                <Input
                  type="text"
                  placeholder="Postal Code"
                  className="pl-2 border-blue-200 focus:ring-blue-500"
                  value={postalCode}
                  onChange={async (e) => {
                    const val = e.target.value;
                    setSearch({
                      postalCode: val,
                    });
                  }}
                />
              </div>

              <div className="w-1/2">
                <Select
                  value={distance}
                  disabled={!latitude}
                  onValueChange={(val)=>setSearch({distance:val})}
                >
                  <SelectTrigger className="border-blue-200 focus:ring-blue-500 focus:border-blue-500">
                    <SelectValue
                      placeholder="Distance"
                      className="bg-white border-blue-200 focus:ring-blue-500"
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {/* <SelectItem value="All">All</SelectItem> */}
                    {DISTANCES.map((m) => {
                      return <SelectItem value={m}>{m}</SelectItem>;
                    })}
                  </SelectContent>
                </Select>
              </div>

    
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2 text-blue-800">Price Range</h3>
            <div className="flex gap-2">
              <div>
                <h3 className="text-blue-600">Min</h3>
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9,]*"
                  placeholder="Min"
                  className="pl-10 border-blue-200 focus:ring-blue-500"
                  value={minBudget > 0 ? minBudget.toLocaleString() : ""}
                  onChange={(e) => {
                    const rawValue = e.target.value
                      .replace(/,/g, "")
                      .replace(/\D/g, "");
                    const numValue = Number(rawValue);
                    setSearch({
                      brand,
                      model,
                      maxBudget,
                      minBudget: rawValue === "" ? 0 : numValue,
                    });
                  }}
                />
              </div>

              <div>
                <h3 className="text-blue-600">Max</h3>
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9,]*"
                  placeholder="Min"
                  className="pl-10 border-blue-200 focus:ring-blue-500"
                  value={maxBudget > 0 ? maxBudget.toLocaleString() : ""}
                  onChange={(e) => {
                    const rawValue = e.target.value
                      .replace(/,/g, "")
                      .replace(/\D/g, "");
                    const numValue = Number(rawValue);
                    setSearch({
                      maxBudget: rawValue === "" ? 0 : numValue,
                    });
                  }}
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2 text-blue-800">Make</h3>
            <Select
              value={brand}
              onValueChange={(value) =>
                setSearch({
                  brand: value,
                  model: value === "All" ? "All" : model,
                  minBudget,
                  maxBudget,
                })
              }
            >
              <SelectTrigger className="border-blue-200 focus:ring-blue-500 focus:border-blue-500">
                <SelectValue
                  placeholder="Brand"
                  className="bg-white border-blue-200 focus:ring-blue-500"
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All</SelectItem>
                {ALL_MAKE.map((m) => {
                  return <SelectItem value={m}>{m}</SelectItem>;
                })}
              </SelectContent>
            </Select>
          </div>

          <div>
            <h3 className="font-medium mb-2 text-blue-800">Model</h3>
            <Select
              value={model}
              disabled={!brand}
              onValueChange={(value) =>
                setSearch({
                  brand,
                  model: value,
                  minBudget,
                  maxBudget,
                })
              }
            >
              <SelectTrigger className="border-blue-200 focus:ring-blue-500 focus:border-blue-500">
                <SelectValue placeholder="Model" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="All">All</SelectItem>
                {MAKE_MODEL_MAP[brand]?.length > 0 &&
                  MAKE_MODEL_MAP[brand as string].map((m) => {
                    return <SelectItem value={m}>{m}</SelectItem>;
                  })}
              </SelectContent>
            </Select>
          </div>

          <div>
            <h3 className="font-medium mb-2 text-blue-800">Vehicle Type</h3>
            <Select
              value={vehicleType}
              onValueChange={(value) =>
                setSearch({
                  vehicleType: value,
                })
              }
            >
              <SelectTrigger className="border-blue-200 focus:ring-blue-500 focus:border-blue-500">
                <SelectValue
                  placeholder="Vehicle Type"
                  className="bg-white border-blue-200 focus:ring-blue-500"
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">Any</SelectItem>
                {vehicleTypes.map((m) => {
                  return (
                    <SelectItem value={m}>
                      {m
                        .split("")
                        .map((ch, i) => (i == 0 ? ch.toUpperCase() : ch))
                        .join("")}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div>
            <h3 className="font-medium mb-2 text-blue-800">
              Transmission Type
            </h3>
            <Select
              onValueChange={(value) =>
                setSearch({
                  transmissionType: value,
                })
              }
              defaultValue={transmissionType}
            >
              <SelectTrigger className="border-blue-200 focus:ring-blue-500 focus:border-blue-500">
                <SelectValue placeholder="Select transmission type" />
              </SelectTrigger>
              <SelectContent className="border-blue-200">
                <SelectItem value="All">All</SelectItem>
                {vehicleType &&
                  vehicleTransmissionsTypes[
                    vehicleType as keyof typeof vehicleTransmissionsTypes
                  ] &&
                  vehicleTransmissionsTypes[
                    vehicleType as keyof typeof vehicleTransmissionsTypes
                  ].map((transmission: string) => (
                    <SelectItem key={transmission} value={transmission}>
                      {transmission}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <h3 className="font-medium mb-2 text-blue-800">Fuel Type</h3>
            <Select
              onValueChange={(value) =>
                setSearch({
                  fuelType: value,
                })
              }
              defaultValue={fuelType}
            >
              <SelectTrigger className="border-blue-200 focus:ring-blue-500 focus:border-blue-500">
                <SelectValue placeholder="Select Fuel type" />
              </SelectTrigger>
              <SelectContent className="border-blue-200">
                <SelectItem value="All">All</SelectItem>
                {vehicleType &&
                  vehicleFuelTypes[
                    vehicleType as keyof typeof vehicleFuelTypes
                  ] &&
                  vehicleFuelTypes[
                    vehicleType as keyof typeof vehicleFuelTypes
                  ].map((fuelType: string) => (
                    <SelectItem key={fuelType} value={fuelType}>
                      {fuelType}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <h3 className="font-medium mb-2 text-blue-800">Color</h3>
            <Input
              type="text"
              className="pl-10 border-blue-200 focus:ring-blue-500"
              value={color}
              onChange={(e) => {
                setSearch({
                  color: e.target.value,
                });
              }}
            />
          </div>

          <Button
            variant="outline"
            className="w-full text-center border-blue-200 bg-white  font-normal "
            onClick={() =>
              setSearch({
                minBudget: 0,
                maxBudget: 0,
                brand: "",
                model: "",
              })
            }
          >
            Clear Filters
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="w-full  p-4 flex flex-col gap-4 border-blue-200">
          <Skeleton className="w-[90%] h-16 bg-blue-100" />
          <Skeleton className="w-full h-16 bg-blue-100" />
          <Skeleton className="w-full h-16 bg-blue-100" />
          <Skeleton className="w-full h-16 bg-blue-100" />
        </div>
      ) : (
        <div className="flex-1 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.length == 0 ? (
              <Alert className="border-blue-200 bg-blue-50 w-full col-span-full mb-4">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-700">0 result</AlertTitle>
                <AlertDescription className="text-blue-600">
                  No Vehicles Found!
                </AlertDescription>
              </Alert>
            ) : (
              vehicles.map((vehicle: any) => <VehicleCard vehicle={vehicle} />)
            )}
          </div>
          <div className="pt-2 flex justify-between bg-blue-50 rounded-sm mt-3">
            <div className="text-sm text-blue-600 rounded-sm px-2">
              Showing {vehicles.length} of {totalVehicles} vehicles
            </div>
            {totalPages > 1 && (
              <div className="flex items-center gap-2 px-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-blue-200 hover:bg-blue-100 text-blue-700"
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  disabled={page === 1 || isLoading}
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={page === pageNum ? "default" : "outline"}
                        size="sm"
                        className={
                          page === pageNum
                            ? "w-8 h-8 p-0 bg-blue-600 hover:bg-blue-700"
                            : "w-8 h-8 p-0 border-blue-200 text-blue-700 hover:bg-blue-100"
                        }
                        onClick={() => setPage(pageNum)}
                        disabled={isLoading}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-blue-200 hover:bg-blue-100 text-blue-700"
                  onClick={() =>
                    setPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={page === totalPages || isLoading}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
