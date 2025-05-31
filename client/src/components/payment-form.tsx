// components/ConfirmPayment.tsx
import { useEffect, useState } from "react";
import {
  useStripe,
  useElements,
  PaymentElement,
  Elements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Button } from "@/components/ui/button";
import { verifyPayment } from "@/api";
import { toast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY!);

export default function PaymentFormWrapper({
  clientSecret,
}: {
  clientSecret: string;
}) {
  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <PaymentForm clientSecret={clientSecret} />
    </Elements>
  );
}

function PaymentForm({ clientSecret }: { clientSecret: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [_, setLocation] = useLocation();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!stripe || !elements) {
      setError("Stripe has not loaded yet. Please try again.");
      return;
    }

    setLoading(true);
    setError("");

    try {
     
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          // return_url can be optional if you're handling the result here
          // return_url: window.location.origin + "/payment-success",
        },
        redirect: "if_required", // This prevents automatic redirect
      });

      if (error) {
        console.error("Payment error:", error);
        setError(error.message || "Payment failed");
      } else if (paymentIntent?.status === "succeeded") {
        try {
          console.log("Payment succeeded", paymentIntent);
          await verifyPayment(paymentIntent.id);
          toast({
            title: "Payment verified",
            description: "You will be notified when your listing is live",
          });
          setLocation("/")
        } catch (e) {
          console.error("Verification error:", e);
          toast({
            variant: "destructive",
            title: "Payment cannot be verified now",
            description: "You will be notified",
          });
        }
      }
    } catch (e) {
      console.error("Unexpected error:", e);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-6">
      <form onSubmit={handleSubmit}>
        <PaymentElement 
          className="p-4 border rounded-md mb-4"
          options={{
            layout: "tabs"
          }}
        />
        {error && <p className="text-red-600 mt-2 mb-4">{error}</p>}
        <Button 
          type="submit" 
          disabled={!stripe || loading} 
          className="w-full"
        >
          {loading ? "Processing..." : "Confirm Payment"}
        </Button>
      </form>
    </div>
  );
}