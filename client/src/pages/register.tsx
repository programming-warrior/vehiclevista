import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import {Link} from "wouter"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Updated Zod Schema for Validation
const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, { message: "Username must be at least 3 characters" })
      .max(50, { message: "Username must be less than 50 characters" })
      .regex(/^[a-zA-Z0-9_]+$/, {
        message: "Username can only contain letters, numbers, and underscores",
      }),

    email: z.string().email({ message: "Invalid email address" }),

    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" })
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        {
          message:
            "Password must include uppercase, lowercase, number, and special character",
        }
      ),

    confirmPassword: z.string(),

    role: z.enum(["buyer", "seller", "trader", "garage"], {
      required_error: "Please select an account type",
    }),

    businessName: z.string().optional(),
    businessAddress: z.string().optional(),

    packageType: z.enum(["standard", "premium", "enterprise"])
      .refine((val) => val !== undefined, { 
        message: "Please select a package type",
        path: ["packageType"]
      })
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine(
    (data) => {
      // Conditional validation for business fields
      if (["trader", "garage"].includes(data.role)) {
        return !!(data.businessName && data.businessAddress);
      }
      return true;
    },
    {
      message: "Business name and address are required for traders and garages",
      path: ["businessName"],
    }
  );

// Type inference from Zod schema
type RegisterForm = z.infer<typeof registerSchema>;

export default function Register() {
  const [, setLocation] = useLocation();
  const [isBusinessFieldsVisible, setIsBusinessFieldsVisible] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { isSubmitting, errors },
    setValue,
    setError,
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      email: "",
      role: "buyer",
      packageType:"standard",
    },
  });

  const roleValue = watch("role");

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

      // TODO: Implement actual registration logic
      // const response = await registerUser(finalSubmitData);

      // Uncomment to redirect
      // setLocation("/login");
    } catch (error: any) {
      console.error("Registration error:", error);
      setError("root", {
        message: error?.message || "Failed to register. Please try again.",
      });
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center mt-5">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            Create an Account
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                {...register("username")}
                type="text"
                placeholder="Choose a username"
              />
              {errors.username && (
                <p className="text-sm text-destructive">
                  {errors.username.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                {...register("email")}
                type="email"
                placeholder="Enter your email"
              />
              {errors.email && (
                <p className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                {...register("password")}
                type="password"
                placeholder="Choose a strong password"
              />
              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                {...register("confirmPassword")}
                type="password"
                placeholder="Repeat your password"
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Account Type</Label>
              <Select
                value={watch("role")}
                defaultValue="buyer"
                onValueChange={(value) => {
                  // @ts-ignore
                  setValue("role", value)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="buyer">Buyer</SelectItem>
                  <SelectItem value="seller">Seller</SelectItem>
                  <SelectItem value="trader">Trader</SelectItem>
                  <SelectItem value="garage">Garage</SelectItem>
                </SelectContent>
              </Select>
              {errors.role && (
                <p className="text-sm text-destructive">
                  {errors.role.message}
                </p>
              )}
            </div>
              <div className="space-y-2">
                <Label htmlFor="packageType">Package Type</Label>
                <Select
                  {...register("packageType")}
                  defaultValue="standard"
                  onValueChange={(value) => {
                    // @ts-ignore
                    register("packageType").onChange({ target: { value } });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select package type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
                {errors.packageType && (
                  <p className="text-sm text-destructive">
                    {errors.packageType.message}
                  </p>
                )}
              </div>

            {isBusinessFieldsVisible && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    {...register("businessName")}
                    type="text"
                    placeholder="Enter your business name"
                  />
                  {errors.businessName && (
                    <p className="text-sm text-destructive">
                      {errors.businessName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessAddress">Business Address</Label>
                  <Input
                    id="businessAddress"
                    {...register("businessAddress")}
                    type="text"
                    placeholder="Enter your business address"
                  />
                  {errors.businessAddress && (
                    <p className="text-sm text-destructive">
                      {errors.businessAddress.message}
                    </p>
                  )}
                </div>
              </>
            )}

            {errors.root && (
              <p className="text-sm text-destructive text-center">
                {errors.root.message}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Register"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter>
            <p className="text-base text-gray-500">Already have an account. <Link href="/login" className="underline text-gray-600">Login</Link> </p>
        </CardFooter>
      </Card>

    </div>
  );
}