import React, { useState, useMemo, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Filter, X, ArrowUpDown, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import LiveAuctionSection from "@/components/live-auction-section";
import { create } from "zustand";
import { ALL_MAKE, MAKE_MODEL_MAP } from "@/lib/constants";
import { getActiveAuctions } from "@/api"; // Import the API function
import { useAuctionFilterStore } from "@/hooks/use-store";
import AuctionCard from "@/components/auction-card";
import { Link } from "wouter";

// --- Constants ---
const ITEM_TYPES = ["VEHICLE", "NUMBER_PLATE"];
const VEHICLE_AUCTION_TYPES = ["CAR", "BIKE", "VAN"];
const SORTING_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "price_low_to_high", label: "Price: Low to High" },
  { value: "price_high_to_low", label: "Price: High to Low" },
  { value: "ending_soon", label: "Ending Soon" },
  { value: "most_bids", label: "Most Bids" },
];

// --- Filter Section Component ---
const FilterSection = ({
  title,
  children,
  isOpen,
  onToggle,
}: {
  title: string;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}) => (
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

// --- Main Auction Page Component ---
export default function AuctionPage() {
  const {
    itemType,
    vehicleAuctionType,
    make,
    model,
    minPrice,
    maxPrice,
    sortBy,
    setFilters,
    clearFilters,
  } = useAuctionFilterStore();

  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalAuctions, setTotalAuctions] = useState(0);
  const [auctions, setAuctions] = useState([]);

  const [openSections, setOpenSections] = useState({
    itemType: true,
    price: true,
    makeModel: false,
  });

  const limit = 12; // Items per page

  // Fetch auctions when filters or page change
  useEffect(() => {
    const fetchAuctions = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
          itemType,
          sortBy,
        });
        if (vehicleAuctionType) params.append("type", vehicleAuctionType);
        if (make) params.append("make", make);
        if (model) params.append("model", model);
        if (minPrice > 0) params.append("minPrice", minPrice.toString());
        if (maxPrice > 0) params.append("maxPrice", maxPrice.toString());

        const data = await getActiveAuctions(params.toString());
        setAuctions(data.auctions || []);
        setTotalAuctions(data.totalAuctions || 0);
        setTotalPages(data.totalPages || 0);
      } catch (error) {
        console.error("Failed to fetch auctions:", error);
        setAuctions([]); // Clear auctions on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchAuctions();
  }, [
    page,
    itemType,
    vehicleAuctionType,
    make,
    model,
    minPrice,
    maxPrice,
    sortBy,
  ]);

  // Set initial filters from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setFilters({
      itemType: params.get("itemType") || "VEHICLE",
      vehicleAuctionType: params.get("vehicleAuctionType") || "",
    });
  }, []);

  const toggleSection = (sectionKey: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [sectionKey]: !prev[sectionKey] }));
  };

  const FilterSidebar = useMemo(
    () => (
      <div
        className={`${showFilters ? "fixed inset-0 z-50 bg-white" : "w-80"} ${
          showFilters ? "overflow-y-auto" : ""
        } p-6 border-r border-blue-100`}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-blue-600">Filters</h2>
          {showFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(false)}
              className="border-blue-200"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="space-y-4">
          <FilterSection
            title="Item Type"
            isOpen={openSections.itemType}
            onToggle={() => toggleSection("itemType")}
          >
            <div className="space-y-3">
              <Select
                value={itemType}
                onValueChange={(value) => {
                  setFilters({ itemType: value });
                  setPage(1);
                }}
              >
                <SelectTrigger className="border-blue-200 focus:ring-blue-500">
                  <SelectValue placeholder="Select Item Type" />
                </SelectTrigger>
                <SelectContent>
                  {ITEM_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {itemType === "VEHICLE" && (
                <Select
                  value={vehicleAuctionType}
                  onValueChange={(value) => {
                    setFilters({ vehicleAuctionType: value });
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="border-blue-200 focus:ring-blue-500">
                    <SelectValue placeholder="Select Vehicle Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Vehicles</SelectItem>
                    {VEHICLE_AUCTION_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </FilterSection>

          <FilterSection
            title="Price Range"
            isOpen={openSections.price}
            onToggle={() => toggleSection("price")}
          >
            <div className="space-y-3">
              <div>
                <label className="text-sm text-blue-600 mb-1 block">
                  Min Price
                </label>
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9,]*"
                  placeholder="Min Price"
                  className="border-blue-200 focus:ring-blue-500"
                  value={minPrice > 0 ? minPrice.toLocaleString() : ""}
                  onChange={(e) => {
                    const rawValue = e.target.value
                      .replace(/,/g, "")
                      .replace(/\D/g, "");
                    const numValue = Number(rawValue);
                    setFilters({
                      minPrice: rawValue === "" ? 0 : numValue,
                    });
                  }}
                />
              </div>
              <div>
                <label className="text-sm text-blue-600 mb-1 block">
                  Max Price
                </label>
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9,]*"
                  placeholder="Max Price"
                  className="border-blue-200 focus:ring-blue-500"
                  value={maxPrice > 0 ? maxPrice.toLocaleString() : ""}
                  onChange={(e) => {
                    const rawValue = e.target.value
                      .replace(/,/g, "")
                      .replace(/\D/g, "");
                    const numValue = Number(rawValue);
                    setFilters({
                      maxPrice: rawValue === "" ? 0 : numValue,
                    });
                  }}
                />
              </div>
            </div>
          </FilterSection>

          {itemType === "VEHICLE" && (
            <FilterSection
              title="Make & Model"
              isOpen={openSections.makeModel}
              onToggle={() => toggleSection("makeModel")}
            >
              <div className="space-y-3">
                <Select
                  value={make}
                  onValueChange={(value) =>
                    setFilters({ make: value, model: "" })
                  }
                >
                  <SelectTrigger className="border-blue-200 focus:ring-blue-500">
                    <SelectValue placeholder="Select Make" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Makes</SelectItem>
                    {ALL_MAKE.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={model}
                  disabled={!make || make === "All"}
                  onValueChange={(value) => setFilters({ model: value })}
                >
                  <SelectTrigger className="border-blue-200 focus:ring-blue-500">
                    <SelectValue placeholder="Select Model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Models</SelectItem>
                    {MAKE_MODEL_MAP[make]?.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </FilterSection>
          )}

          <div className="space-y-2 pt-4">
            <Button
              variant="outline"
              className="w-full border-blue-200 text-blue-700 hover:bg-blue-50"
              onClick={() => {
                clearFilters();
                setPage(1);
              }}
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
    ),
    [
      showFilters,
      openSections,
      itemType,
      vehicleAuctionType,
      make,
      model,
      minPrice,
      maxPrice,
      setFilters,
      clearFilters,
    ]
  );

  return (
    <div className="flex min-h-screen bg-white">
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
      <div className="hidden lg:block">{FilterSidebar}</div>

      {/* Mobile Overlay */}
      {showFilters && <div className="lg:hidden">{FilterSidebar}</div>}

      {/* Main Content */}
      <div className="flex-1 p-6">
        {/* Header with Sort */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-blue-100">
          <div className="flex flex-col">
            <h1 className="text-4xl font-bold text-blue-800">Live Auctions</h1>
            {!isLoading && (
              <div className="text-sm text-blue-600 mt-1">
                Showing {auctions.length} of {totalAuctions} auctions
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <ArrowUpDown className="h-4 w-4 text-blue-600" />
            <Select
              value={sortBy}
              onValueChange={(value) => {
                setFilters({ sortBy: value });
                setPage(1);
              }}
            >
              <SelectTrigger className="w-56 border-blue-200 focus:ring-blue-500">
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

        {/* Auction Results */}
        {!isLoading && (
          <section>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {auctions.map((auction: any, idx) => (
                <Link key={auction.id} href={`/auction/${auction.id}`}>
                  {/* Assuming AuctionCard can handle the auction object directly */}
                  <AuctionCard auction={auction} idx={idx} />
                </Link>
              ))}
            </div>
          </section>
        )}

        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-48 w-full bg-blue-100" />
                <Skeleton className="h-4 w-3/4 bg-blue-100" />
                <Skeleton className="h-4 w-1/2 bg-blue-100" />
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="pt-6 flex justify-between items-center bg-blue-50 rounded-lg p-4 mt-6">
            <div className="text-sm text-blue-600">
              Page {page} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-blue-200 hover:bg-blue-100 text-blue-700"
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-blue-200 hover:bg-blue-100 text-blue-700"
                onClick={() =>
                  setPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
