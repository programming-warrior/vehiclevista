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
import { useLocation } from "wouter";
import { ALL_MAKE, MAKE_MODEL_MAP } from "@/lib/constants";
import { vehicleConditions, vehicleTypes } from "@shared/schema";
import {
  vehicleTransmissionsTypes,
  vehicleFuelTypes,
} from "@shared/zodSchema/vehicleSchema";

export default function HeroSection() {
  // Define complete form validation schema with Zod
  const formSchema = z
    .object({
      brand: z.string(),
      model: z.string(),
      type: z.string(),
      transmissionType: z.string(),
      minBudget: z.coerce.number(),
      maxBudget: z.coerce.number(),
    })
    .refine((data) => data.minBudget <= data.maxBudget, {
      message: "Minimum budget must be less than maximum budget",
      path: ["minBudget"],
    });

  const [, setLocation] = useLocation();
  // Set up form with react-hook-form and zod resolver
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      brand: "",
      model: "",
      type: "",
      color: "",
      transmissionType: "",
      minBudget: 0,
      maxBudget: 0,
    },
  });

  const { setSearch } = useHeroSectionSearch();

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    console.log("Search with parameters:", data);
    setSearch({ color: "", fuelType: "",  ...data });
    setLocation("/vehicle");
  };

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
          <div className="bg-white rounded-3xl p-8 shadow-lg">
            <h2 className="text-2xl font-semibold mb-6">
              Find your vehicle with quick finder
            </h2>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <div className="grid grid-cols-2 gap-4">
                  {/* Brand Select */}
                  <FormField
                    control={form.control}
                    name="brand"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
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
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Model Select */}
                  <FormField
                    control={form.control}
                    name="model"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Select
                            value={field.value}
                            disabled={!form.getValues("brand")}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger className="border-blue-200 focus:ring-blue-500 focus:border-blue-500">
                              <SelectValue placeholder="Model" />
                            </SelectTrigger>

                            <SelectContent>
                              <SelectItem value="All">All</SelectItem>
                              {MAKE_MODEL_MAP[form.getValues("brand")]?.length >
                                0 &&
                                MAKE_MODEL_MAP[
                                  form.getValues("brand") as string
                                ].map((m) => {
                                  return <SelectItem value={m}>{m}</SelectItem>;
                                })}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Variant Select */}
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
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
                                      .map((ch, i) =>
                                        i == 0 ? ch.toUpperCase() : ch
                                      )
                                      .join("")}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="transmissionType"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <SelectTrigger className="border-blue-200 focus:ring-blue-500 focus:border-blue-500">
                              <SelectValue placeholder="Select transmission type" />
                            </SelectTrigger>
                            <SelectContent className="border-blue-200">
                              <SelectItem value="All">All</SelectItem>
                              {form.getValues("type") &&
                                vehicleTransmissionsTypes[
                                  form.getValues(
                                    "type"
                                  ) as keyof typeof vehicleTransmissionsTypes
                                ] &&
                                vehicleTransmissionsTypes[
                                  form.getValues(
                                    "type"
                                  ) as keyof typeof vehicleTransmissionsTypes
                                ].map((transmission: string) => (
                                  <SelectItem
                                    key={transmission}
                                    value={transmission}
                                  >
                                    {transmission}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Budget Range Inputs */}
                  <div className="col-span-full">
                    <Label className="text-[14px]">Budget</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="minBudget"
                        render={({ field }) => (
                          <FormItem>
                            <Label className="text-xs text-gray-500">Min</Label>
                            <FormControl>
                              <Input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9,]*"
                                placeholder="Min"
                                className="pl-10 border-blue-200 focus:ring-blue-500"
                                value={
                                  field.value > 0
                                    ? field.value.toLocaleString()
                                    : ""
                                }
                                onChange={(e) => {
                                  const rawValue = e.target.value
                                    .replace(/,/g, "")
                                    .replace(/\D/g, "");
                                  const numValue = Number(rawValue);
                                  field.onChange(numValue)
                                }}
                              />
                            </FormControl>
                            <FormMessage className="text-xs text-red-500" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="maxBudget"
                        render={({ field }) => (
                          <FormItem>
                            <Label className="text-xs text-gray-500">Max</Label>
                            <FormControl>
                               <Input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9,]*"
                                placeholder="Max"
                                className="pl-10 border-blue-200 focus:ring-blue-500"
                                value={
                                  field.value > 0
                                    ? field.value.toLocaleString()
                                    : ""
                                }
                                onChange={(e) => {
                                  const rawValue = e.target.value
                                    .replace(/,/g, "")
                                    .replace(/\D/g, "");
                                  const numValue = Number(rawValue);
                                  field.onChange(numValue)
                                }}
                              />
                            </FormControl>
                            <FormMessage className="text-xs text-red-500" />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full mt-6 h-12 bg-blue-600 hover:bg-blue-700 text-white text-lg"
                >
                  Search
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}
