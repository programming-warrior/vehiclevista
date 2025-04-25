import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Link } from "wouter";
import { Loader2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { userRegisterSchema } from "@shared/zodSchema/userSchema";
import { useUser } from "@/hooks/use-store";
import { registerUser } from "@/api";
import { useToast } from "@/hooks/use-toast";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { STRIPE_PUBLIC_KEY } from "@/lib/constants";

console.log(STRIPE_PUBLIC_KEY)

const stripePromise = loadStripe(STRIPE_PUBLIC_KEY);

type RegisterForm = z.infer<typeof userRegisterSchema>;

function StripeCardForm({
  onCardVerified,
  onSkip,
}: {
  onCardVerified: (paymentMethodId: string) => void;
  onSkip: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!stripe || !elements) {
      setError("Stripe not loaded");
      setLoading(false);
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError("Card element not found");
      setLoading(false);
      return;
    }

    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: "card",
      card: cardElement,
    });

    if (error) {
      setError(error.message || "Card verification failed");
      setLoading(false);
    } else if (paymentMethod) {
      onCardVerified(paymentMethod.id);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <CardElement options={{ style: { base: { fontSize: "16px" } } }} />
      {error && <div className="text-red-500 text-sm">{error}</div>}
      <div className="flex gap-2">
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Verify Card"}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={onSkip}
          disabled={loading}
        >
          Skip
        </Button>
      </div>
    </form>
  );
}

export default function Register() {
  const [, setLocation] = useLocation();
  const [isBusinessFieldsVisible, setIsBusinessFieldsVisible] = useState(false);
  const { userId, role, setUser } = useUser();
  const { toast } = useToast();

  const form = useForm<RegisterForm>({
    resolver: zodResolver(userRegisterSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      email: "",
      role: "buyer",
      businessAddress: "",
      businessName: "",
      card: undefined,
    },
  });

  const [showCardForm, setShowCardForm] = useState(false);
  const [cardSkipped, setCardSkipped] = useState(false);
  const [paymentMethodId, setPaymentMethodId] = useState<string | null>(null);

  // Watch for role changes to show/hide business fields
  const roleValue = form.watch("role");

  useEffect(() => {
    setIsBusinessFieldsVisible(["trader", "garage"].includes(roleValue));
  }, [roleValue]);

  const onSubmit = async (data: RegisterForm) => {
    try {
      const submitData = {
        ...data,
        ...(isBusinessFieldsVisible
          ? {
              businessName: data.businessName,
              businessAddress: data.businessAddress,
            }
          : {}),
        card: !cardSkipped && paymentMethodId ? { paymentMethodId } : undefined,
      };
      console.log(submitData);
      const res = await registerUser(submitData);
      setUser({
        role: res.role,
        userId: res.userId,
        card_Verified: res.card_verified
      });
      toast({
        title: "Success!",
        description: "Registration Successful!",
      });
      // localStorage.setItem("sessionId", res.sessionId);
      setLocation("/");
    } catch (error: any) {
      form.setError("root", {
        message: error?.message || "Failed to register. Please try again.",
      });
      toast({
        variant: "destructive",
        title: "Failed!",
        description: "Something went wrong!",
      });
    }
  };

  if (userId && role) setLocation("/");

  return (
    <Elements stripe={stripePromise}>
      <div className="min-h-[80vh] flex items-center justify-center mt-5">
        <Card className="w-full max-w-[800px] mx-4">
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              Create an Account
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!showCardForm ? (
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(() => setShowCardForm(true))}
                  className="space-y-4"
                >
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
                          <Input
                            type="email"
                            placeholder="Enter your email"
                            {...field}
                          />
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
                          <Input
                            type="password"
                            placeholder="Choose a strong password"
                            {...field}
                          />
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
                          <Input
                            type="password"
                            placeholder="Repeat your password"
                            {...field}
                          />
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
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
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
                              <Input
                                placeholder="Enter your business name"
                                {...field}
                              />
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
                              <Input
                                placeholder="Enter your business address"
                                {...field}
                              />
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
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={form.formState.isSubmitting}
                  >
                    {form.formState.isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      "Continue"
                    )}
                  </Button>
                </form>
              </Form>
            ) : (
              <div>
                <h2 className="text-xl font-semibold mb-2 text-center">
                  Add Card Details
                </h2>
                {!paymentMethodId && !cardSkipped ? (
                  <StripeCardForm
                    onCardVerified={(id) => setPaymentMethodId(id)}
                    onSkip={() => setCardSkipped(true)}
                  />
                ) : (
                  <div className="text-green-600 text-center mb-4">
                    {cardSkipped
                      ? "You chose to skip adding a card."
                      : "Card verified successfully!"}
                  </div>
                )}
                <Button
                  className="w-full mt-4"
                  onClick={form.handleSubmit(onSubmit)}
                  disabled={
                    form.formState.isSubmitting ||
                    (!paymentMethodId && !cardSkipped)
                  }
                >
                  {form.formState.isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    "Register"
                  )}
                </Button>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <p className="text-base text-gray-500">
              Already have an account.{" "}
              <Link href="/login" className="underline text-gray-600">
                Login
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </Elements>
  );
}
