import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { dvsaApi } from "@/api";

// Simple schema for registration and mileage
const formSchema = z.object({
  registration_num: z.string().min(1, "Registration number is required"),
  mileage: z.number().min(0, "Mileage must be a positive number"),
});

const FindVehicleCard = ({
  pullData,
}: {
  pullData?: (vehicleData: any) => void;
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      registration_num: "",
      mileage: undefined,
    },
  });

  async function onSubmit(data: any) {
    setIsLoading(true);
    try {
      const vehicleInfo = await dvsaApi(data.registration_num);

      const vehicleData = {
        ...vehicleInfo,
        mileage: data.mileage,
        registration_num: data.registration_num,
      };

      if (pullData && typeof pullData === "function") {
        pullData(vehicleData);
      }

      toast({
        title: "Success!",
        description: "Vehicle information retrieved successfully.",
      });
    } catch (error: any) {
      if (pullData && typeof pullData === "function") {
        pullData(null);
      }
      toast({
        title: "Error",
        description: error.message || "Failed to retrieve vehicle information",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg border-blue-100">
      <CardHeader className="bg-blue-50 border-b border-blue-100">
        <CardTitle className="text-xl text-blue-800">
          Find Vehicle Details
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="registration_num"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-blue-800">
                    Registration Number
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter registration number"
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
                  <FormLabel className="text-blue-800">
                    Current Mileage
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter current mileage"
                      className="border-blue-200 focus:ring-blue-500 focus:border-blue-500"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <Search className="mr-2 h-4 w-4" />
                  Find Vehicle
                </div>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default FindVehicleCard;
