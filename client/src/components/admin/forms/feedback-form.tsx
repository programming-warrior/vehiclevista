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
import { Textarea } from "@/components/ui/textarea";
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
import { insertFeedbackSchema } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";

// Client-side form schema matching the server schema
const feedbackFormSchema = insertFeedbackSchema.extend({
  category: z.enum(["general", "bug", "feature", "support"], {
    required_error: "Category is required",
  }),
  priority: z.enum(["low", "medium", "high"], {
    required_error: "Priority is required",
  }),
});

type FeedbackFormValues = z.infer<typeof feedbackFormSchema>;

interface FeedbackFormProps {
  onSuccess?: () => void;
}

const FORM_ID = 'feedback-form';

export function FeedbackForm({ onSuccess }: FeedbackFormProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const form = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackFormSchema),
    defaultValues: {
      category: "general",
      priority: "medium",
      status: "new",
      submittedBy: user?.username || '',
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (values: FeedbackFormValues) => {
      console.log("Submitting feedback form data:", values);

      // Ensure submittedBy is set from the authenticated user
      const formattedValues = {
        ...values,
        submittedBy: user?.username || 'anonymous',
      };

      console.log("Formatted feedback data:", formattedValues);

      const res = await apiRequest("POST", "/api/feedbacks", formattedValues);

      if (!res.ok) {
        const error = await res.json();
        console.error("Server validation error:", error);
        throw new Error(error.message || "Failed to submit feedback");
      }

      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Feedback submitted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/feedbacks"] });
      form.reset();
      onSuccess?.();
    },
    onError: (error: Error) => {
      console.error("Feedback submission error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit feedback",
        variant: "destructive",
      });
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => mutate(data))} className="space-y-4">
        <FormField
          control={form.control}
          name="subject"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subject</FormLabel>
              <FormControl>
                <Input placeholder="Enter feedback subject" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Message</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter feedback message"
                  className="min-h-[100px]"
                  {...field}
                />
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
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="bug">Bug</SelectItem>
                  <SelectItem value="feature">Feature Request</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="priority"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Priority</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Submitting..." : "Submit Feedback"}
        </Button>
      </form>
    </Form>
  );
}