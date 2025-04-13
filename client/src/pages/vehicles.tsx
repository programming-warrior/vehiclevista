import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { useEffect, useState } from "react";
import { getVehicles } from "@/api";
import { useVehicleLists, useHeroSectionSearch } from "@/hooks/use-store";
import { useToast } from "@/hooks/use-toast";
import VehicleCard from "@/components/vehicle-card";
import { ArrowRight, ArrowLeft } from "lucide-react";
import Loader from "@/components/loader";

export default function VehiclesList() {
  const { brand, maxBudget, minBudget, model, variant, setSearch } =
    useHeroSectionSearch();

  const { toast } = useToast();

  // const [filters, setFilters] = useState({
  //   minPrice: 0,
  //   maxPrice: 100000,
  //   make: "",
  //   model: "",
  //   bodyType: "",
  // });

  const { vehicles, setVehicles } = useVehicleLists();
  const limit = 6;
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        let searchParam = `page=${page}&limit=${limit}&`;
        if (brand) {
          searchParam += `brand=${brand}&`;
        }
        if (model) {
          searchParam += `model=${model}&`;
        }
        if (variant) {
          searchParam += `variant=${variant}&`;
        }
        if (maxBudget && minBudget) {
          searchParam += `minBudget=${minBudget}&maxBudget=${maxBudget}&`;
        }
        const res: any = await getVehicles(searchParam);
        setVehicles(res.vehicles);
        setTotalPages(res.totalPages);
        setHasNextPage(res.hasNextPage);
      } catch (e: any) {
        toast({
          title: "Failed",
          description: e.message || "Error Fetching Vehicle list",
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [page, brand, model, variant, maxBudget, minBudget]);

  //   const filteredVehicles = vehicles.filter((vehicle: any) => {
  //     return (
  //       vehicle.price >= filters.minPrice &&
  //       vehicle.price <= filters.maxPrice &&
  //       (filters.make ? vehicle.make === filters.make : true) &&
  //       (filters.model ? vehicle.model === filters.model : true) &&
  //       (filters.bodyType ? vehicle.bodyType === filters.bodyType : true)
  //     );
  //   });

  return (
    <div className="flex min-h-screen">
      {/* Filter Sidebar */}
      <div className="w-80 p-6 border-r">
        <h2 className="text-xl font-bold mb-6">Filters</h2>

        <div className="space-y-6">
          <div>
            <h3 className="font-medium mb-2">Price Range</h3>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Min"
                value={minBudget}
                onChange={(e) =>
                  // setFilters({ ...filters, minPrice: Number(e.target.value) })
                  setSearch({
                    brand,
                    model,
                    variant,
                    maxBudget,
                    minBudget: Number(e.target.value),
                  })
                }
              />
              <Input
                type="number"
                placeholder="Max"
                value={maxBudget}
                onChange={(e) =>
                  setSearch({
                    brand,
                    model,
                    variant,
                    minBudget,
                    maxBudget: Number(e.target.value),
                  })
                }
              />
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2">Brand</h3>
            <Select
              value={brand}
              onValueChange={(value) =>
                setSearch({
                  brand: value,
                  model,
                  variant,
                  minBudget,
                  maxBudget,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Brand" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Brands</SelectItem>
                <SelectItem value="Mercedes-Benz">Mercedes-Benz</SelectItem>
                <SelectItem value="BMW">BMW</SelectItem>
                <SelectItem value="Audi">Audi</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <h3 className="font-medium mb-2">Model</h3>
            <Select
              value={model}
              onValueChange={(value) =>
                setSearch({
                  brand,
                  model: value,
                  variant,
                  minBudget,
                  maxBudget,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Model" />
              </SelectTrigger>
              <SelectContent>
                <SelectContent>
                  <SelectItem value="All">All-Models</SelectItem>
                  <SelectItem value="A6">A6</SelectItem>
                  <SelectItem value="A-Class">A-Class</SelectItem>
                  <SelectItem value="C-Class">C-Class</SelectItem>
                  <SelectItem value="E-Class">E-Class</SelectItem>
                </SelectContent>
              </SelectContent>
            </Select>
          </div>

          <div>
            <h3 className="font-medium mb-2">Variant</h3>
            <Select
              value={variant}
              onValueChange={(value) =>
                setSearch({
                  brand,
                  model,
                  variant: value,
                  minBudget,
                  maxBudget,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select variant" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">Model Variants</SelectItem>
                <SelectItem value="AMG">AMG</SelectItem>
                <SelectItem value="Sport">Sport</SelectItem>
                <SelectItem value="SE">SE</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            className="w-full"
            onClick={() =>
              setSearch({
                minBudget: 0,
                maxBudget: 0,
                brand: "",
                model: "",
                variant: "",
              })
            }
          >
            Clear Filters
          </Button>
        </div>
      </div>

      {/* Vehicle List */}
      {loading ? (
        <div className="flex items-center justify-center h-full w-full">
          <Loader />
        </div>
      ) : (
        <div className="flex-1 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.length == 0 ? (
              <div className="col-span-full flex items-center justify-center h-full w-full">
                <p>No Vehicles found</p>
              </div>
            ) : (
              vehicles.map((vehicle: any) => <VehicleCard vehicle={vehicle} />)
            )}
          </div>
          <div className="flex justify-center mt-6 gap-4 ">
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              <ArrowLeft />
            </Button>
            {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
              const pageNumber =
                i + 1 + (page > 5 && totalPages > 10 ? page - 5 : 0);
              if (pageNumber > totalPages) return null;
              return (
                <Button
                  key={pageNumber}
              
                  variant={page === pageNumber ? "default" : "outline"}
                  onClick={() => setPage(pageNumber)}
                >
                  {pageNumber}
                </Button>
              );
            })}
            {totalPages > 10 && page + 5 < totalPages && <span>...</span>}

            <Button
              variant="outline"
              className=""
              disabled={!hasNextPage}
              onClick={() => setPage(page + 1)}
            >
              <ArrowRight />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
