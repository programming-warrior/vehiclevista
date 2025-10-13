import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Link } from "wouter";
import { Loader2, CreditCard, User, Mail, Lock, Building2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
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
import { registerUser, googleAuth, sendRegistrationOtp, verifyRegistrationOtp } from "@/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input as UiInput } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { BACKEND_URL, STRIPE_PUBLIC_KEY } from "@/lib/constants";
import axios from "axios";

console.log(STRIPE_PUBLIC_KEY);

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

  const cardElementOptions = {
    style: {
      base: {
        fontSize: "16px",
        color: "#1f2937",
        fontFamily: '"Inter", sans-serif',
        "::placeholder": {
          color: "#6b7280",
        },
      },
      invalid: {
        color: "#ef4444",
      },
    },
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-xl border border-blue-100">
      <div className="flex items-center gap-2 mb-4">
        <CreditCard className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          Payment Information
        </h3>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-4 border border-gray-200 rounded-lg bg-white">
          <CardElement options={cardElementOptions} />
        </div>
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-red-600 text-sm font-medium">{error}</div>
          </div>
        )}
        <div className="flex gap-3">
          <Button
            type="submit"
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Verify Card
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-2.5"
            onClick={onSkip}
            disabled={loading}
          >
            Skip for now
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function Register() {
  const [, setLocation] = useLocation();
  const [isBusinessFieldsVisible, setIsBusinessFieldsVisible] = useState(false);
  const { userId, role, setUser } = useUser();
  const { toast } = useToast();

  // Pending registration data until OTP verification
  const [pendingRegistration, setPendingRegistration] = useState<any | null>(null);
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [resendAvailable, setResendAvailable] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(60);

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
  const [isOtpVerified, setIsOtpVerified] = useState(false);

  // Watch for role changes to show/hide business fields
  const roleValue = form.watch("role") || "";

  useEffect(() => {
    setIsBusinessFieldsVisible(["trader", "garage"].includes(roleValue));
  }, [roleValue]);

  const onSubmitFirstForm = async (data: RegisterForm) => {
    // Store pending registration data and trigger OTP send
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
      // Save pending data in state for final submission after OTP verification
      setPendingRegistration(submitData as any);
      await sendRegistrationOtp(data.email);
      setOtpDialogOpen(true);
      startOtpTimer();
      toast({ title: "OTP sent", description: "Check your email for the OTP" });

    } catch (error: any) {
      form.setError("root", {
        message: error?.message || "Failed to send OTP. Please try again.",
      });
      toast({
        variant: "destructive",
        title: "OTP Error",
        description: error?.message || "Failed to send OTP. Please try again.",
      });
    }
  };

  const onFinalSubmit = async (data: RegisterForm) => {
    console.log(isOtpVerified);
    if (!isOtpVerified) return;
    console.log(form.formState.errors)
    // form.setError("root", { message: "" });
    try {
      const res = await registerUser(data);
      localStorage.setItem("sessionId", res.sessionId);
      setUser({
        role: res.role,
        userId: res.userId,
        card_Verified: res.card_verified,
      });
      toast({ title: "Registration complete", description: "Account created" });
    }
    catch (e: any) {
        toast({
        variant: "destructive",
        title: "Signup Failed",
        description: e?.message || "",
      });
    }
  }


  function startOtpTimer() {
    setResendAvailable(false);
    setTimerSeconds(60);
  }

  useEffect(() => {
    let timer: any = null;
    if (otpDialogOpen && timerSeconds > 0) {
      timer = setTimeout(() => setTimerSeconds((s) => s - 1), 1000);
    } else if (otpDialogOpen && timerSeconds === 0) {
      setResendAvailable(true);
    }
    return () => clearTimeout(timer);
  }, [otpDialogOpen, timerSeconds]);

  const handleVerifyOtp = async () => {
    if (!pendingRegistration) return;
    setOtpError(null);
    try {
      await verifyRegistrationOtp(pendingRegistration.email, otpValue);
      // OTP verified => complete registration
      setOtpDialogOpen(false);
      setShowCardForm(true);
      setIsOtpVerified(true);
    } catch (err: any) {
      setOtpError(err?.message || "Invalid OTP");
    }
  };

  const handleResendOtp = async () => {
    if (!pendingRegistration) return;
    try {
      await sendRegistrationOtp(pendingRegistration.email);
      setTimerSeconds(60);
      setResendAvailable(false);
      setOtpValue("");
      toast({ title: "OTP resent", description: "Check your email" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err?.message || "Failed to resend OTP" });
    }
  };

  async function handleGoogleRegister(credentialResponse: any) {
    console.log(credentialResponse);
    const decoded = jwtDecode(credentialResponse.credential);
    console.log(decoded);
    try {
      const res = await googleAuth(credentialResponse);
      localStorage.setItem("sessionId", res.sessionId);
      setUser({
        role: res.role,
        userId: res.userId,
        card_Verified: res.card_verified,
      });
      // setShowCardForm(true);
      setLocation("/profile");
      toast({
        title: "Google Sign-in Successful",
        description:
          "Please complete your registration by adding payment details.",
      });
    } catch (error: any) {
      console.error("Google sign-in error:", error);
      toast({
        variant: "destructive",
        title: "Google Sign-in Failed",
        description:
          error?.response?.data?.error ||
          "Failed to sign in with Google. Please try again.",
      });
    }
  }

  if (userId && role) setLocation("/");

  return (
    <Elements stripe={stripePromise}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl shadow-xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
            <CardTitle className="text-3xl font-bold">Create Account</CardTitle>
            <p className="text-blue-100 mt-2">
              Join our platform and get started today
            </p>
          </CardHeader>

          <CardContent className="p-8 space-y-6">
            {/* Google Sign-in Section */}
            <div className="space-y-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-4 text-gray-500 font-medium">
                    Quick Registration
                  </span>
                </div>
              </div>

              {!showCardForm && (
                <div
                  className={`transition-all duration-300 ${showCardForm ? "opacity-50 pointer-events-none" : ""
                    }`}
                >
                  <GoogleLogin onSuccess={handleGoogleRegister} />
                </div>
              )}

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-4 text-gray-500 font-medium">
                    Or register manually
                  </span>
                </div>
              </div>
            </div>

            {!showCardForm ? (
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmitFirstForm)}
                  className="space-y-5"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">
                            Username
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                              <Input
                                placeholder="Choose a username"
                                className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                {...field}
                              />
                            </div>
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
                          <FormLabel className="text-gray-700 font-medium">
                            Email
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                              <Input
                                type="email"
                                placeholder="Enter your email"
                                className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">
                            Password
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                              <Input
                                type="password"
                                placeholder="Choose a strong password"
                                className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                {...field}
                              />
                            </div>
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
                          <FormLabel className="text-gray-700 font-medium">
                            Confirm Password
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                              <Input
                                type="password"
                                placeholder="Repeat your password"
                                className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">
                          Account Type
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                              <SelectValue placeholder="Select account type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="buyer">🛒 Buyer</SelectItem>
                            <SelectItem value="seller">🏪 Seller</SelectItem>
                            <SelectItem value="trader">📈 Trader</SelectItem>
                            <SelectItem value="garage">🔧 Garage</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  /> */}

                  {form.formState.errors.root && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm text-red-600 text-center font-medium">
                        {form.formState.errors.root.message}
                      </p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 text-base"
                    disabled={form.formState.isSubmitting}
                  >
                    {form.formState.isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Continue"
                    )}
                  </Button>
                </form>
              </Form>
            ) : (
              <div className="space-y-6">
                <StripeCardForm
                  onCardVerified={(id) => setPaymentMethodId(id)}
                  onSkip={() => setCardSkipped(true)}
                />

                {(paymentMethodId || cardSkipped) && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="text-green-800 text-center font-medium">
                      {cardSkipped
                        ? "✅ Payment step skipped - you can add a card later"
                        : "✅ Card verified successfully!"}
                    </div>
                  </div>
                )}

                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 text-base"
                  onClick={form.handleSubmit(onFinalSubmit)}
                  disabled={
                    form.formState.isSubmitting ||
                    (!paymentMethodId && !cardSkipped)
                  }
                >
                  {form.formState.isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    "Complete Registration"
                  )}
                </Button>
              </div>
            )}
          </CardContent>

          {/* OTP Dialog */}
          <Dialog open={otpDialogOpen} onOpenChange={setOtpDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Enter the OTP</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">We sent a one-time code to your email. Enter it below to continue.</p>
                <div>
                  <UiInput
                    value={otpValue}
                    onChange={(e) => setOtpValue(e.target.value)}
                    placeholder="Enter OTP"
                  />
                  {otpError && <p className="text-sm text-red-600 mt-2">{otpError}</p>}
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div>
                    {resendAvailable ? (
                      <button className="text-blue-600 underline" onClick={handleResendOtp}>Resend</button>
                    ) : (
                      <span>Resend available in {timerSeconds}s</span>
                    )}
                  </div>
                  <div>
                    <Button onClick={handleVerifyOtp}>Verify</Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <CardFooter className="bg-gray-50 rounded-b-lg border-t border-gray-100">
            <p className="text-gray-600 text-center w-full">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-blue-600 hover:text-blue-700 font-medium underline"
              >
                Sign in here
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </Elements>
  );
}
