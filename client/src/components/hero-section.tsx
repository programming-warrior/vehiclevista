import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { useHeroSectionSearch } from "@/hooks/use-store";
import { ALL_MAKE, DISTANCES, MAKE_MODEL_MAP } from "@/lib/constants";
import { vehicleConditions, vehicleTypes } from "@shared/schema";
import {
  vehicleTransmissionsTypes,
  vehicleFuelTypes,
} from "@shared/zodSchema/vehicleSchema";
import { useDebounce } from "@/hooks/use-debounce";
import { useEffect, useState } from "react";
import { fetchVehicleCount, validatePostalCode } from "@/api";
import { Loader2 } from "lucide-react";

import QuickVehicleSearch from "./ui/quick-vehicle-search";

export default function HeroSection() {
  // Define complete form validation schema with Zod
  

  

  return (
    <div
      className="relative min-h-[600px] bg-cover bg-center border-none"
      style={{
        backgroundImage:
          'url("https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=2000")',
        backgroundBlendMode: "overlay",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
      }}
    >
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
              Discover The Best Vehicles Near You Through An Exceptional
              Classifieds Experience And Exciting Auctions
            </h1>
            <p className="text-lg text-white/80">
              Find your perfect vehicle with ease through classifieds and
              auctions
            </p>

            {/* Action Buttons */}
            <div className="flex gap-4 mt-8">
              <Button
                variant="secondary"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8"
              >
                Live Auction
              </Button>
              <Button
                variant="secondary"
                className="bg-white/20 hover:bg-white/30 text-white px-8"
              >
                How it works
              </Button>
            </div>
          </div>

          {/* Quick Finder Form */}
          <div className="">
            <QuickVehicleSearch />
          </div>
        </div>
      </div>
    </div>
  );
}
