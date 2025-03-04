import { useAuth } from "@/hooks/use-auth";
import { Route, useLocation } from "wouter";
import { Loader2 } from "lucide-react";

export function ProtectedRoute({
  component: Component,
  adminOnly = false,
}: {
  component: () => JSX.Element;
  adminOnly?: boolean;
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

  if (!user || (adminOnly && !user.isAdmin)) {
    setLocation("/login");
    return null;
  }

  return <Component />;
}
