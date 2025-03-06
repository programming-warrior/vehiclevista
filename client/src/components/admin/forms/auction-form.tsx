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
import { insertAuctionSchema } from "@shared/schema";

// Client-side form schema matching the server schema
const auctionFormSchema = insertAuctionSchema.extend({
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  startingPrice: z.number().min(0, "Starting price must be non-negative"),
  vehicleId: z.number().min(1, "Vehicle selection is required"),
});

type AuctionFormValues = z.infer<typeof auctionFormSchema>;

interface AuctionFormProps {
  onSuccess?: () => void;
}

const FORM_ID = 'auction-form';

export function AuctionForm({ onSuccess }: AuctionFormProps) {
  const queryClient = useQueryClient();

  const form = useForm<AuctionFormValues>({
    resolver: zodResolver(auctionFormSchema),
    defaultValues: {
      status: "upcoming",
      startingPrice: 0,
      vehicleId: 1, // Temporary default, should be selected by user
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (values: AuctionFormValues) => {
      console.log("Submitting auction form data:", values);

      const formattedValues = {
        ...values,
        startingPrice: Number(values.startingPrice),
        startDate: new Date(values.startDate).toISOString(),
        endDate: new Date(values.endDate).toISOString(),
        vehicleId: Number(values.vehicleId),
      };

      console.log("Formatted auction data:", formattedValues);

      const res = await apiRequest("POST", "/api/auctions", formattedValues);

      if (!res.ok) {
        const error = await res.json();
        console.error("Server validation error:", error);
        throw new Error(error.message || "Failed to create auction");
      }

      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Auction created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auctions"] });
      form.reset();
      onSuccess?.();
    },
    onError: (error: Error) => {
      console.error("Auction creation error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create auction",
        variant: "destructive",
      });
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => mutate(data))} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Summer Car Auction" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Date</FormLabel>
                <FormControl>
                  <Input 
                    type="datetime-local" 
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Date</FormLabel>
                <FormControl>
                  <Input 
                    type="datetime-local" 
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="startingPrice"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Starting Price ($)</FormLabel>
              <FormControl>
                <Input 
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="1000"
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
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input placeholder="Enter auction description" {...field} />
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
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="ended">Ended</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="vehicleId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vehicle</FormLabel>
              <FormControl>
                {/*  Replace this with actual vehicle selection component */}
                <Input type="number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />


        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Creating..." : "Create Auction"}
        </Button>
      </form>
    </Form>
  );
}