import { useAuth } from "@/hooks/use-auth";
import { Route, useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { useUser } from "@/hooks/use-store";
import { useToast } from "@/hooks/use-toast";
import { useValidateSession } from "@/hooks/use-validatesession";

export function ProtectedRoute({
  component: Component,
  adminOnly = false,
  requiredRoles,
}: {
  component: () => JSX.Element;
  adminOnly?: boolean;
  requiredRoles?: string[];
}) {
  const [, setLocation] = useLocation();
  const {userId, role} =useUser();
  const {toast} = useToast()
  const { isValidating } = useValidateSession();
  console.log("protected route");
  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }
  if (!userId || !role) {
    console.log("No user found, redirecting to login");
    setLocation("/login");
    toast({
      variant: "destructive",
      description: "You need to login first"
    })
    return null;
  }

  if (adminOnly && role !== "admin") {
    console.log("User is not admin, redirecting to home");
    toast({
      variant: "destructive",
      description: "Unauthorized access"
    })
    setLocation("/");
    return null;
  }

  if (requiredRoles && !requiredRoles.includes(role)) {
    console.log("User does not have required role, redirecting to home");
    setLocation("/");
    toast({
      variant: "destructive",
      description: "Unauthorized access"
    })
    return null;
  }

  return <Component />;
}