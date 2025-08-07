import React, { useDebugValue, useEffect, useState, useRef } from "react";
import { vehicleUploadSchema } from "@shared/zodSchema/vehicleSchema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { vehicleConditions, vehicleTypes } from "@shared/schema";
import {
  vehicleTransmissionsTypes,
  vehicleFuelTypes,
} from "@shared/zodSchema/vehicleSchema";
import { Checkbox } from "../ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  uploadSingleVehicle,
  getPresignedUrls,
  uploadToPresignedUrl,
  UpdateDraftAuctionWithItemDraft,
} from "@/api";
import { X, Upload, Loader2, MapPin, Search, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useDebounce } from "@/hooks/use-debounce";
import { dvsaApi, getLocationSuggestion } from "@/api";
import {
  useAuctionDraftCache,
  useVehicleDraftCache,
  useRedirectStore,
} from "@/hooks/use-store";
import { useUser } from "@/hooks/use-store";

const VehicleUploadForm = ({
  pullData,
  prefetchedData,
  auctionDraftId,
}: {
  prefetchedData?: any;
  pullData?: (vehicleData: any) => void;
  auctionDraftId?: number;
}) => {
  const [selectedFiles, setSelectedFiles] = useState<any>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [locationSuggestions, setLocationSuggestions] = useState<any>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const locationRef = useRef<HTMLDivElement | null>(null);
  const suggestionBoxRef = useRef<HTMLDivElement | null>(null);
  const { toast } = useToast();
  const { userId } = useUser();

  const form = useForm({
    resolver: zodResolver(vehicleUploadSchema),
    defaultValues: {
      title: "",
      type:
        prefetchedData?.result?.basic_vehicle_info?.autotrader_asset_type?.toLowerCase() ??
        "car",
      make: prefetchedData?.result?.basic_vehicle_info?.manufacturer_desc ?? "",
      model: prefetchedData?.result?.basic_vehicle_info?.model_range_desc ?? "",
      price: "",
      year: "",
      mileage: prefetchedData?.mileage.toString() ?? "",
      fuelType:
        prefetchedData?.result?.basic_vehicle_info?.autotrader_fuel_type_desc?.toLowerCase() ??
        "",
      transmission:
        prefetchedData?.result?.basic_vehicle_info?.autotrader_transmission_desc?.toLowerCase() ??
        "",
      bodyType:
        prefetchedData?.result?.basic_vehicle_info?.autotrader_body_type_desc?.toLowerCase() ??
        "",
      registration_num:
        prefetchedData?.result?.basic_vehicle_info?.vehicle_registration_mark ??
        "",
      color: prefetchedData?.result?.basic_vehicle_info?.colour ?? "",
      description:
        prefetchedData?.result?.basic_vehicle_info?.vehicle_desc ?? "",
      location: "",
      images: [],
      condition: "clean",
      openToPX: false,
      contactPreference: "phone",
      negotiable: false,
      latitude: 0,
      longitude: 0,
    },
  });

  const [location, setLocation] = useLocation();
  const debouncedRegistrationNum = useDebounce(
    form.getValues("registration_num")
  );
  const debouncedLocationQuery = useDebounce(form.getValues("location"), 500);
  const [registrationNumError, setRegistrationNumError] = useState("");
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const { auctionCache, setAuctionCache, clearAuctionCache } =
    useAuctionDraftCache();

  const { vehicleCache, setVehicleCache, clearVehicleCache } =
    useVehicleDraftCache();
  const { setRedirectUrl } = useRedirectStore();

  console.log(auctionCache);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionBoxRef.current &&
        !suggestionBoxRef.current.contains(event.target as Node) &&
        locationRef.current &&
        !locationRef.current.contains(event.target as Node)
      ) {
        setShowLocationSuggestions(false);
      }
    };
    window.scrollTo(0, 0);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // useEffect(() => {
  //   if (debouncedRegistrationNum) {
  //     setRegistrationNumError("");
  //     setRegistrationSuccess(false);

  //     dvsaApi(debouncedRegistrationNum)
  //       .then((data) => {
  //         console.log(data);
  //         setRegistrationSuccess(true);
  //         // Here you could auto-fill form fields with vehicle data
  //       })
  //       .catch((e) => {
  //         setRegistrationNumError("Vehicle not found in DVSA");
  //       });
  //   }
  // }, [debouncedRegistrationNum]);

  // Fetch location suggestions when location input changes
  useEffect(() => {
    if (
      debouncedLocationQuery &&
      debouncedLocationQuery.length >= 2 &&
      !locationSuggestions.some(
        (l: any) => l.display_name === debouncedLocationQuery
      )
    ) {
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

  const handleFileChange = (e: any) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files).filter((file: any) =>
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

      setSelectedFiles((prev: any) => [...prev, ...newFiles]);
    }
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev: File[]) =>
      prev.filter((_, i: number) => i !== index)
    );
  };

  const handleSelectLocation = (suggestion: any) => {
    console.log(suggestion.display_name);
    console.log(suggestion.lat);
    console.log(suggestion.lon);
    form.setValue("location", suggestion.display_name);
    form.setValue("latitude", parseFloat(suggestion.lat));
    form.setValue("longitude", parseFloat(suggestion.lon));
    setShowLocationSuggestions(false);
    form.trigger("location");
  };

  const handleLocationFocus = () => {
    if (form.getValues("location").length >= 2) {
      setShowLocationSuggestions(true);
    }
  };

  async function onSubmit(data: any) {
    console.log("Form submission started", data);
    //if the user is not logged in store the data in the cache
    if (!userId) {
      if (pullData && typeof pullData === "function") {
        const vehicleCacheData = {
          ...data,
          draftId: crypto.randomUUID(),
          images: selectedFiles,
        };
        //if auctionDraftId is present, the user is filling vehicle form for the auction item
        if (auctionDraftId) {
          setAuctionCache({
            item: {
              ...vehicleCacheData,
            },
          });
          console.log(useAuctionDraftCache.getState().auctionCache);
          pullData({
            ...vehicleCacheData,
          });
        } else {
          clearVehicleCache();
          setVehicleCache({
            ...vehicleCacheData,
          });
          setRedirectUrl(location);
          console.log(useVehicleDraftCache.getState().vehicleCache);
          pullData({
            ...vehicleCacheData,
          });
        }
        toast({
          title: "Success",
          description: "item details saved.",
          className: "bg-blue-50 border-blue-200",
        });
        return;
      }
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Only proceed with image upload if there are images selected
      let imageUrls: string[] = [];

      if (selectedFiles.length > 0) {
        const fileKeys = selectedFiles.map((file: File) => ({
          fileName: `${Date.now()}-${file.name.split(" ").join("")}`,
          contentType: file.type,
        }));

        const presignedUrlsResponse = await getPresignedUrls(fileKeys);
        const presignedUrls = presignedUrlsResponse.data.urls;

        const uploadPromises = selectedFiles.map((file: File, index: number) =>
          uploadToPresignedUrl(file, presignedUrls[index])
        );

        // Track progress
        let completed = 0;
        for (const promise of uploadPromises) {
          await promise.then((url: string) => {
            imageUrls.push(url);
            completed++;
            setUploadProgress(
              Math.floor((completed / uploadPromises.length) * 100)
            );
          });
        }
      }

      const vehicleData = {
        ...data,
        images: imageUrls as string[],
      };

      const response = await uploadSingleVehicle(vehicleData);
      console.log("Vehicle uploaded successfully:");

      vehicleData.draftId = response.draftId;

      //send the api request to update the auction draft
      if (auctionDraftId)
        await UpdateDraftAuctionWithItemDraft(
          auctionDraftId,
          response.draftId,
          "VEHICLE"
        );
      toast({
        title: "Success!",
        description: "Your vehicle listing has been created.",
      });

      form.reset();
      setSelectedFiles([]);
      if (pullData && typeof pullData === "function") {
        pullData(vehicleData);
      }
      // setLocation("/seller");
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description:
          error.message || "There was an error uploading your listing.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }

  // Custom skeleton component for location suggestions
  const LocationSkeleton = () => (
    <div className="animate-pulse flex flex-col space-y-2 p-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-6 bg-blue-100 rounded w-full"></div>
      ))}
    </div>
  );

  console.log("form errors", form.formState.errors);

  return (
    <Card className="w-full mx-auto shadow-lg border-blue-100">
      <CardHeader className="bg-blue-50 border-b border-blue-100">
        <CardTitle className="text-xl text-blue-800">
          Vehicle Listing Details
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Registration Number Field with Status Indicators */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="registration_num"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-blue-800 font-medium">
                      Registration Number
                    </FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="e.g. ABC-1234"
                          className={`${
                            registrationNumError
                              ? "border-red-500 pr-10"
                              : registrationSuccess
                              ? "border-green-500 pr-10"
                              : ""
                          } focus:ring-blue-500 focus:border-blue-500`}
                          {...field}
                        />
                      </FormControl>
                      {registrationNumError && (
                        <X className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-red-500" />
                      )}
                      {registrationSuccess && (
                        <CheckCircle2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500" />
                      )}
                    </div>
                    {registrationNumError && (
                      <div className="mt-1">
                        <p className="text-xs text-red-600">
                          {registrationNumError}
                        </p>
                        <p className="text-xs text-blue-600 mt-1 cursor-pointer hover:underline">
                          Enter data manually
                        </p>
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-blue-800 font-medium">
                      Vehicle Title
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="Title"
                        {...field}
                        className="w-full focus:ring-blue-500 focus:border-blue-500"
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
                  <FormItem>
                    <FormLabel className="text-blue-800 font-medium">
                      Description
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Details you want to share..."
                        {...field}
                        className="w-full min-h-24 focus:ring-blue-500 focus:border-blue-500 scrollbar-thin scrollbar-thumb-blue-400 scrollbar-track-blue-50"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Image Upload Section */}
            <div>
              <h3 className="text-lg font-medium mb-3 text-blue-800">
                Vehicle Images
              </h3>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-blue-200 rounded-lg p-6 text-center bg-blue-50 hover:bg-blue-100 transition-colors duration-200">
                  <div className="mb-4">
                    <Upload className="mx-auto h-12 w-12 text-blue-500" />
                    <p className="mt-2 text-sm text-blue-700 font-medium">
                      Upload up to 10 images of your vehicle
                    </p>
                    <p className="text-xs text-blue-500">
                      Supported formats: JPG, PNG, WEBP (max 5MB each)
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="relative border-blue-500 text-blue-700 hover:bg-blue-100"
                    disabled={isUploading}
                  >
                    <span>Select Images</span>
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={handleFileChange}
                      disabled={isUploading}
                    />
                  </Button>
                </div>

                {/* Preview selected images */}
                {selectedFiles.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {selectedFiles.map((file: File, index: number) => (
                      <div
                        key={index}
                        className="relative group aspect-square border border-blue-200 rounded-md overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
                      >
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Vehicle preview ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity duration-200"></div>
                        <button
                          type="button"
                          className="absolute top-2 right-2 bg-white bg-opacity-80 rounded-full p-1 text-red-600 hover:text-red-700 hover:bg-opacity-100 shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          onClick={() => removeFile(index)}
                          disabled={isUploading}
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Two Column Layout for Basic Info */}
            <div className="bg-white p-4 rounded-lg border border-blue-100">
              <h3 className="text-lg font-medium mb-3 text-blue-800">
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
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
                          <SelectTrigger className="border-blue-200 focus:ring-blue-500 focus:border-blue-500">
                            <SelectValue placeholder="Choose a vehicle type" />
                          </SelectTrigger>
                          <SelectContent className="border-blue-200">
                            {vehicleTypes.map((vt) => (
                              <SelectItem key={vt} value={vt}>
                                {vt
                                  .split("")
                                  .map((ch, i) =>
                                    i == 0 ? ch.toUpperCase() : ch
                                  )
                                  .join("")}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="condition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-blue-800">Condition</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <SelectTrigger className="border-blue-200 focus:ring-blue-500 focus:border-blue-500">
                            <SelectValue placeholder="Select Vehicle Condition" />
                          </SelectTrigger>
                          <SelectContent className="border-blue-200">
                            {vehicleConditions.map((condition) => (
                              <SelectItem key={condition} value={condition}>
                                {condition.charAt(0).toUpperCase() +
                                  condition.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="make"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-blue-800">Make</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="e.g. Toyota"
                          className="border-blue-200 focus:ring-blue-500 focus:border-blue-500"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-blue-800">Model</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="e.g. Camry"
                          className="border-blue-200 focus:ring-blue-500 focus:border-blue-500"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Two Column Layout for Specifications */}
            <div className="bg-white p-4 rounded-lg border border-blue-100">
              <h3 className="text-lg font-medium mb-3 text-blue-800">
                Vehicle Specifications
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-blue-800">Year</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g. 2020"
                          className="border-blue-200 focus:ring-blue-500 focus:border-blue-500"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="mileage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-blue-800">Mileage</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g. 45000"
                          className="border-blue-200 focus:ring-blue-500 focus:border-blue-500"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-blue-800">Color</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="e.g. Silver"
                          className="border-blue-200 focus:ring-blue-500 focus:border-blue-500"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fuelType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-blue-800">Fuel Type</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <SelectTrigger className="border-blue-200 focus:ring-blue-500 focus:border-blue-500">
                            <SelectValue placeholder="Select fuel type" />
                          </SelectTrigger>
                          <SelectContent className="border-blue-200">
                            {vehicleFuelTypes[
                              form.getValues(
                                "type"
                              ) as keyof typeof vehicleFuelTypes
                            ]?.map((fuel) => (
                              <SelectItem key={fuel} value={fuel}>
                                {fuel}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
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
                          <SelectTrigger className="border-blue-200 focus:ring-blue-500 focus:border-blue-500">
                            <SelectValue placeholder="Select transmission type" />
                          </SelectTrigger>
                          <SelectContent className="border-blue-200">
                            {vehicleTransmissionsTypes[
                              form.getValues(
                                "type"
                              ) as keyof typeof vehicleTransmissionsTypes
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bodyType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-blue-800">Body Type</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="e.g. SUV"
                          className="border-blue-200 focus:ring-blue-500 focus:border-blue-500"
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
            <div className="bg-white p-4 rounded-lg border border-blue-100">
              <h3 className="text-lg font-medium mb-3 text-blue-800">
                Listing Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-blue-800">Price</FormLabel>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                          £
                        </span>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="e.g. 15000"
                            className="pl-6 border-blue-200 focus:ring-blue-500 focus:border-blue-500"
                            {...field}
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-blue-800">Location</FormLabel>
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
                                    <span>{suggestion.display_name}</span>
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

            {/* Options as Two Column Grid */}
            <div className="bg-white p-4 rounded-lg border border-blue-100">
              <h3 className="text-lg font-medium mb-3 text-blue-800">
                Listing Options
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="negotiable"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 p-2 hover:bg-blue-50 rounded-md transition-colors">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="border-blue-400 text-blue-600 focus:ring-blue-500"
                        />
                      </FormControl>
                      <FormLabel className="font-normal text-blue-800 cursor-pointer">
                        Price is negotiable
                      </FormLabel>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="openToPX"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 p-2 hover:bg-blue-50 rounded-md transition-colors">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="border-blue-400 text-blue-600 focus:ring-blue-500"
                        />
                      </FormControl>
                      <FormLabel className="font-normal text-blue-800 cursor-pointer">
                        Open to part exchange
                      </FormLabel>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Upload Progress Bar */}
            {isUploading && uploadProgress > 0 && (
              <div className="w-full bg-blue-100 rounded-full h-2.5 mb-4">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-in-out"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            )}

            <div className="pt-4">
              <Button
                type="submit"
                className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isUploading}
              >
                {isUploading ? (
                  <div className="flex items-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {uploadProgress > 0
                      ? `Uploading ${uploadProgress}%`
                      : "Processing..."}
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Upload className="mr-2 h-4 w-4" />
                    Submit Listing
                  </div>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default VehicleUploadForm;
