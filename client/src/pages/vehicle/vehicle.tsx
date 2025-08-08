import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useMemo } from "react";
import { getVehicles } from "@/api";
import { useVehicleLists, useHeroSectionSearch } from "@/hooks/use-store";
import { useToast } from "@/hooks/use-toast";
import VehicleCard from "@/components/vehicle-card";
import { AlertCircle, Filter, X, ArrowUpDown } from "lucide-react";
import { ALL_MAKE, MAKE_MODEL_MAP, VEHICLE_CONDITIONS } from "@/lib/constants";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

// Generate year options
const generateYearOptions = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let year = currentYear; year >= 1990; year--) {
    years.push(year.toString());
  }
  return years;
};

// Generate mileage options
const generateMileageOptions = () => {
  const mileageRanges = [
    "5000",
    "10000",
    "15000",
    "20000",
    "25000",
    "30000",
    "40000",
    "50000",
    "60000",
    "75000",
    "100000",
    "125000",
    "150000",
    "200000",
  ];
  return mileageRanges;
};

// Sorting options
const SORTING_OPTIONS = [
  { value: "price_low", label: "Price: Low to High" },
  { value: "price_high", label: "Price: High to Low" },
  { value: "mileage_low", label: "Mileage: Low to High" },
  { value: "mileage_high", label: "Mileage: High to Low" },
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "nearest_first", label: "Nearest First" },
];

const YEAR_OPTIONS = generateYearOptions();
const MILEAGE_OPTIONS = generateMileageOptions();

interface FilterSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  isOpen: boolean;
  onToggle: () => void;
}

