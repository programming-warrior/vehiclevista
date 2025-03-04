import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertVehicleSchema, type InsertVehicle } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Image, Plus, X, Loader2, Search } from "lucide-react";
import { categories, makes, bodyTypes } from "@/lib/mock-data";
import { optimizeImages } from "@/lib/image-optimizer";
import { lookupVehicle } from "@/lib/dvsa-service";
import { useToast } from "@/hooks/use-toast";

interface VehicleFormProps {
  defaultValues?: Partial<InsertVehicle>;
  onSubmit: (data: InsertVehicle) => Promise<void>;
  isSubmitting?: boolean;
}

export default function VehicleForm({
  defaultValues,
  onSubmit,
  isSubmitting,
}: VehicleFormProps) {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const { toast } = useToast();
  const [registrationNumber, setRegistrationNumber] = useState("");

  const form = useForm<InsertVehicle>({
    resolver: zodResolver(insertVehicleSchema),
    defaultValues: {
      title: "",
      price: 0,
      year: new Date().getFullYear(),
      make: "",
      model: "",
      mileage: 0,
      fuelType: "",
      transmission: "",
      bodyType: "",
      color: "",
      description: "",
      location: "",
      latitude: 0,
      longitude: 0,
      images: [],
      category: "",
      ...defaultValues,
    },
  });

  const handleLookup = async () => {
    if (!registrationNumber) {
      toast({
        title: "Error",
        description: "Please enter a registration number",
        variant: "destructive",
      });
      return;
    }

    setIsLookingUp(true);
    try {
      const vehicleDetails = await lookupVehicle(registrationNumber);

      // Update form with fetched details
      form.setValue("make", vehicleDetails.make);
      form.setValue("model", vehicleDetails.model);
      form.setValue("year", vehicleDetails.yearOfManufacture);
      form.setValue("fuelType", vehicleDetails.fuelType.toLowerCase());
      form.setValue("color", vehicleDetails.color);
      form.setValue("title", `${vehicleDetails.year} ${vehicleDetails.make} ${vehicleDetails.model}`);

      toast({
        title: "Success",
        description: "Vehicle details fetched successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch vehicle details",
        variant: "destructive",
      });
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleImageAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    setIsOptimizing(true);
    try {
      // Optimize all images
      const optimizedUrls = await optimizeImages(files);

      // Get current images from form
      const currentImages = form.getValues("images") || [];

      // Update form with combined images
      form.setValue("images", [...currentImages, ...optimizedUrls]);
    } catch (error) {
      console.error("Image optimization failed:", error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const removeImage = (index: number) => {
    const currentImages = form.getValues("images") || [];
    const newImages = currentImages.filter((_, i) => i !== index);
    form.setValue("images", newImages);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex gap-4">
          <div className="flex-1">
            <FormItem>
              <FormLabel>Registration Number</FormLabel>
              <div className="flex gap-2">
                <Input
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value.toUpperCase())}
                  placeholder="Enter registration"
                  className="uppercase"
                />
                <Button
                  type="button"
                  onClick={handleLookup}
                  disabled={isLookingUp}
                  variant="secondary"
                >
                  {isLookingUp ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </FormItem>
          </div>
        </div>

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter vehicle title" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price (£)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="year"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Year</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="make"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Make</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select make" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {makes.map((make) => (
                      <SelectItem key={make} value={make}>
                        {make}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  <Input {...field} placeholder="Enter model" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories
                      .filter((cat) => cat.id !== "all")
                      .map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
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
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select body type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {bodyTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="images"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Images</FormLabel>
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-4">
                  {field.value?.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`Vehicle image ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 p-1 bg-background/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <label className="flex items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary">
                    <div className="flex flex-col items-center">
                      {isOptimizing ? (
                        <>
                          <Loader2 className="h-8 w-8 mb-2 animate-spin" />
                          <span className="text-sm">Optimizing...</span>
                        </>
                      ) : (
                        <>
                          <Plus className="h-8 w-8 mb-2" />
                          <span className="text-sm">Add Image</span>
                          <span className="text-xs text-muted-foreground">Images will be optimized</span>
                        </>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleImageAdd}
                      disabled={isOptimizing}
                    />
                  </label>
                </div>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Enter vehicle description"
                  className="min-h-[100px]"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting || isOptimizing}>
          {isSubmitting ? "Saving..." : "Save Vehicle"}
        </Button>
      </form>
    </Form>
  );
}