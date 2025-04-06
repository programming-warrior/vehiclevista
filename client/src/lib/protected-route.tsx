import { useAuth } from "@/hooks/use-auth";
import { Route, useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { useUser } from "@/hooks/use-store";
import { useToast } from "@/hooks/use-toast";

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