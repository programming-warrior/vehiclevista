import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Link } from "wouter";
import { Loader2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { useAuth } from "@/hooks/use-auth";
import { userRegisterSchema } from "@shared/zodSchema/userSchema";

// Type inference from Zod schema
type RegisterForm = z.infer<typeof userRegisterSchema>;

export default function Register() {
  const [, setLocation] = useLocation();
  const [isBusinessFieldsVisible, setIsBusinessFieldsVisible] = useState(false);
  const { signup, user, isLoading } = useAuth();

  // Initialize form with shadcn Form
  const form = useForm<RegisterForm>({
    resolver: zodResolver(userRegisterSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      email: "",
      role: "buyer",
    },
  });

  // Watch for role changes to show/hide business fields
  const roleValue = form.watch("role");

  useEffect(() => {
    // Show/hide business fields based on role
    const isBusinessRole = ["trader", "garage"].includes(roleValue);
    setIsBusinessFieldsVisible(isBusinessRole);
  }, [roleValue]);

  const onSubmit = async (data: RegisterForm) => {
    try {
      // Remove confirmPassword before sending to backend
      const { confirmPassword, ...submitData } = data;

      // Conditional business fields based on role
      const finalSubmitData = {
        ...submitData,
        ...(isBusinessFieldsVisible
          ? {
              businessName: data.businessName,
              businessAddress: data.businessAddress
            }
          : {}),
      };

      console.log("Submitted Data:", finalSubmitData);

      await signup(finalSubmitData);
      setLocation("/");
      
    } catch (error: any) {
      console.error("Registration error:", error);
      form.setError("root", {
        message: error?.message || "Failed to register. Please try again.",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (user) setLocation("/");

  return (
    <div className="min-h-[80vh] flex items-center justify-center mt-5">
      <Card className="w-full max-w-[800px] mx-4">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            Create an Account
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Choose a username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Enter your email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Choose a strong password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Repeat your password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select account type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="buyer">Buyer</SelectItem>
                        <SelectItem value="seller">Seller</SelectItem>
                        <SelectItem value="trader">Trader</SelectItem>
                        <SelectItem value="garage">Garage</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />


              {isBusinessFieldsVisible && (
                <>
                  <FormField
                    control={form.control}
                    name="businessName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your business name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="businessAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Address</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your business address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {form.formState.errors.root && (
                <p className="text-sm text-destructive text-center">
                  {form.formState.errors.root.message}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Register"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter>
          <p className="text-base text-gray-500">Already have an account. <Link href="/login" className="underline text-gray-600">Login</Link></p>
        </CardFooter>
      </Card>
    </div>
  );
}