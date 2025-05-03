import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { uploadListingReport, uploadUserReport } from "@/api";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";


const reportSchema = z.object({
  description: z.string().min(10, "Description must be at least 10 characters long")
});


const ReportDialog = ({ isOpen, onOpenChange, type, targetId }: any) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      description: "",
    },
  });

  const onSubmit = async (data:any) => {
    setIsSubmitting(true);
    
    try {
      // Call the appropriate API function based on the report type
      if (type === "vehicle" || type === "auction") {
        await uploadListingReport({
          ...(type === 'vehicle' ? { vehicleId: targetId } : { auctionId: targetId }),
          description: data.description,
        });
      } else if (type === "user") {
        await uploadUserReport({
          userId: targetId,
          description: data.description,
        });
      }
      
      // Show success message
      toast({
        title: "Report submitted",
        description: "Thank you for helping us keep the platform safe.",
      });
      
      // Close dialog and reset form
      onOpenChange(false);
      form.reset();
      
    } catch (err:any) {
      // Handle error
      toast({
        variant: "destructive",
        title: "Failed to submit report",
        description: err.message || "Something went wrong.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Report {type === "user" ? "User" : "Vehicle"}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Reason for Report</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={`Describe the issue with this ${type === "user" ? "user" : "vehicle"}...`}
                      className="min-h-32 w-full resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit Report"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ReportDialog;