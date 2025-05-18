import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, addHours } from "date-fns";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils"; // utility for tailwind class merging
import { 
  CalendarIcon, 
  ClockIcon, 
  Car, 
  Bike,
  DollarSign, 
  Info, 
  Tag, 
  MapPin, 
  Calendar as CalendarIconOutline,
  Check,
  AlertCircle
} from "lucide-react";
import { getSellerVehicleListings, createAuction } from "@/api";
import { useToast } from "@/hooks/use-toast";

// Create a schema for time selection
const timeSchema = z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
  message: "Please provide a valid time in 24-hour format (HH:MM)",
});

// Extend the form schema with new requirements
const formSchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    description: z.string().min(1, "Description is required"),
    vehicleId: z.string().min(1, "Please select a vehicle"),
    startingPrice: z.number().min(1, "Reserve price must be greater than 0"),
    startDate: z.date({
      required_error: "Start date is required",
    }),
    startTime: timeSchema,
    endDate: z.date({
      required_error: "End date is required",
    }),
    endTime: timeSchema,
  })
  .superRefine((data, ctx) => {
   
    const now = new Date();

    const startDateTime = new Date(
      data.startDate.getFullYear(),
      data.startDate.getMonth(),
      data.startDate.getDate(),
      parseInt(data.startTime.split(":")[0]),
      parseInt(data.startTime.split(":")[1])
    );

    const endDateTime = new Date(
      data.endDate.getFullYear(),
      data.endDate.getMonth(),
      data.endDate.getDate(),
      parseInt(data.endTime.split(":")[0]),
      parseInt(data.endTime.split(":")[1])
    );

    // Validate start time is not in the past
    if (startDateTime < now) {
      ctx.addIssue({
        path: ["startTime"],
        code: z.ZodIssueCode.custom,
        message: "Auction start time cannot be in the past",
      });
    }

    // Validate end time is after start time
    if (endDateTime <= startDateTime) {
      ctx.addIssue({
        path: ["endTime"],
        code: z.ZodIssueCode.custom,
        message: "Auction end time must be after start time",
      });
    }
  });


