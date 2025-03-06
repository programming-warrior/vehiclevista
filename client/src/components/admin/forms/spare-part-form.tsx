import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertSparePartSchema } from "@shared/schema";

// Client-side form schema matching the server schema
const sparePartFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  partNumber: z.string().min(1, "Part number is required"),
  manufacturer: z.string().min(1, "Manufacturer is required"),
  category: z.string().min(1, "Category is required"),
  price: z.number().min(0, "Price must be non-negative"),
  stockLevel: z.number().min(0, "Stock level must be non-negative"),
  minStockLevel: z.number().min(0, "Minimum stock level must be non-negative"),
  status: z.enum(["available", "low-stock", "out-of-stock"]),
  location: z.string().min(1, "Location is required"),
  description: z.string().min(1, "Description is required"),
});

type SparePartFormValues = z.infer<typeof sparePartFormSchema>;

interface SparePartFormProps {
  onSuccess?: () => void;
}

const FORM_ID = 'spare-part-form';

export function SparePartForm({ onSuccess }: SparePartFormProps) {
  const queryClient = useQueryClient();

  const form = useForm<SparePartFormValues>({
    resolver: zodResolver(sparePartFormSchema),
    defaultValues: {
      status: "available",
      price: 0,
      stockLevel: 0,
      minStockLevel: 0,
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (values: SparePartFormValues) => {
      console.log("Submitting spare part form data:", values);

      const formattedValues = {
        ...values,
        // Ensure numeric fields are properly formatted
        price: Number(values.price),
        stockLevel: Number(values.stockLevel),
        minStockLevel: Number(values.minStockLevel),
      };

      const res = await apiRequest("POST", "/api/spare-parts", formattedValues);

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create spare part");
      }

      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Spare part created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/spare-parts"] });
      form.reset();
      onSuccess?.();
    },
    onError: (error: Error) => {
      console.error("Spare part creation error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create spare part",
        variant: "destructive",
      });
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => mutate(data))} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter part name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="partNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Part Number</FormLabel>
              <FormControl>
                <Input placeholder="Enter part number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="manufacturer"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Manufacturer</FormLabel>
              <FormControl>
                <Input placeholder="Enter manufacturer" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <FormControl>
                <Input placeholder="Enter category" {...field} />
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
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input placeholder="Enter description" {...field} />
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
                <Input placeholder="Enter storage location" {...field} />
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
                <FormLabel>Price ($)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="0" 
                    step="0.01"
                    placeholder="99.99" 
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="stockLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current Stock Level</FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    min="0"
                    placeholder="100"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="minStockLevel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Minimum Stock Level</FormLabel>
              <FormControl>
                <Input 
                  type="number"
                  min="0"
                  placeholder="10"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="low-stock">Low Stock</SelectItem>
                  <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Creating..." : "Create Spare Part"}
        </Button>
      </form>
    </Form>
  );
}