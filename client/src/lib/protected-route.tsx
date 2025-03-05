import { useAuth } from "@/hooks/use-auth";
import { Route, useLocation } from "wouter";
import { Loader2 } from "lucide-react";

export function ProtectedRoute({
  component: Component,
  adminOnly = false,
  requiredRoles,
}: {
  component: () => JSX.Element;
  adminOnly?: boolean;
  requiredRoles?: string[];
}) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    console.log("No user found, redirecting to login");
    setLocation("/login");
    return null;
  }

  if (adminOnly && user.role !== "admin") {
    console.log("User is not admin, redirecting to home");
    setLocation("/");
    return null;
  }

  if (requiredRoles && !requiredRoles.includes(user.role)) {
    console.log("User does not have required role, redirecting to home");
    setLocation("/");
    return null;
  }

  return <Component />;
}