const FilterSection = ({
  title,
  children,
  defaultOpen = false,
  isOpen,
  onToggle,
}: FilterSectionProps) => {
  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
        <h3 className="font-medium text-blue-800">{title}</h3>
        <Filter
          className={`h-4 w-4 text-blue-600 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="px-3 pt-3 pb-2">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
};

export default function VehiclePage() {
  const searchState = useHeroSectionSearch();
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
    fromYear,
    toYear,
    maxMileage,
    minMileage,
    vehicleCondition,
    setSearch,
  } = searchState;

  const { toast } = useToast();
  const { vehicles, setVehicles } = useVehicleLists();

  const limit = 6;
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalVehicles, setTotalVehicles] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState("newest");

  // Add state to track which filter sections are open
  const [openSections, setOpenSections] = useState({
    location: true,
    priceRange: true,
    makeModel: false,
    vehicleSpecs: false,
    yearRange: false,
    mileageRange: false,
    other: false,
  });

  const debouncedColor = useDebounce(color);
  const debouncedPostalCode = useDebounce(postalCode);

  console.log(debouncedColor);

  // Build search parameters more cleanly
  const buildSearchParams = () => {
    const params = new URLSearchParams();
    params.set("page", page.toString());
    params.set("limit", limit.toString());

    if (sortBy) {
      params.set("sortBy", sortBy);
    }

    const filterMap = {
      brand,
      model,
      minBudget: minBudget > 0 ? minBudget.toString() : "",
      maxBudget: maxBudget > 0 ? maxBudget.toString() : "",
      type: vehicleType,
      color: debouncedColor,
      transmissionType,
      fuelType,
      latitude: latitude && longitude ? latitude : "",
      longitude: latitude && longitude ? longitude : "",
      distance: latitude && longitude && distance ? distance : "",
      fromYear,
      toYear,
      maxMileage: maxMileage > 0 ? maxMileage.toString() : "",
      minMileage: minMileage > 0 ? minMileage.toString() : "",
      vehicleCondition:
        vehicleCondition && vehicleCondition.toUpperCase() !== "ANY"
          ? vehicleCondition
          : "",
    };

    Object.entries(filterMap).forEach(([key, value]) => {
      if (value && value !== "All") {
        params.append(key, value);
      }
    });

    return params.toString();
  };

  // Toggle function for filter sections
  const toggleSection = (sectionKey: keyof typeof openSections) => {
    setOpenSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        const searchParams = buildSearchParams();
        const res: any = await getVehicles(searchParams);
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
    minBudget,
    maxBudget,
    vehicleType,
    transmissionType,
    fuelType,
    debouncedColor,
    latitude,
    longitude,
    distance,
    fromYear,
    toYear,
    maxMileage,
    minMileage,
    sortBy,
    vehicleCondition,
  ]);

  useEffect(() => {
    async function fetch() {
      try {
        if (!debouncedPostalCode) return;
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
  }, [debouncedPostalCode]);

  const clearAllFilters = () => {
    setSearch({
      minBudget: 0,
      maxBudget: 0,
      brand: "",
      model: "",
      vehicleType: "",
      transmissionType: "",
      fuelType: "",
      color: "",
      fromYear: "",
      toYear: "",
      maxMileage: 0,
      minMileage: 0,
      postalCode: "",
      distance: "National",
      vehicleCondition: "",
    });
    setSortBy("relevance");
  };

  const handleSortChange = (newSortBy: string) => {
    setSortBy(newSortBy);
    setPage(1); // Reset to first page when sorting changes
  };

  // Memoize the FilterSidebar to prevent unnecessary re-renders
  const FilterSidebar = useMemo(() => (
    <div
      className={`${showFilters ? "fixed inset-0 z-50 bg-white" : "w-80"} ${
        showFilters ? "overflow-y-auto" : ""
      } p-6 border-r`}
    >
      {showFilters && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-blue-600">Filters</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(false)}
            className="border-blue-200"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="space-y-4">
        <FilterSection 
          title="Location" 
          isOpen={openSections.location}
          onToggle={() => toggleSection('location')}
        >
          <div className="flex gap-2">
            <div className="w-1/2">
              <Input
                type="text"
                placeholder="Postal Code"
                className="border-blue-200 focus:ring-blue-500"
                value={postalCode}
                onChange={(e) => {
                  console.log(e.target.value);
                  setSearch({ postalCode: e.target.value });
                }}
              />
            </div>
            <div className="w-1/2">
              <Select
                value={distance}
                disabled={!latitude}
                onValueChange={(val) => setSearch({ distance: val })}
              >
                <SelectTrigger className="border-blue-200 focus:ring-blue-500">
                  <SelectValue placeholder="Distance" />
                </SelectTrigger>
                <SelectContent>
                  {DISTANCES.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </FilterSection>

        <FilterSection 
          title="Price Range" 
          isOpen={openSections.priceRange}
          onToggle={() => toggleSection('priceRange')}
        >
          <div className="space-y-3">
            <div>
              <label className="text-sm text-blue-600 mb-1 block">
                Min Budget
              </label>
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9,]*"
                placeholder="Min Budget"
                className="border-blue-200 focus:ring-blue-500"
                value={minBudget > 0 ? minBudget.toLocaleString() : ""}
                onChange={(e) => {
                  const rawValue = e.target.value
                    .replace(/,/g, "")
                    .replace(/\D/g, "");
                  const numValue = Number(rawValue);
                  setSearch({ minBudget: rawValue === "" ? 0 : numValue });
                }}
              />
            </div>
            <div>
              <label className="text-sm text-blue-600 mb-1 block">
                Max Budget
              </label>
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9,]*"
                placeholder="Max Budget"
                className="border-blue-200 focus:ring-blue-500"
                value={maxBudget > 0 ? maxBudget.toLocaleString() : ""}
                onChange={(e) => {
                  const rawValue = e.target.value
                    .replace(/,/g, "")
                    .replace(/\D/g, "");
                  const numValue = Number(rawValue);
                  setSearch({ maxBudget: rawValue === "" ? 0 : numValue });
                }}
              />
            </div>
          </div>
        </FilterSection>

        <FilterSection 
          title="Make & Model"
          isOpen={openSections.makeModel}
          onToggle={() => toggleSection('makeModel')}
        >
          <div className="space-y-3">
            <Select
              value={brand}
              onValueChange={(value) =>
                setSearch({
                  brand: value,
                  model: value === "All" ? "" : model,
                })
              }
            >
              <SelectTrigger className="border-blue-200 focus:ring-blue-500">
                <SelectValue placeholder="Select Make" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Makes</SelectItem>
                {ALL_MAKE.map((make) => (
                  <SelectItem key={make} value={make}>
                    {make}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={model}
              disabled={!brand || brand === "All"}
              onValueChange={(value) => setSearch({ model: value })}
            >
              <SelectTrigger className="border-blue-200 focus:ring-blue-500">
                <SelectValue placeholder="Select Model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Models</SelectItem>
                {MAKE_MODEL_MAP[brand]?.map((model) => (
                  <SelectItem key={model} value={model}>
                    {model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </FilterSection>

        <FilterSection 
          title="Vehicle Specifications"
          isOpen={openSections.vehicleSpecs}
          onToggle={() => toggleSection('vehicleSpecs')}
        >
          <div className="space-y-3">
            <Select
              value={vehicleType}
              onValueChange={(value) => setSearch({ vehicleType: value })}
            >
              <SelectTrigger className="border-blue-200 focus:ring-blue-500">
                <SelectValue placeholder="Vehicle Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">Any Type</SelectItem>
                {vehicleTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={transmissionType}
              onValueChange={(value) => setSearch({ transmissionType: value })}
            >
              <SelectTrigger className="border-blue-200 focus:ring-blue-500">
                <SelectValue placeholder="Transmission" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">Any Transmission</SelectItem>
                {vehicleType &&
                  vehicleTransmissionsTypes[
                    vehicleType as keyof typeof vehicleTransmissionsTypes
                  ]?.map((transmission: string) => (
                    <SelectItem key={transmission} value={transmission}>
                      {transmission}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            <Select
              value={fuelType}
              onValueChange={(value) => setSearch({ fuelType: value })}
            >
              <SelectTrigger className="border-blue-200 focus:ring-blue-500">
                <SelectValue placeholder="Fuel Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">Any Fuel</SelectItem>
                {vehicleType &&
                  vehicleFuelTypes[
                    vehicleType as keyof typeof vehicleFuelTypes
                  ]?.map((fuel: string) => (
                    <SelectItem key={fuel} value={fuel}>
                      {fuel}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </FilterSection>

        <FilterSection 
          title="Year Range"
          isOpen={openSections.yearRange}
          onToggle={() => toggleSection('yearRange')}
        >
          <div className="space-y-3">
            <div>
              <label className="text-sm text-blue-600 mb-1 block">
                From Year
              </label>
              <Select
                value={fromYear}
                onValueChange={(value) => setSearch({ fromYear: value })}
              >
                <SelectTrigger className="border-blue-200 focus:ring-blue-500">
                  <SelectValue placeholder="From Year" />
                </SelectTrigger>
                <SelectContent>
                  {YEAR_OPTIONS.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-blue-600 mb-1 block">
                To Year
              </label>
              <Select
                value={toYear}
                onValueChange={(value) => setSearch({ toYear: value })}
              >
                <SelectTrigger className="border-blue-200 focus:ring-blue-500">
                  <SelectValue placeholder="To Year" />
                </SelectTrigger>
                <SelectContent>
                  {YEAR_OPTIONS.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </FilterSection>

        <FilterSection 
          title="Mileage Range"
          isOpen={openSections.mileageRange}
          onToggle={() => toggleSection('mileageRange')}
        >
          <div className="space-y-3">
            <div>
              <label className="text-sm text-blue-600 mb-1 block">
                Min Mileage
              </label>
              <Select
                value={minMileage > 0 ? minMileage.toString() : ""}
                onValueChange={(value) =>
                  setSearch({ minMileage: value ? Number(value) : 0 })
                }
              >
                <SelectTrigger className="border-blue-200 focus:ring-blue-500">
                  <SelectValue placeholder="Min Mileage" />
                </SelectTrigger>
                <SelectContent>
                  {MILEAGE_OPTIONS.map((mileage) => (
                    <SelectItem key={mileage} value={mileage}>
                      {Number(mileage).toLocaleString()} miles
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-blue-600 mb-1 block">
                Max Mileage
              </label>
              <Select
                value={maxMileage > 0 ? maxMileage.toString() : ""}
                onValueChange={(value) =>
                  setSearch({ maxMileage: value ? Number(value) : 0 })
                }
              >
                <SelectTrigger className="border-blue-200 focus:ring-blue-500">
                  <SelectValue placeholder="Max Mileage" />
                </SelectTrigger>
                <SelectContent>
                  {MILEAGE_OPTIONS.map((mileage) => (
                    <SelectItem key={mileage} value={mileage}>
                      {Number(mileage).toLocaleString()} miles
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </FilterSection>

        <FilterSection 
          title="Other"
          isOpen={openSections.other}
          onToggle={() => toggleSection('other')}
        >
          <div className="space-y-3">
            <div className="w-1/2">
              <Input
                type="text"
                placeholder="Color"
                className="border-blue-200 focus:ring-blue-500"
                value={color}
                onChange={(e) => setSearch({ color: e.target.value })}
              />
            </div>
            <div className="">
              <Select
                value={vehicleCondition}
                onValueChange={(val) => setSearch({ vehicleCondition: val })}
              >
                <SelectTrigger className="border-blue-200 focus:ring-blue-500">
                  <SelectValue placeholder="Vehicle Condition" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="ANY">Any</SelectItem>
                  {vehicleConditions.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </FilterSection>

        <div className="space-y-2 pt-4">
          <Button
            variant="outline"
            className="w-full border-blue-200 text-blue-700 hover:bg-blue-50"
            onClick={clearAllFilters}
          >
            Clear All Filters
          </Button>
          {showFilters && (
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={() => setShowFilters(false)}
            >
              Apply Filters
            </Button>
          )}
        </div>
      </div>
    </div>
  ), [
    showFilters,
    openSections,
    postalCode,
    latitude,
    distance,
    minBudget,
    maxBudget,
    brand,
    model,
    vehicleType,
    transmissionType,
    fuelType,
    fromYear,
    toYear,
    minMileage,
    maxMileage,
    color,
    vehicleCondition
  ]);

  return (
    <div className="flex min-h-screen">
      {/* Mobile Filter Button */}
      <div className="lg:hidden fixed bottom-4 right-4 z-40">
        <Button
          onClick={() => setShowFilters(true)}
          className="bg-blue-600 hover:bg-blue-700 rounded-full p-4 shadow-lg"
        >
          <Filter className="h-5 w-5" />
        </Button>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        {FilterSidebar}
      </div>

      {/* Mobile Overlay */}
      {showFilters && (
        <div className="lg:hidden">
          {FilterSidebar}
        </div>
      )}

      {/* Main Content */}
      {isLoading ? (
        <div className="w-full p-4 flex flex-col gap-4">
          <Skeleton className="w-[90%] h-16 bg-blue-100" />
          <Skeleton className="w-full h-16 bg-blue-100" />
          <Skeleton className="w-full h-16 bg-blue-100" />
          <Skeleton className="w-full h-16 bg-blue-100" />
        </div>
      ) : (
        <div className="flex-1 p-6">
          {/* Sort Section */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-blue-100">
            <div className="text-sm text-blue-600">
              Showing {vehicles.length} of {totalVehicles} vehicles
            </div>
            <div className="flex items-center gap-3">
              <ArrowUpDown className="h-4 w-4 text-blue-600" />
              <Select value={sortBy} onValueChange={handleSortChange}>
                <SelectTrigger className="w-48 border-blue-200 focus:ring-blue-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORTING_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.length === 0 ? (
              <Alert className="border-blue-200 bg-blue-50 w-full col-span-full mb-4">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-700">0 results</AlertTitle>
                <AlertDescription className="text-blue-600">
                  No Vehicles Found!
                </AlertDescription>
              </Alert>
            ) : (
              vehicles.map((vehicle: any) => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} />
              ))
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