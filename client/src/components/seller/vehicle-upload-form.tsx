import React, { useDebugValue, useEffect, useState } from "react";
import { vehicleUploadSchema } from "@shared/zodSchema/vehicleSchema";
import z from "zod";
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
} from "@/api";
import { X, Upload, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useDebounce } from "@/hooks/use-debounce";
import { dvsaApi } from "@/api";
// import { toast } from "@/hooks/use-toast";

const VehicleUploadForm = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  type VehicleUploadFormType = z.infer<typeof vehicleUploadSchema>;
  const form = useForm<VehicleUploadFormType>({
    resolver: zodResolver(vehicleUploadSchema),
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
      description: "",
      location: "",
      images: [],
      condition: "clean",
      openToPX: false,
      contactPreference: "phone",
      negotiable: false,
    },
  });
  const [, setLocation] = useLocation();
  const debouncedRegistrationNum = useDebounce(
    form.getValues("registration_num")
  );
  const [registrationNumError, setRegistrationNumError] = useState("");

  useEffect(() => {
    if (debouncedRegistrationNum) {
      dvsaApi(debouncedRegistrationNum)
        .then((data) => {
          console.log(data);
        })
        .catch((e) => {
          setRegistrationNumError("Vehicle not found in DVSA");
        });
    }
  }, [debouncedRegistrationNum]);

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

  async function onSubmit(data: VehicleUploadFormType) {
    console.log("Form submission started", data);
    console.log("Form validation status:", form.formState.isValid);
    console.log("Form errors:", form.formState.errors);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Only proceed with image upload if there are images selected
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

        // Track progress
        let completed = 0;
        for (const promise of uploadPromises) {
          await promise.then((url) => {
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
        images: imageUrls,
      };

      const response = await uploadSingleVehicle(vehicleData);
      console.log("Vehicle uploaded successfully:", response.data);

      toast({
        title: "Success!",
        description: "Your vehicle listing has been created.",
      });

      form.reset();
      setSelectedFiles([]);
      setLocation("/seller");
    } catch (error: any) {
      console.error("Error in form submission:", error);
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

  return (
    <Card className="w-full mx-auto shadow-md">
      <CardHeader className="bg-slate-50">
        <CardTitle className="text-xl">Vehicle Listing Details</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
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
            {/* Full Width Fields */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="registration_num"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Registration Number</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="e.g. ABC-1234"
                        className={`${
                          registrationNumError && " border-2 border-red-600"
                        } `}
                        {...field}
                      />
                    </FormControl>
                    <span className="text-xs text-red-600">
                      {registrationNumError}
                    </span>
                    {registrationNumError && (
                      <div className="text-xs">
                        Enter data manually
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
                    <FormLabel className="font-medium">Vehicle Title</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="Title"
                        {...field}
                        className="w-full"
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
                    <FormLabel className="font-medium">Description</FormLabel>
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
              />
            </div>

            {/* Image Upload Section */}
            <div>
              <h3 className="text-lg font-medium mb-3">Vehicle Images</h3>
              <div className="space-y-4">
                <div className="border border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50">
                  <div className="mb-4">
                    <Upload className="mx-auto h-10 w-10 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">
                      Upload up to 10 images of your vehicle
                    </p>
                    <p className="text-xs text-gray-400">
                      Supported formats: JPG, PNG, WEBP (max 5MB each)
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="relative"
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
                    {selectedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="relative group aspect-square border rounded-md overflow-hidden"
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
                          disabled={isUploading}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Two Column Layout for Basic Info */}
            <div>
              <h3 className="text-lg font-medium mb-3">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vehicle Type</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a vehicle type" />
                          </SelectTrigger>
                          <SelectContent>
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
                              <SelectItem key={condition} value={condition}>
                                {condition}
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
                      <FormLabel>Make</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="e.g. Toyota"
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
                      <FormLabel>Model</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="e.g. Camry"
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
            <div>
              <h3 className="text-lg font-medium mb-3">
                Vehicle Specifications
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g. 2020"
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
                      <FormLabel>Mileage</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g. 45000"
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
                      <FormLabel>Color</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="e.g. Silver"
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
                      <FormLabel>Fuel Type</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select fuel type" />
                          </SelectTrigger>
                          <SelectContent>
                            {vehicleFuelTypes[form.getValues("type")]?.map(
                              (fuel) => (
                                <SelectItem key={fuel} value={fuel}>
                                  {fuel}
                                </SelectItem>
                              )
                            )}
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
                      <FormLabel>Transmission Type</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select fuel type" />
                          </SelectTrigger>
                          <SelectContent>
                            {vehicleTransmissionsTypes[
                              form.getValues("type")
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
                      <FormLabel>Body Type</FormLabel>
                      <FormControl>
                        <Input type="text" placeholder="e.g. SUV" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Two Column Layout for Listing Details */}
            <div>
              <h3 className="text-lg font-medium mb-3">Listing Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g. 15000"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="e.g. New York, NY"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Options as Two Column Grid */}
            <div>
              <h3 className="text-lg font-medium mb-3">Listing Options</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="negotiable"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">
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
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">
                        Open to part exchange
                      </FormLabel>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="pt-2">
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
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default VehicleUploadForm;
