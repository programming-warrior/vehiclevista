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
  FormDescription,
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-store";
import { useLocation } from "wouter";
import { submitTraderRequest, getMyTraderRequest } from "@/api";
import { 
  AlertCircle, 
  Building2, 
  FileText, 
  CheckCircle, 
  Loader2,
  Info
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import type { TraderRequest } from "@shared/schema";

const traderFormSchema = z.object({
  ukCompanyName: z.string()
    .min(2, "Company name must be at least 2 characters")
    .max(200, "Company name must be less than 200 characters"),
  ukCompanyNumber: z.string()
    .min(8, "Company number must be at least 8 characters")
    .max(8, "Company number must be 8 characters")
    .regex(/^[A-Z0-9]{8}$/, "Company number must be 8 alphanumeric characters (e.g., 12345678 or SC123456)"),
  confirmIrreversible: z.boolean().refine((val) => val === true, {
    message: "You must acknowledge this is an irreversible action",
  }),
});

type TraderFormValues = z.infer<typeof traderFormSchema>;

export default function TraderCreate() {
  const { userId, role } = useUser();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [existingRequest, setExistingRequest] = useState<TraderRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<TraderFormValues>({
    resolver: zodResolver(traderFormSchema),
    defaultValues: {
      ukCompanyName: "",
      ukCompanyNumber: "",
      confirmIrreversible: false,
    },
  });

  useEffect(() => {
    // Redirect if user is already a trader or admin
    if (role === "trader" || role === "admin") {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "You already have trader access or are an admin.",
      });
      setLocation("/");
      return;
    }

    // Redirect if not logged in
    if (!userId) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please log in to apply for trader status.",
      });
      setLocation("/login");
      return;
    }

    // Check for existing trader request
    const checkExistingRequest = async () => {
      try {
        setIsLoading(true);
        const request = await getMyTraderRequest();
        setExistingRequest(request);
        
        // If there's a pending request, redirect to profile
        if (request && request.status === "PENDING") {
          toast({
            title: "Application Already Submitted",
            description: "You already have a pending trader application. Please wait for it to be reviewed.",
          });
          setLocation("/profile?tab=trader-status");
        }
      } catch (error) {
        console.error("Error checking existing request:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkExistingRequest();
  }, [userId, role]);

  const onSubmit = async (data: TraderFormValues) => {
    try {
      setIsSubmitting(true);
      
      const response = await submitTraderRequest({
        ukCompanyName: data.ukCompanyName,
        ukCompanyNumber: data.ukCompanyNumber,
      });

      setHasSubmitted(true);
      toast({
        title: "Application Submitted Successfully",
        description: "Your trader application has been submitted for review. We'll notify you once it's been processed.",
      });

      // Redirect to profile after 3 seconds
      setTimeout(() => {
        setLocation("/profile");
      }, 3000);

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: error.message || "Failed to submit trader application. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (hasSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <div className="flex items-center justify-center mb-4">
                <CheckCircle className="h-16 w-16 text-green-600" />
              </div>
              <CardTitle className="text-center text-2xl">
                {existingRequest?.status === "REJECTED" ? "Reapplication Submitted!" : "Application Submitted!"}
              </CardTitle>
              <CardDescription className="text-center text-base mt-2">
                Your trader application has been successfully submitted and is now under review.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>What happens next?</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Our team will review your application</li>
                    <li>We'll verify your UK company details</li>
                    <li>You'll receive a notification once the review is complete</li>
                    <li>This process typically takes 1-3 business days</li>
                  </ul>
                </AlertDescription>
              </Alert>
              {existingRequest?.status === "REJECTED" && (
                <Alert className="mt-4 bg-blue-50 border-blue-200">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertTitle className="text-blue-900">Reapplication Notice</AlertTitle>
                  <AlertDescription className="text-blue-800">
                    We'll carefully review your new application. Make sure you've addressed the previous rejection reasons.
                  </AlertDescription>
                </Alert>
              )}
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">Redirecting you to your profile...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Building2 className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900">
            {existingRequest?.status === "REJECTED" ? "Reapply for Trader Status" : "Apply for Trader Status"}
          </h1>
          <p className="mt-2 text-gray-600">
            Become a verified trader and unlock premium features
          </p>
        </div>

        {/* Reapplication Notice */}
        {existingRequest?.status === "REJECTED" && (
          <Alert className="mb-6 border-amber-200 bg-amber-50">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-900">Previous Application Rejected</AlertTitle>
            <AlertDescription className="text-amber-800">
              <p className="mb-2">Your previous application was rejected for the following reason:</p>
              <p className="font-semibold italic">"{existingRequest.rejectionReason}"</p>
              <p className="mt-2">Please address these concerns in your new application.</p>
            </AlertDescription>
          </Alert>
        )}

        {/* Warning Alert */}
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Important Notice</AlertTitle>
          <AlertDescription>
            <strong>This action is irreversible.</strong> Once you apply for trader status and it's approved, 
            your account will be permanently upgraded. Please ensure all information is accurate before submitting.
          </AlertDescription>
        </Alert>

        {/* Info Alert */}
        <Alert className="mb-6 border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-900">Trader Benefits</AlertTitle>
          <AlertDescription className="text-blue-800">
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Access to professional trading tools</li>
              <li>Enhanced listing visibility</li>
              <li>Priority customer support</li>
              <li>Advanced analytics and reporting</li>
              <li>Bulk upload capabilities</li>
            </ul>
          </AlertDescription>
        </Alert>

        {/* Form Card */}
        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
            <CardDescription>
              Please provide your UK company registration details. All information will be verified.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* UK Company Name */}
                <FormField
                  control={form.control}
                  name="ukCompanyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        UK Company Name
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., ABC Motors Limited"
                          {...field}
                          disabled={isSubmitting}
                          className="text-base"
                        />
                      </FormControl>
                      <FormDescription>
                        Enter the full legal name of your UK registered company
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* UK Company Number */}
                <FormField
                  control={form.control}
                  name="ukCompanyNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        UK Company Number
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., 12345678 or SC123456"
                          {...field}
                          disabled={isSubmitting}
                          className="text-base uppercase"
                          onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        />
                      </FormControl>
                      <FormDescription>
                        Enter your 8-character Companies House registration number
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Confirmation Checkbox */}
                <FormField
                  control={form.control}
                  name="confirmIrreversible"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-amber-50 border-amber-200">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-medium cursor-pointer">
                          I understand this is an irreversible action
                        </FormLabel>
                        <FormDescription className="text-xs">
                          By checking this box, I confirm that I understand my account will be permanently 
                          upgraded to trader status upon approval, and this action cannot be undone.
                        </FormDescription>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                {/* Submit Button */}
                <div className="flex gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLocation("/profile")}
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || !form.watch("confirmIrreversible")}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Application"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>
            Need help? Contact our support team at{" "}
            <a href="mailto:support@vehiclevista.com" className="text-blue-600 hover:underline">
              support@vehiclevista.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
