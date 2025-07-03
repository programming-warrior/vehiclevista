import React, { useEffect, useState, useRef } from "react";
import { vehicleEditSchema } from "@shared/zodSchema/vehicleSchema";
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
  getPresignedUrls,
  uploadToPresignedUrl,
  editClassifiedListing,
} from "@/api";
import { X, Upload, Loader2, MapPin, Search, CheckCircle2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useDebounce } from "@/hooks/use-debounce";
import { getLocationSuggestion } from "@/api";

interface ImageItem {
  id: string;
  url: string;
  file?: File;
  isExisting: boolean;
  isDeleted?: boolean;
}

const VehicleEditForm = ({
    vehicleData
}: {
    vehicleData: any
}) => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [locationSuggestions, setLocationSuggestions] = useState<any>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const locationRef = useRef<HTMLDivElement | null>(null);
  const suggestionBoxRef = useRef<HTMLDivElement | null>(null);
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(vehicleEditSchema),
    defaultValues: {
      title: vehicleData.title,
      description: vehicleData.description,
      location: vehicleData.location,
      images: vehicleData.images,
    //   condition: vehicleData.condition,
      openToPX: vehicleData.openToPX,
      negotiable: vehicleData.negotiable,
      latitude: vehicleData.latitude,
      longitude: vehicleData.longitude,
    },
  });

  const [, setLocation] = useLocation();

  const debouncedLocationQuery = useDebounce(form.getValues("location"), 500);

  // Initialize images from vehicleData
  useEffect(() => {
    if (vehicleData.images && vehicleData.images.length > 0) {
      const existingImages: ImageItem[] = vehicleData.images.map((url: string, index: number) => ({
        id: `existing-${index}`,
        url,
        isExisting: true,
        isDeleted: false,
      }));
      setImages(existingImages);
    }
  }, [vehicleData.images]);

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
    window.scrollTo(0,0)
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
    const files : File[] = e.target.files;
    if (files) {
      const newFiles: File[] = Array.from(files).filter((file: any) =>
        file.type.startsWith("image/")
      );

      const activeImages = images.filter(img => !img.isDeleted);
      if (activeImages.length + newFiles.length > 10) {
        toast({
          title: "Too many images",
          description: "You can upload a maximum of 10 images.",
          variant: "destructive",
        });
        return;
      }

      const newImageItems: ImageItem[] = newFiles.map((file: File, index: number) => ({
        id: `new-${Date.now()}-${index}`,
        url: URL.createObjectURL(file),
        file,
        isExisting: false,
      }));

      setImages(prev => [...prev, ...newImageItems]);
    }
    e.target.value = "";
  };

  const removeImage = (imageId: string) => {
    setImages(prev => 
      prev.map(img => 
        img.id === imageId 
          ? img.isExisting 
            ? { ...img, isDeleted: true } // Mark existing images as deleted
            : img // This will be filtered out below for new images
          : img
      ).filter(img => !(img.id === imageId && !img.isExisting)) 
    );
  };

  const restoreImage = (imageId: string) => {
    setImages(prev => 
      prev.map(img => 
        img.id === imageId 
          ? { ...img, isDeleted: false }
          : img
      )
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
    setIsUploading(true);
    setUploadProgress(0);

    try {
      let finalImageUrls: string[] = [];

      // Get existing images that are not deleted
      const existingImages = images.filter(img => img.isExisting && !img.isDeleted);
      finalImageUrls = existingImages.map(img => img.url);

      // Upload new images
      const newImages = images.filter(img => !img.isExisting && img.file);
      
      if (newImages.length > 0) {
        const fileKeys = newImages.map((imageItem) => ({
          fileName: `${Date.now()}-${imageItem.file!.name.split(" ").join("")}`,
          contentType: imageItem.file!.type,
        }));

        const presignedUrlsResponse = await getPresignedUrls(fileKeys);
        const presignedUrls = presignedUrlsResponse.data.urls;

        const uploadPromises = newImages.map((imageItem, index) =>
          uploadToPresignedUrl(imageItem.file!, presignedUrls[index])
        );

        // Track progress
        let completed = 0;
        for (const promise of uploadPromises) {
          await promise.then((url: string) => {
            finalImageUrls.push(url);
            completed++;
            setUploadProgress(
              Math.floor((completed / uploadPromises.length) * 100)
            );
          });
        }
      }

      const vehicleUpdateData = {
        ...data,
        images: finalImageUrls,
      };

      const response = await editClassifiedListing(vehicleData.id,vehicleUpdateData);
      console.log("Vehicle uploaded successfully:");

      toast({
        title: "Success!",
        description: "Your vehicle listing has been updated.",
      });

      setLocation("/profile?tab=classified")
      // Clean up object URLs for new images
      images.forEach(img => {
        if (!img.isExisting && img.url.startsWith('blob:')) {
          URL.revokeObjectURL(img.url);
        }
      });

      // setLocation("/seller");
    } catch (error: any) {
      toast({
        title: "Update failed",
        description:
          error.message || "There was an error updating your listing.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }

  const LocationSkeleton = () => (
    <div className="animate-pulse flex flex-col space-y-2 p-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-6 bg-blue-100 rounded w-full"></div>
      ))}
    </div>
  );

  const activeImages = images.filter(img => !img.isDeleted);
  const deletedImages = images.filter(img => img.isDeleted);

  console.log("form errors", form.formState.errors);

  return (
    <div className=" mx-auto p-4">
      <Card className="shadow-lg border-blue-100">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
          <CardTitle className="text-2xl text-blue-900 font-bold">
            Edit Vehicle Listing
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Basic Information Section */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-blue-900 border-b border-blue-200 pb-2">
                  Basic Information
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-blue-800 font-medium text-base">
                          Vehicle Title
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="Enter vehicle title"
                            {...field}
                            className="h-12 text-base border-blue-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
{/* 
                  <FormField
                    control={form.control}
                    name="condition"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-blue-800 font-medium text-base">
                          Condition
                        </FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <SelectTrigger className="h-12 text-base border-blue-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                              <SelectValue placeholder="Select condition" />
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
                  /> */}
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-blue-800 font-medium text-base">
                        Description
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe your vehicle in detail..."
                          {...field}
                          className="min-h-32 text-base border-blue-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Images Section */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-blue-900 border-b border-blue-200 pb-2">
                  Vehicle Images
                </h3>
                
                {/* Upload Area */}
                <div className="border-2 border-dashed border-blue-300 rounded-xl p-8 text-center bg-gradient-to-br from-blue-50 to-white hover:from-blue-100 hover:to-blue-50 transition-all duration-300">
                  <div className="space-y-4">
                    <Upload className="mx-auto h-16 w-16 text-blue-500" />
                    <div>
                      <p className="text-lg font-medium text-blue-700">
                        Add more images to your listing
                      </p>
                      <p className="text-sm text-blue-600 mt-1">
                        Upload up to 10 images total • JPG, PNG, WEBP (max 5MB each)
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      className="relative border-2 border-blue-500 text-blue-700 hover:bg-blue-100 font-medium"
                      disabled={isUploading || activeImages.length >= 10}
                    >
                      <span>Select Images</span>
                      <Input
                        type="file"
                        accept="image/*"
                        multiple
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={handleFileChange}
                        disabled={isUploading || activeImages.length >= 10}
                      />
                    </Button>
                  </div>
                </div>

                {/* Image Grid */}
                {activeImages.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {activeImages.map((imageItem, index) => (
                      <div
                        key={imageItem.id}
                        className="relative group aspect-square border-2 border-blue-200 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-300"
                      >
                        <img
                          src={imageItem.url}
                          alt={`Vehicle image ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity duration-300"></div>
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <button
                            type="button"
                            className="bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-lg"
                            onClick={() => removeImage(imageItem.id)}
                            disabled={isUploading}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        {imageItem.isExisting && (
                          <div className="absolute bottom-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                            Existing
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Deleted Images (with restore option) */}
                {deletedImages.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="text-red-800 font-medium mb-3">
                      Images to be removed ({deletedImages.length})
                    </h4>
                    <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
                      {deletedImages.map((imageItem) => (
                        <div
                          key={imageItem.id}
                          className="relative aspect-square border border-red-300 rounded-md overflow-hidden opacity-50"
                        >
                          <img
                            src={imageItem.url}
                            alt="Deleted image"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white text-xs hover:bg-opacity-70"
                            onClick={() => restoreImage(imageItem.id)}
                            title="Restore image"
                          >
                            Restore
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Pricing and Location Section */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-blue-900 border-b border-blue-200 pb-2">
                  Location
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-blue-800 font-medium text-base">
                          Location
                        </FormLabel>
                        <div className="relative" ref={locationRef}>
                          <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-blue-500">
                            <MapPin className="h-5 w-5" />
                          </div>
                          <FormControl>
                            <Input
                              type="text"
                              placeholder="London, UK"
                              className="pl-12 h-12 text-base border-blue-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              onFocus={handleLocationFocus}
                              {...field}
                            />
                          </FormControl>
                          {showLocationSuggestions && (
                            <div
                              ref={suggestionBoxRef}
                              className="absolute z-20 w-full mt-1 bg-white border border-blue-200 rounded-md shadow-xl max-h-48 overflow-y-auto"
                            >
                              {isLoadingLocations ? (
                                <LocationSkeleton />
                              ) : locationSuggestions.length > 0 ? (
                                locationSuggestions.map(
                                  (suggestion: any, index: number) => (
                                    <div
                                      key={index}
                                      className="px-4 py-3 hover:bg-blue-50 cursor-pointer flex items-center space-x-3 text-sm border-b border-blue-50 last:border-0"
                                      onClick={() =>
                                        handleSelectLocation(suggestion)
                                      }
                                    >
                                      <MapPin className="h-4 w-4 text-blue-500 flex-shrink-0" />
                                      <span className="truncate">{suggestion.display_name}</span>
                                    </div>
                                  )
                                )
                              ) : (
                                <div className="px-4 py-3 text-sm text-gray-500">
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

              {/* Listing Options Section */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-blue-900 border-b border-blue-200 pb-2">
                  Listing Options
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="negotiable"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-4 space-y-0 p-4 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="border-blue-400 text-blue-600 focus:ring-blue-500 h-5 w-5"
                          />
                        </FormControl>
                        <FormLabel className="font-medium text-blue-800 cursor-pointer text-base">
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
                      <FormItem className="flex flex-row items-center space-x-4 space-y-0 p-4 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="border-blue-400 text-blue-600 focus:ring-blue-500 h-5 w-5"
                          />
                        </FormControl>
                        <FormLabel className="font-medium text-blue-800 cursor-pointer text-base">
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
                <div className="w-full bg-blue-100 rounded-full h-3 shadow-inner">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-300 ease-out shadow-sm"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-6 border-t border-blue-200">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-8 shadow-lg hover:shadow-xl transition-all duration-300"
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <div className="flex items-center">
                      <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                      {uploadProgress > 0
                        ? `Uploading Images ${uploadProgress}%`
                        : "Processing..."}
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <CheckCircle2 className="mr-3 h-5 w-5" />
                      Update Vehicle Listing
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default VehicleEditForm;