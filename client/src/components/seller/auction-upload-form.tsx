import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import {
  CalendarIcon,
  ClockIcon,
  Car,
  Bike,
  DollarSign,
  Info,
  Tag,
  MapPin,
  Calendar as CalendarIconOutline,
  Check,
  AlertCircle,
  CreditCard,
  Package,
} from "lucide-react";
import { createAuction } from "@/api";
import { useToast } from "@/hooks/use-toast";

// Create the form schema for auction creation
const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  itemType: z.enum(["VEHICLE", "REGISTRATION_PLATE"], {
    required_error: "Please select an item type",
  }),
  startingPrice: z.number().min(1, "Starting price must be greater than 0"),
  durationDays: z.enum(["3", "5", "7"], {
    required_error: "Please select auction duration",
  }),
});

export default function AuctionUploadForm({
  pullData,
}: {
  pullData?: (data: any) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  // Setup form with default values
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      startingPrice: 0,
      durationDays: "3",
      description: "",
      title: "",
      itemType: undefined,
    },
  });

  console.log("form errors", form.formState.errors);

  const onSubmit = async (values: any) => {
    console.log(values);

    // Format data for submission without itemId
    const auctionData = {
      itemType: values.itemType,
      durationDays: values.durationDays,
      startingPrice: values.startingPrice,
      description: values.description,
      title: values.title,
    };

    try {
      setUploading(true);
      const res = await createAuction(auctionData);
      if (pullData && typeof pullData === "function") {
        pullData({
          ...auctionData,
          draftId: res.draftId,
        });
      }
      toast({
        title: "Success",
        description: "Auction details saved! Now add your item details.",
        className: "bg-blue-50 border-blue-200",
      });
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Failed to create auction",
        description: e.message || "Something went wrong. Please try again.",
      });
    } finally {
      setUploading(false);
    }
  };

  const itemTypes = [
    {
      value: "VEHICLE",
      label: "Vehicle",
      icon: Car,
      description: "Cars, motorcycles, trucks, and other vehicles",
    },
    {
      value: "REGISTRATION_PLATE",
      label: "Registration Plate",
      icon: CreditCard,
      description: "Custom or premium registration plates",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="shadow-lg border-0 bg-white">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white rounded-t-xl">
          <div className="flex items-center">
            <div className="bg-white/20 p-3 rounded-full mr-4">
              <CalendarIconOutline className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Create Your Auction</h2>
              <p className="text-blue-100 mt-1">
                Set up the basic details for your auction listing
              </p>
            </div>
          </div>
        </div>

        <CardContent className="p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Item Type Selection */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="itemType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg font-semibold text-gray-900 flex items-center">
                        <Package className="h-5 w-5 mr-2 text-blue-600" />
                        What are you auctioning?
                      </FormLabel>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        {itemTypes.map((type) => {
                          const Icon = type.icon;
                          const isSelected = field.value === type.value;
                          
                          return (
                            <div
                              key={type.value}
                              className={`
                                relative border-2 rounded-xl p-6 cursor-pointer transition-all duration-200
                                ${isSelected 
                                  ? 'border-blue-500 bg-blue-50 shadow-md' 
                                  : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
                                }
                              `}
                              onClick={() => field.onChange(type.value)}
                            >
                              <div className="flex items-start space-x-4">
                                <div className={`
                                  p-3 rounded-lg 
                                  ${isSelected ? 'bg-blue-100' : 'bg-gray-100'}
                                `}>
                                  <Icon className={`
                                    h-6 w-6 
                                    ${isSelected ? 'text-blue-600' : 'text-gray-600'}
                                  `} />
                                </div>
                                <div className="flex-1">
                                  <h3 className={`
                                    font-semibold mb-2 
                                    ${isSelected ? 'text-blue-900' : 'text-gray-900'}
                                  `}>
                                    {type.label}
                                  </h3>
                                  <p className="text-sm text-gray-600">
                                    {type.description}
                                  </p>
                                </div>
                              </div>
                              {isSelected && (
                                <div className="absolute top-4 right-4">
                                  <div className="bg-blue-500 rounded-full p-1">
                                    <Check className="h-3 w-3 text-white" />
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <FormMessage className="text-red-500" />
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
                    <FormLabel className="text-gray-900 font-semibold">
                      Auction Title
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        className="border-gray-300 focus:ring-blue-500 focus:border-blue-500 h-12"
                        placeholder="Enter an attractive title for your auction..."
                        {...field}
                      />
                    </FormControl>
                    <p className="text-sm text-gray-500">
                      Create a compelling title that describes your item
                    </p>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-900 font-semibold">
                      Auction Description
                    </FormLabel>
                    <FormControl>
                      <textarea
                        className="w-full min-h-32 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        placeholder="Provide detailed information about your item, its condition, special features, and any terms or conditions for the auction..."
                        {...field}
                      />
                    </FormControl>
                    <p className="text-sm text-gray-500">
                      Be detailed and honest to attract serious bidders
                    </p>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Starting Price */}
                <FormField
                  control={form.control}
                  name="startingPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-900 font-semibold">
                        Starting Price (₹)
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            className="pl-10 border-gray-300 focus:ring-blue-500 focus:border-blue-500 h-12"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value))
                            }
                          />
                        </div>
                      </FormControl>
                      <p className="text-sm text-gray-500">
                        Minimum starting bid amount
                      </p>
                      <FormMessage className="text-red-500" />
                    </FormItem>
                  )}
                />

                {/* Duration */}
                <FormField
                  control={form.control}
                  name="durationDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-900 font-semibold">
                        Auction Duration
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-12 border-gray-300 focus:ring-blue-500">
                            <SelectValue placeholder="Select duration" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="3">3 Days</SelectItem>
                          <SelectItem value="5">5 Days</SelectItem>
                          <SelectItem value="7">7 Days</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-gray-500">
                        How long the auction will run
                      </p>
                      <FormMessage className="text-red-500" />
                    </FormItem>
                  )}
                />
              </div>

              {/* Submit Button */}
              <div className="pt-6 border-t border-gray-200">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-gray-500 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-2 text-blue-500" />
                    Next, you'll add specific details about your item
                  </div>
                  <Button
                    type="submit"
                    disabled={uploading}
                    className="bg-blue-600 hover:bg-blue-700 text-white h-12 px-8 flex items-center gap-2 text-base font-semibold shadow-lg"
                  >
                    {uploading ? (
                      <>Creating...</>
                    ) : (
                      <>
                        Continue
                        <Check className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}