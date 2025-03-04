import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { insertVehicleSchema, type InsertVehicle } from "@shared/schema";
import { ImageOptimizerDialog } from "@/components/image-optimizer-dialog";
import { useState } from "react";
import type { OptimizedImage } from "@/lib/image-optimizer";

interface VehicleFormProps {
  defaultValues?: Partial<InsertVehicle>;
  onSubmit: (data: InsertVehicle) => Promise<void>;
  isSubmitting?: boolean;
}

const conditions = [
  { value: "clean", label: "Clean" },
  { value: "catS", label: "Cat S (Structural Damage)" },
  { value: "catN", label: "Cat N (Non-Structural Damage)" },
];

export default function VehicleForm({
  defaultValues,
  onSubmit,
  isSubmitting,
}: VehicleFormProps) {
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
      openToPX: false,
      condition: "clean",
      sellerType: "private",
      ...defaultValues,
    },
  });

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showOptimizer, setShowOptimizer] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(Array.from(e.target.files));
      setShowOptimizer(true);
    }
  };

  const handleOptimized = (optimizedImages: OptimizedImage[]) => {
    const optimizedFiles = optimizedImages.map(async (img) => {
      const response = await fetch(img.optimized.url);
      const blob = await response.blob();
      return new File([blob], "optimized_image.webp", { type: "image/webp" });
    });

    Promise.all(optimizedFiles).then((files) => {
      setSelectedFiles(files);
      form.setValue("images", files);
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Existing form fields */}

        {/* New fields for PX and condition */}
        <FormField
          control={form.control}
          name="openToPX"
          render={({ field }) => (
            <FormItem className="flex items-center space-x-2">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormLabel className="font-normal">
                Open to Part Exchange (PX)
              </FormLabel>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="condition"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vehicle Condition</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {conditions.map((condition) => (
                    <SelectItem key={condition.value} value={condition.value}>
                      {condition.label}
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
          name="images"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vehicle Images</FormLabel>
              <FormControl>
                <Input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                />
              </FormControl>
              <FormDescription>
                Upload multiple images of the vehicle. Images will be automatically optimized for web.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Vehicle"}
        </Button>
      </form>
      <ImageOptimizerDialog
        images={selectedFiles}
        onOptimized={handleOptimized}
        open={showOptimizer}
        onOpenChange={setShowOptimizer}
      />
    </Form>
  );
}