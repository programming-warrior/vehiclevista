import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, addDays } from "date-fns";
import {
  CalendarIcon,
  ClockIcon,
  Info,
  Check,
  DollarSign,
  MapPin,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils"; // utility for tailwind class merging
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { vehicleUploadSchema } from "@shared/zodSchema/vehicleSchema";
import { useToast } from "@/hooks/use-toast";
import { X, Upload, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { vehicleConditions, vehicleTypes } from "@shared/schema";
import {
  vehicleTransmissionsTypes,
  vehicleFuelTypes,
} from "@shared/zodSchema/vehicleSchema";
import { getPresignedUrls, uploadToPresignedUrl } from "@/api";
import { createRaffle } from "@/api";
import { useDebounce } from "@/hooks/use-debounce";
import { getLocationSuggestion } from "@/api";

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
  message: "Please provide a valid time in 24-hour format (HH:MM)",
});

// Form schema
const raffleFormSchema = z
  .object({
    vehicleId: z.string().optional(),
    title: z.string().min(5, "Title must be at least 5 characters"),
    description: z
      .string()
      .min(10, "Description must be at least 10 characters"),
    startDate: z.date({
      required_error: "Start date is required",
    }),
    startTime: timeSchema,
    endDate: z.date({
      required_error: "End date is required",
    }),
    endTime: timeSchema,
    ticketPrice: z.number().min(1, "Ticket price must be at least 1"),
    ticketQuantity: z.number().int().min(10, "Minimum 10 tickets required"),
    featuredRaffle: z.boolean().default(false),
    earlyBirdDiscount: z.boolean().default(false),
    earlyBirdPrice: z.number().optional(),
    earlyBirdEndDate: z.date().optional(),
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

    // Validate early bird settings if enabled
    if (data.earlyBirdDiscount) {
      if (!data.earlyBirdPrice || data.earlyBirdPrice >= data.ticketPrice) {
        ctx.addIssue({
          path: ["earlyBirdPrice"],
          code: z.ZodIssueCode.custom,
          message: "Early bird price must be less than regular ticket price",
        });
      }

      if (!data.earlyBirdEndDate) {
        ctx.addIssue({
          path: ["earlyBirdEndDate"],
          code: z.ZodIssueCode.custom,
          message: "Early bird end date is required",
        });
      } else if (data.earlyBirdEndDate >= data.endDate) {
        ctx.addIssue({
          path: ["earlyBirdEndDate"],
          code: z.ZodIssueCode.custom,
          message: "Early bird end date must be before raffle end date",
        });
      }
    }
  });

const vehicleFormSchema = z.object({
  type: z.enum(["car", "bike", "truck", "van"], {
    required_error: "Type is required",
  }),
  make: z.string().min(1, { message: "Make is required" }),
  model: z.string().min(1, { message: "Model is required" }),
  registration_num: z
    .string()
    .min(1, { message: "Registration number is required" }),
  price: z.string().refine((val) => !isNaN(parseFloat(val)), {
    message: "Price must be a valid number",
  }),
  year: z.string().refine((val) => !isNaN(parseInt(val)), {
    message: "Year must be a valid number",
  }),
  mileage: z.string().refine((val) => !isNaN(parseFloat(val)), {
    message: "Mileage must be a valid number",
  }),
  title: z.string().min(1, { message: "Title is required" }),
  fuelType: z.string().min(1, { message: "Fuel type is required" }),
  transmission: z.string().min(1, { message: "Transmission is required" }),
  bodyType: z.string().min(1, { message: "Body type is required" }),
  color: z.string().min(1, { message: "Color is required" }),
  description: z.string().min(1, { message: "Description is required" }),
  location: z.string().min(1, { message: "Location is required" }),
  latitude: z
    .number()
    .min(-90)
    .max(90, { message: "Latitude is required" })
    .optional(),
  longitude: z
    .number()
    .min(-180)
    .max(180, { message: "Longitude is required" })
    .optional(),
  images: z.array(z.string()),
  condition: z.enum(["clean", "catS", "catN"], {
    required_error: "Condition is required",
  }),
});

