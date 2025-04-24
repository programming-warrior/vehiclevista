import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, addHours } from "date-fns";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
import { CalendarIcon, ClockIcon } from "lucide-react";
import { getSellerVehicleListings, createAuction } from "@/api";
import { useToast } from "@/hooks/use-toast";

// Create a schema for time selection
const timeSchema = z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
  message: "Please provide a valid time in 24-hour format (HH:MM)",
});

// Extend the form schema with new requirements
const formSchema = z
  .object({
    title: z.string().min(1, "title is required"),
    description: z.string().min(1, "description"),
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
    // Create date objects for validation
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

type AuctionFormValues = z.infer<typeof formSchema>;

export default function AuctionForm() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  // Setup form with default values
  const now = new Date();
  const oneHourLater = addHours(now, 1);
  const oneDayLater = addHours(now, 24);

  const form = useForm<AuctionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      vehicleId: "",
      startingPrice: 0,
      startDate: now,
      startTime: format(oneHourLater, "HH:mm"),
      endDate: now,
      endTime: format(oneDayLater, "HH:mm"),
      description: "",
    },
  });

  // Fetch seller's vehicles
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        setLoading(true);
        const response = await getSellerVehicleListings("");
        setVehicles(response.vehicles);
      } catch (error) {
        console.error("Error fetching seller vehicles:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, []);

  // Handle vehicle selection to show details
  const handleVehicleSelect = (vehicleId: any) => {
    console.log(vehicleId);
    const vehicle = vehicles.find((v: any) => v.id === parseInt(vehicleId));
    console.log(vehicle);
    setSelectedVehicle(vehicle);
  };

  const onSubmit = async (values: AuctionFormValues) => {
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
      startDate: startDateTime.toISOString(),
      endDate: endDateTime.toISOString(),
      startingPrice: values.startingPrice,
      description: values.description,
      title: values. title,
    };

    console.log("Auction Created:", auctionData);
    try {
      setUploading(true);
      await createAuction(auctionData);
      toast({
        title: "Success",
        description: "Auction created successfully",
      });
    } catch (e: any) {
      console.log(e);
      toast({
        variant: "destructive",
        title: "Failure",
        description: e.messge || "Something went wrong",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-8 p-6 rounded-2xl shadow-md border bg-white">
      <h2 className="text-2xl font-bold mb-6">Create Auction</h2>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left column - Vehicle selection */}
            <div className="md:col-span-1">
              <h3 className="text-lg font-medium mb-4">Select Vehicle</h3>

              <FormField
                control={form.control}
                name="vehicleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Choose a vehicle</FormLabel>
                    <Select
                      disabled={loading}
                      onValueChange={(value) => {
                        field.onChange(value);
                        handleVehicleSelect(value);
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a vehicle" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {loading ? (
                          <SelectItem value="loading" disabled>
                            Loading vehicles...
                          </SelectItem>
                        ) : (
                          vehicles.map((vehicle: any) => (
                            <SelectItem
                              key={vehicle.id}
                              value={vehicle.id.toString()}
                            >
                              {vehicle.make} {vehicle.model}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedVehicle && (
                <Card className="mt-4">
                  <CardContent className="pt-4">
                    <h4 className="text-sm font-medium mb-2">
                      Vehicle Details
                    </h4>
                    <div className="text-sm space-y-1">
                      <p>
                        <span className="font-medium">Make:</span>{" "}
                        {selectedVehicle.make}
                      </p>
                      <p>
                        <span className="font-medium">Model:</span>{" "}
                        {selectedVehicle.model}
                      </p>
                      <p>
                        <span className="font-medium">Year:</span>{" "}
                        {selectedVehicle.year}
                      </p>
                      <p>
                        <span className="font-medium">Mileage:</span>{" "}
                        {selectedVehicle.mileage} miles
                      </p>
                      <p>
                        <span className="font-medium">Current Price:</span> $
                        {selectedVehicle.price}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right column - Auction details */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-medium mb-4">Auction Details</h3>

              {/* Reserve Price */}
              <FormField
                control={form.control}
                name="startingPrice"
                render={({ field }) => (
                  <FormItem className="mb-4">
                    <FormLabel>Reserve Price ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value))
                        }
                      />
                    </FormControl>
                    <p className="text-xs text-gray-500 mt-1">
                      Minimum price you're willing to accept
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Auction Start Date and Time */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Start Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full text-left font-normal flex justify-between",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value
                                ? format(field.value, "PPP")
                                : "Select date"}
                              <CalendarIcon className="ml-auto h-4 w-4" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input type="time" {...field} />
                          <ClockIcon className="absolute right-3 top-2.5 h-4 w-4 text-gray-500 pointer-events-none" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Auction End Date and Time */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>End Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full text-left font-normal flex justify-between",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value
                                ? format(field.value, "PPP")
                                : "Select date"}
                              <CalendarIcon className="ml-auto h-4 w-4" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input type="time" {...field} />
                          <ClockIcon className="absolute right-3 top-2.5 h-4 w-4 text-gray-500 pointer-events-none" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

                {/* Title */}
                <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Auction Title</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        className="flex  w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Add title for your auction..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Auction Description </FormLabel>
                    <FormControl>
                      <textarea
                        className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Add additional details about your auction..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <Button type="button" variant="outline">
              Cancel
            </Button>
            <Button type="submit" disabled={uploading}>
              {uploading ? "Creating..." : "Create Auction"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
