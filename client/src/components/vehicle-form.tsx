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

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Vehicle"}
        </Button>
      </form>
    </Form>
  );
}
