import { Route, useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { useUser } from "@/hooks/use-store";
import { useToast } from "@/hooks/use-toast";
import { useValidateSession } from "@/hooks/use-validatesession";
import { useEffect } from "react";

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
  const { userId, role } = useUser();
  const { toast } = useToast();
  const { isValidating } = useValidateSession();

  useEffect(() => {
    if (!isValidating) {
      if (!userId || !role) {
        console.log("No user found, redirecting to login");
        setLocation("/login");
        toast({
          variant: "destructive",
          description: "You need to login first",
        });
      } else if (adminOnly && role !== "admin") {
        console.log("User is not admin, redirecting to home");
        setLocation("/");
        toast({
          variant: "destructive",
          description: "Unauthorized access",
        });
      } else if (requiredRoles && !requiredRoles.includes(role)) {
        console.log("User does not have required role, redirecting to home");
        setLocation("/");
        toast({
          variant: "destructive",
          description: "Unauthorized access",
        });
      }
    }
  }, [isValidating, userId, role, adminOnly, requiredRoles, setLocation, toast]);

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  if (!userId || !role || (adminOnly && role !== "admin") || (requiredRoles && !requiredRoles.includes(role))) {
    return null; // Prevent rendering the component if the user is not authorized
  }

  return <Component />;
}