export default function RaffleForm() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [ticketRevenue, setTicketRevenue] = useState(0);
  const [addNewItem, setAddNewItem] = useState(true);
  const [itemType, setItemType] = useState<"vehicle" | "spare-part">("vehicle");
  const { toast } = useToast();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const locationRef = useRef<HTMLDivElement | null>(null);
  const suggestionBoxRef = useRef<HTMLDivElement | null>(null);
  const [locationSuggestions, setLocationSuggestions] = useState<any>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);

  

  const handleLocationFocus = () => {
    if (vehicleForm.getValues("location").length >= 2) {
      setShowLocationSuggestions(true);
    }
  };

  const handleSelectLocation = (suggestion: any) => {
    vehicleForm.setValue("location", suggestion.display_name);
    setShowLocationSuggestions(false);
    vehicleForm.trigger("location");
  };

  const now = new Date();
  const oneWeekLater = addDays(now, 7);

  const form = useForm({
    resolver: zodResolver(raffleFormSchema),
    defaultValues: {
      vehicleId: "",
      title: "",
      description: "",
      startDate: new Date(),
      startTime: format(now, "HH:mm"),
      endDate: new Date(),
      endTime: format(now, "HH:mm"),
      ticketPrice: 0,
      ticketQuantity: 0,
      featuredRaffle: false,
    },
  });

  const vehicleForm = useForm<z.infer<typeof vehicleFormSchema>>({
    resolver: zodResolver(vehicleFormSchema),
    defaultValues: {
      title: "",
      type: "car",
      make: "",
      model: "",
      price: "",
      year: "",
      mileage: "",
      fuelType: "",
      transmission: "",
      bodyType: "",
      registration_num: "",
      color: "",
      location: "",
      images: [],
    },
  });

  const debouncedLocationQuery = useDebounce(vehicleForm.getValues("location"), 500);
  const vehiclePrice = vehicleForm.watch("price");
  const ticketPrice = form.watch("ticketPrice");
  const ticketQuantity = form.watch("ticketQuantity");

  useEffect(() => {
    if (ticketPrice && ticketPrice > 0) {
      form.setValue("ticketQuantity", parseFloat(vehiclePrice) / ticketPrice);
    } else if (ticketQuantity && ticketQuantity > 0) {
      form.setValue("ticketPrice", parseFloat(vehiclePrice) / ticketQuantity);
    }
    setTicketRevenue(ticketPrice * ticketQuantity);
  }, [vehiclePrice, ticketPrice, ticketQuantity]);


   useEffect(() => {
      if (debouncedLocationQuery && debouncedLocationQuery.length >= 2 && !locationSuggestions.some((l:any)=>l.display_name===debouncedLocationQuery)) {
        setIsLoadingLocations(true);
        setShowLocationSuggestions(true);
        
        getLocationSuggestion(debouncedLocationQuery)
          .then((suggestions) => {
            setLocationSuggestions(suggestions);
          })
          .finally(() => {
            setIsLoadingLocations(false);
          });
      } else {
        setLocationSuggestions([]);
        setShowLocationSuggestions(false);
      }
    }, [debouncedLocationQuery]);

  useEffect(() => {
    // const fetchVehicles = async () => {
    //   try {
    //     setLoading(true);
    //     const response = await getAdminVehicles();
    //     // setVehicles(response.vehicles);
    //   } catch (error) {
    //     console.error("Error fetching vehicles:", error);
    //   } finally {
    //     setLoading(false);
    //   }
    // };
    // fetchVehicles();
  }, []);

  // Handle vehicle selection
  const handleVehicleSelect = (vehicleId: any) => {
    const vehicle = vehicles.find((v: any) => v.id === parseInt(vehicleId));
    if (vehicle) setSelectedVehicle(vehicle);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files).filter((file) =>
        file.type.startsWith("image/")
      );

      if (selectedFiles.length + newFiles.length > 10) {
        toast({
          title: "Too many images",
          description: "You can upload a maximum of 10 images.",
          variant: "destructive",
        });
        return;
      }

      setSelectedFiles((prev) => [...prev, ...newFiles]);
    }
    // Reset the input value to allow selecting the same file again
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (values: any) => {
    // setSubmitting(true);
    try {
      console.log(values);
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

      // Gather vehicle data from the vehicle form
      const vehicleData = vehicleForm.getValues();

      let imageUrls: string[] = [];

      if (selectedFiles.length > 0) {
        const fileKeys = selectedFiles.map((file) => ({
          fileName: `${Date.now()}-${file.name.split(" ").join("")}`,
          contentType: file.type,
        }));
        console.log(fileKeys);
        const presignedUrlsResponse = await getPresignedUrls(fileKeys);
        const presignedUrls = presignedUrlsResponse.data.urls;

        const uploadPromises = selectedFiles.map((file, index) =>
          uploadToPresignedUrl(file, presignedUrls[index])
        );

        const urls = await Promise.all(uploadPromises);
        imageUrls.push(...urls);

        // let completed = 0;
        // for (const promise of uploadPromises) {
        //   await promise.then((url) => {
        //     imageUrls.push(url);
        //     completed++;
        //     // setUploadProgress(
        //     //   Math.floor((completed / uploadPromises.length) * 100)
        //     // );
        //   });
        // }
      }

      vehicleData.images = imageUrls;

      const raffleData = {
        ...vehicleData,
        title: values.title,
        description: values.description,
        startDate: startDateTime,
        endDate: endDateTime,
        ticketPrice: values.ticketPrice,
        ticketQuantity: values.ticketQuantity,
        featured: values.featuredRaffle,
      };

      await createRaffle(raffleData);
      toast({
        title: "Success",
        description: "Raffle created successfully",
      });
      form.reset();
      setSelectedVehicle(null);
    } catch (error) {
      console.error("Error creating raffle:", error);
      toast({
        variant: "destructive",
        title: "Failed",
        description: "Something went wrong",
      });
    } finally {
      setSubmitting(false);
    }
  };

   const LocationSkeleton = () => (
    <div className="animate-pulse flex flex-col space-y-2 p-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-6 bg-blue-100 rounded w-full"></div>
      ))}
    </div>
  );

  return (
    <div className="mx-auto mt-8 p-6 rounded-2xl shadow-md border bg-white">
      <h2 className="text-2xl font-bold mb-6 text-blue-700 border-b pb-3 border-blue-100">
        Create Car Raffle
      </h2>

      <Form {...form}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            console.log("Basic form submit triggered");
            // Debug form validation state
            console.log("Form is valid:", form.formState.isValid);
            console.log("Form errors:", form.formState.errors);

            // Try to run the handler but catch any errors
            try {
              form.handleSubmit(onSubmit)(e);
            } catch (error) {
              console.error("Error during form submission:", error);
            }
          }}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left column - Vehicle selection or add new */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-medium mb-4 text-blue-600 flex items-center">
                <span className="bg-blue-600 w-1 h-6 rounded mr-2"></span>
                Select Vehicle or Add New
              </h3>

              {/* Toggle between select and add new */}
              {/* <Button
                type="button"
                variant={addNewItem ? "default" : "outline"}
                className="mb-4 w-full"
                onClick={() => setAddNewItem((v) => !v)}
              >
                {addNewItem
                  ? "Select Existing Vehicle"
                  : "Add New Vehicle or Luxury Spare Part"}
              </Button> */}

              {/* Add New Vehicle/Spare Part Form */}
              {addNewItem ? (
                <Form {...vehicleForm}>
                  <div className="space-y-6">
                    <div className="space-y-4 bg-blue-50 p-4 rounded-lg">
                      <FormField
                        control={vehicleForm.control}
                        name="registration_num"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-blue-800">
                              Registration Number
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="text"
                                placeholder="e.g. ABC-1234"
                                className="border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="text-red-500" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={vehicleForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-medium text-blue-800">
                              Vehicle Title
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="text"
                                placeholder="Title"
                                {...field}
                                className="w-full border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                              />
                            </FormControl>
                            <FormMessage className="text-red-500" />
                          </FormItem>
                        )}
                      />
                      {/* <FormField
                        control={vehilcForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-medium">
                              Description
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Details you want to share..."
                                {...field}
                                className="w-full min-h-24"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      /> */}
                    </div>

                    {/* Image Upload Section */}
                    <div className="bg-gradient-to-r from-blue-50 to-white p-5 rounded-lg border border-blue-100">
                      <h3 className="text-lg font-medium mb-3 text-blue-700">
                        Vehicle Images
                      </h3>
                      <div className="space-y-4">
                        <div className="border border-dashed border-blue-300 rounded-lg p-6 text-center bg-white">
                          <div className="mb-4">
                            <Upload className="mx-auto h-10 w-10 text-blue-400" />
                            <p className="mt-2 text-sm text-blue-700">
                              Upload up to 10 images of your vehicle
                            </p>
                            <p className="text-xs text-blue-400">
                              Supported formats: JPG, PNG, WEBP (max 5MB each)
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="relative bg-blue-600 text-white hover:bg-blue-700 border-blue-600"
                          >
                            <span>Select Images</span>
                            <Input
                              type="file"
                              accept="image/*"
                              multiple
                              className="absolute inset-0 opacity-0 cursor-pointer"
                              onChange={handleFileChange}
                            />
                          </Button>
                        </div>

                        {/* Preview selected images */}
                        {selectedFiles.length > 0 && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                            {selectedFiles.map((file, index) => (
                              <div
                                key={index}
                                className="relative group aspect-square border rounded-md overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                              >
                                <img
                                  src={URL.createObjectURL(file)}
                                  alt={`Vehicle preview ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                                <button
                                  type="button"
                                  className="absolute top-1 right-1 bg-black bg-opacity-50 rounded-full p-1 text-white hover:bg-opacity-70"
                                  onClick={() => removeFile(index)}
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-lg border border-blue-100 shadow-sm">
                      <h3 className="text-lg font-medium mb-3 text-blue-700">
                        Basic Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={vehicleForm.control}
                          name="type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-blue-800">
                                Vehicle Type
                              </FormLabel>
                              <FormControl>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <SelectTrigger className="border-blue-200 focus:ring-blue-500">
                                    <SelectValue placeholder="Choose a vehicle type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {vehicleTypes.map((vt) => (
                                      <SelectItem key={vt} value={vt}>
                                        {vt}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormControl>
                              <FormMessage className="text-red-500" />
                            </FormItem>
                          )}
                        />
                        {/* <FormField
                          control={vehicleForm.control}
                          name="condition"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Condition</FormLabel>
                              <FormControl>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select Vehicle Condition" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {vehicleConditions.map((condition) => (
                                      <SelectItem
                                        key={condition}
                                        value={condition}
                                      >
                                        {condition}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        /> */}
                        <FormField
                          control={vehicleForm.control}
                          name="make"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-blue-800">
                                Make
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="text"
                                  placeholder="e.g. Toyota"
                                  className="border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage className="text-red-500" />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={vehicleForm.control}
                          name="model"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-blue-800">
                                Model
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="text"
                                  placeholder="e.g. Camry"
                                  className="border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage className="text-red-500" />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-white to-blue-50 p-5 rounded-lg border border-blue-100 shadow-sm">
                      <h3 className="text-lg font-medium mb-3 text-blue-700">
                        Vehicle Specifications
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={vehicleForm.control}
                          name="year"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-blue-800">
                                Year
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="e.g. 2020"
                                  className="border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage className="text-red-500" />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={vehicleForm.control}
                          name="mileage"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-blue-800">
                                Mileage
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="e.g. 45000"
                                  className="border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage className="text-red-500" />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={vehicleForm.control}
                          name="color"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-blue-800">
                                Color
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="text"
                                  placeholder="e.g. Silver"
                                  className="border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage className="text-red-500" />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={vehicleForm.control}
                          name="fuelType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-blue-800">
                                Fuel Type
                              </FormLabel>
                              <FormControl>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <SelectTrigger className="border-blue-200 focus:ring-blue-500">
                                    <SelectValue placeholder="Select fuel type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {vehicleFuelTypes[
                                      vehicleForm.getValues("type")
                                    ]?.map((fuel) => (
                                      <SelectItem key={fuel} value={fuel}>
                                        {fuel}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormControl>
                              <FormMessage className="text-red-500" />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={vehicleForm.control}
                          name="transmission"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-blue-800">
                                Transmission Type
                              </FormLabel>
                              <FormControl>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <SelectTrigger className="border-blue-200 focus:ring-blue-500">
                                    <SelectValue placeholder="Select transmission" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {vehicleTransmissionsTypes[
                                      vehicleForm.getValues("type")
                                    ]?.map((transmission) => (
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
                              <FormMessage className="text-red-500" />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={vehicleForm.control}
                          name="bodyType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-blue-800">
                                Body Type
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="text"
                                  placeholder="e.g. SUV"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Two Column Layout for Listing Details */}
                    <div>
                      <h3 className="text-lg font-medium mb-3 text-blue-700">
                        Listing Details
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={vehicleForm.control}
                          name="price"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-blue-800">
                                Price
                              </FormLabel>
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
                                    onChange={(e) =>
                                      field.onChange(parseFloat(e.target.value))
                                    }
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={vehicleForm.control}
                          name="location"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-blue-800">
                                Location
                              </FormLabel>
                              <div className="relative" ref={locationRef}>
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-500">
                                  <MapPin className="h-4 w-4" />
                                </div>
                                <FormControl>
                                  <Input
                                    type="text"
                                    placeholder="e.g. London, UK"
                                    className="pl-9 border-blue-200 focus:ring-blue-500 focus:border-blue-500"
                                    onFocus={handleLocationFocus}
                                    {...field}
                                  />
                                </FormControl>
                                {showLocationSuggestions && (
                                  <div
                                    ref={suggestionBoxRef}
                                    className="absolute z-20 w-full mt-1 bg-white border border-blue-200 rounded-md shadow-lg max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-400 scrollbar-track-blue-50"
                                  >
                                    {isLoadingLocations ? (
                                      <LocationSkeleton />
                                    ) : locationSuggestions.length > 0 ? (
                                      locationSuggestions.map(
                                        (suggestion: any, index: number) => (
                                          <div
                                            key={index}
                                            className="px-4 py-2 hover:bg-blue-50 cursor-pointer flex items-center space-x-2 text-sm border-b border-blue-50 last:border-0"
                                            onClick={() =>
                                              handleSelectLocation(suggestion)
                                            }
                                          >
                                            <MapPin className="h-4 w-4 text-blue-500" />
                                            <span>
                                              {suggestion.display_name}
                                            </span>
                                          </div>
                                        )
                                      )
                                    ) : (
                                      <div className="px-4 py-2 text-sm text-gray-500">
                                        No locations found
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* <div className="pt-2">
                      <Button
                        type="submit"
                        className="w-full md:w-auto"
                        disabled={isUploading}
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {uploadProgress > 0
                              ? `Uploading ${uploadProgress}%`
                              : "Processing..."}
                          </>
                        ) : (
                          "Submit Listing"
                        )}
                      </Button>
                    </div> */}
                  </div>
                </Form>
              ) : (
                // Existing vehicle select (unchanged)
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
                        <SelectTrigger>
                          <SelectValue placeholder="Select a vehicle" />
                        </SelectTrigger>
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
                                {vehicle.make} {vehicle.model} ({vehicle.year})
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

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
                        <span className="font-medium">Market Value:</span> $
                        {selectedVehicle.price.toLocaleString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {selectedVehicle && (
                <Card className="mt-4 bg-blue-50 border-blue-200">
                  <CardContent className="pt-4">
                    <h4 className="text-sm font-medium mb-2 flex items-center">
                      <Info className="h-4 w-4 mr-1" />
                      Raffle Summary
                    </h4>
                    <div className="text-sm space-y-1">
                      <p>
                        <span className="font-medium">Total Tickets:</span>{" "}
                        {ticketQuantity}
                      </p>
                      <p>
                        <span className="font-medium">Ticket Price:</span> $
                        {ticketPrice}
                      </p>
                      <p>
                        <span className="font-medium">Maximum Revenue:</span> $
                        {ticketRevenue.toLocaleString()}
                      </p>
                      <p>
                        <span className="font-medium">Vehicle Value:</span> $
                        {selectedVehicle.price.toLocaleString()}
                      </p>
                      <p className="pt-1">
                        <span className="font-medium">Potential Profit:</span>{" "}
                        <span
                          className={
                            ticketRevenue > selectedVehicle.price
                              ? "text-green-600 font-bold"
                              : "text-red-600 font-bold"
                          }
                        >
                          $
                          {(
                            ticketRevenue - selectedVehicle.price
                          ).toLocaleString()}
                        </span>
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="md:col-span-1">
              <h3 className="text-lg font-medium mb-4 text-blue-800">
                Raffle Details
              </h3>

              {/* Title and Description */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="mb-4">
                    <FormLabel className="text-blue-800">
                      Raffle Title
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        className="border-blue-200 focus:ring-blue-500"
                        placeholder="Enter an attractive title for your raffle..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="mb-4">
                    <FormLabel className="text-blue-800">
                      Raffle Description
                    </FormLabel>
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

              {/* Raffle Start Date and Time */}
              <div className="space-y-2">
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
                                return (
                                  date <
                                  new Date(
                                    today.getFullYear(),
                                    today.getMonth(),
                                    today.getDate()
                                  )
                                );
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
                            <Input
                              type="time"
                              className="border-blue-200 focus:ring-blue-500"
                              {...field}
                            />
                            <ClockIcon className="absolute right-3 top-2.5 h-4 w-4 text-gray-500 pointer-events-none" />
                          </div>
                        </FormControl>
                        <FormMessage className="text-red-500" />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              {/* Raffle End Date and Time */}
              <div className="space-y-2 mt-3">
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
                                return (
                                  date <
                                  new Date(
                                    today.getFullYear(),
                                    today.getMonth(),
                                    today.getDate()
                                  )
                                );
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
                            <Input
                              type="time"
                              className="border-blue-200 focus:ring-blue-500"
                              {...field}
                            />
                            <ClockIcon className="absolute right-3 top-2.5 h-4 w-4 text-gray-500 pointer-events-none" />
                          </div>
                        </FormControl>
                        <FormMessage className="text-red-500" />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Ticket Configuration */}
              <h3 className="text-lg font-medium mb-4 mt-6 text-blue-800 ">
                Ticket Configuration
              </h3>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <FormField
                  control={form.control}
                  name="ticketPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-blue-800">
                        Ticket Price ($)
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          className="pl-10 border-blue-200 focus:ring-blue-500"
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ticketQuantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-blue-800">
                        Total Tickets
                      </FormLabel>

                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          placeholder="1000"
                          className="pl-10 border-blue-200 focus:ring-blue-500"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Featured Raffle */}
              <FormField
                control={form.control}
                name="featuredRaffle"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 mb-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Featured Raffle
                      </FormLabel>
                      <FormDescription>
                        Highlight this raffle on the homepage and promotional
                        materials
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              className="border-blue-200 text-blue-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center"
            >
              {submitting ? (
                <>Creating...</>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Create Raffle
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