export default function AuctionForm() {
  const [vehicles, setVehicles] = useState<any>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  
  // Setup form with default values
  const now = new Date();
  const oneHourLater = addHours(now, 1);
  const oneDayLater = addHours(now, 24);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      vehicleId: "",
      startingPrice: 0,
      startDate: now,
      startTime: format(oneHourLater, "HH:mm"),
      endDate: now,
      endTime: format(oneDayLater, "HH:mm"),
      description: "",
      title: "",
    },
  });

  // Fetch seller's vehicles
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        setLoading(true);
        const response = await getSellerVehicleListings("");
        setVehicles(response.vehicles.filter((v:any) => v.listingStatus === "ACTIVE"));
      } catch (error) {
        console.error("Error fetching seller vehicles:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch your vehicles. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, [toast]);

  // Handle vehicle selection to show details
  const handleVehicleSelect = (vehicleId:string) => {
    const vehicle = vehicles.find((v:any) => v.id === parseInt(vehicleId));
    setSelectedVehicle(vehicle);
  };

  const onSubmit = async (values:any) => {
    // Create proper datetime objects
    const startDateTime = new Date(
      values.startDate.getFullYear(),
      values.startDate.getMonth(),
      values.startDate.getDate(),
      parseInt(values.startTime.split(":")[0]),
      parseInt(values.startTime.split(":")[1])
    );

    const endDateTime = new Date(
      values.endDate.getFullYear(),
      values.endDate.getMonth(),
      values.endDate.getDate(),
      parseInt(values.endTime.split(":")[0]),
      parseInt(values.endTime.split(":")[1])
    );

    // Format data for submission
    const auctionData = {
      vehicleId: values.vehicleId,
      startDate: format(startDateTime, "yyyy-MM-dd'T'HH:mm:ss"),
      endDate: format(endDateTime, "yyyy-MM-dd'T'HH:mm:ss"),
      startingPrice: values.startingPrice,
      description: values.description,
      title: values.title,
    };

    try {
      setUploading(true);
      await createAuction(auctionData);
      toast({
        title: "Success",
        description: "Your auction has been created successfully!",
        className: "bg-blue-50 border-blue-200",
      });
      form.reset();
      setSelectedVehicle(null);
    } catch (e:any) {
      toast({
        variant: "destructive",
        title: "Failed to create auction",
        description: e.message || "Something went wrong. Please try again.",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto my-8 p-6 rounded-xl shadow-lg border bg-white">
      <div className="flex items-center mb-8 pb-4 border-b border-blue-100">
        <div className="bg-blue-600 p-3 rounded-full mr-4">
          <CalendarIconOutline className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-blue-900">Create New Auction</h2>
          <p className="text-gray-500">List your vehicle for auction and set your terms</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left column - Vehicle selection */}
            <div className="lg:col-span-1">
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <h3 className="text-lg font-medium text-blue-800 flex items-center mb-2">
                  <Car className="h-5 w-5 mr-2" />
                  Select Your Vehicle
                </h3>
                <p className="text-sm text-gray-600 mb-4">Choose a vehicle from your active listings to auction</p>

                <FormField
                  control={form.control}
                  name="vehicleId"
                  render={({ field }) => (
                    <FormItem>
                      <Select
                        disabled={loading}
                        onValueChange={(value) => {
                          field.onChange(value);
                          handleVehicleSelect(value);
                        }}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-white border-blue-200 focus:ring-blue-500">
                            <SelectValue placeholder="Select a vehicle" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {loading ? (
                            <SelectItem value="loading" disabled>
                              Loading vehicles...
                            </SelectItem>
                          ) : vehicles.length > 0 ? (
                            vehicles.map((vehicle:any) => (
                              <SelectItem
                                key={vehicle.id}
                                value={vehicle.id.toString()}
                              >
                                <div className="flex items-center">
                                  {vehicle.type === "car" ? 
                                    <Car className="h-4 w-4 mr-2 text-blue-600" /> : 
                                    <Bike className="h-4 w-4 mr-2 text-blue-600" />
                                  }
                                  {vehicle.make} {vehicle.model} ({vehicle.year})
                                </div>
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-vehicles" disabled>
                              No active vehicles found
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-red-500" />
                    </FormItem>
                  )}
                />
              </div>

              {selectedVehicle && (
                <Card className="border-blue-100 shadow-md overflow-hidden">
                  {selectedVehicle.images && selectedVehicle.images.length > 0 && (
                    <div className="h-40 overflow-hidden">
                      <img 
                        src={selectedVehicle.images[0]} 
                        alt={`${selectedVehicle.make} ${selectedVehicle.model}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardContent className="p-4">
                    <h4 className="text-lg font-medium text-blue-800 mb-3">
                      {selectedVehicle.make} {selectedVehicle.model}
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center text-gray-700">
                        <CalendarIconOutline className="h-4 w-4 mr-1 text-blue-600" />
                        <span>{selectedVehicle.year}</span>
                      </div>
                      <div className="flex items-center text-gray-700">
                        <Tag className="h-4 w-4 mr-1 text-blue-600" />
                        <span>{selectedVehicle.type}</span>
                      </div>
                      <div className="flex items-center text-gray-700">
                        <Info className="h-4 w-4 mr-1 text-blue-600" />
                        <span>{selectedVehicle.mileage} km</span>
                      </div>
                      <div className="flex items-center text-gray-700">
                        <MapPin className="h-4 w-4 mr-1 text-blue-600" />
                        <span>{selectedVehicle.location}</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-3 border-t border-blue-50">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Current Price</span>
                        <span className="text-lg font-semibold text-blue-800">₹{selectedVehicle.price.toLocaleString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {!selectedVehicle && !loading && (
                <div className="border border-dashed border-blue-200 rounded-lg p-6 text-center">
                  <Car className="h-12 w-12 mx-auto text-blue-300 mb-3" />
                  <p className="text-gray-500">Select a vehicle to see details</p>
                </div>
              )}
            </div>

            {/* Right column - Auction details */}
            <div className="lg:col-span-2 bg-white rounded-xl">
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <h3 className="text-lg font-medium text-blue-800 flex items-center">
                  <Info className="h-5 w-5 mr-2" />
                  Auction Details
                </h3>
                <p className="text-sm text-gray-600">Set the title, timeframe and pricing for your auction</p>
              </div>

              <div className="space-y-6">
                {/* Title */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-blue-800">Auction Title</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          className="border-blue-200 focus:ring-blue-500"
                          placeholder="Enter an attractive title for your auction..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-red-500" />
                    </FormItem>
                  )}
                />

                {/* Reserve Price */}
                <FormField
                  control={form.control}
                  name="startingPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-blue-800">Reserve Price (₹)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            className="pl-10 border-blue-200 focus:ring-blue-500"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </div>
                      </FormControl>
                      <p className="text-xs text-gray-500 mt-1">
                        Minimum price you're willing to accept for this vehicle
                      </p>
                      <FormMessage className="text-red-500" />
                    </FormItem>
                  )}
                />

                {/* Auction Timeframe */}
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="text-md font-medium text-blue-800 mb-4">Auction Timeframe</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Start Date and Time */}
                    <div className="space-y-4">
                      <h5 className="text-sm font-medium text-blue-700">Start</h5>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <FormField
                          control={form.control}
                          name="startDate"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      className="w-full border-blue-200 bg-white text-left font-normal flex justify-between"
                                    >
                                      {field.value
                                        ? format(field.value, "MMM dd, yyyy")
                                        : "Select date"}
                                      <CalendarIcon className="ml-auto h-4 w-4 text-blue-500" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) => {
                                      const today = new Date();
                                      return date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
                                    }}
                                    initialFocus
                                    className="border-blue-100"
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage className="text-red-500" />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="startTime"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <div className="relative">
                                  <Input type="time" className="border-blue-200 focus:ring-blue-500" {...field} />
                                  <ClockIcon className="absolute right-3 top-2.5 h-4 w-4 text-gray-500 pointer-events-none" />
                                </div>
                              </FormControl>
                              <FormMessage className="text-red-500" />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* End Date and Time */}
                    <div className="space-y-4">
                      <h5 className="text-sm font-medium text-blue-700">End</h5>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <FormField
                          control={form.control}
                          name="endDate"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      className="w-full border-blue-200 bg-white text-left font-normal flex justify-between"
                                    >
                                      {field.value
                                        ? format(field.value, "MMM dd, yyyy")
                                        : "Select date"}
                                      <CalendarIcon className="ml-auto h-4 w-4 text-blue-500" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) => {
                                      const today = new Date();
                                      return date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
                                    }}
                                    initialFocus
                                    className="border-blue-100"
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage className="text-red-500" />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="endTime"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <div className="relative">
                                  <Input type="time" className="border-blue-200 focus:ring-blue-500" {...field} />
                                  <ClockIcon className="absolute right-3 top-2.5 h-4 w-4 text-gray-500 pointer-events-none" />
                                </div>
                              </FormControl>
                              <FormMessage className="text-red-500" />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-blue-800">Auction Description</FormLabel>
                      <FormControl>
                        <textarea
                          className="w-full min-h-32 rounded-md border border-blue-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Describe your vehicle, highlight special features, and provide any additional information buyers should know..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-red-500" />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-blue-100">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-500 flex items-center">
                <AlertCircle className="h-4 w-4 mr-2 text-blue-500" />
                Once created, your auction will be visible to all buyers
              </div>
              <div className="flex items-center gap-4">
                <Button type="button" variant="outline" className="border-blue-200 text-blue-800">
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={uploading}
                  className="bg-blue-600 hover:bg-blue-700 text-white flex items-center"
                >
                  {uploading ? (
                    <>Creating...</>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Create Auction
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}