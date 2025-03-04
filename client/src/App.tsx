import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { AuthProvider } from "@/hooks/use-auth";
import { Toaster } from "@/components/ui/toaster";
import { ProtectedRoute } from "@/lib/protected-route";
import Home from "@/pages/home";
import Vehicle from "@/pages/vehicle";
import Search from "@/pages/search";
import Login from "@/pages/login";
import Navbar from "@/components/navbar";
import NotFound from "@/pages/not-found";
import AdminDashboard from "@/pages/admin";
import AdminVehicles from "@/pages/admin/vehicles";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/vehicle/:id" component={Vehicle} />
      <Route path="/search" component={Search} />
      <Route path="/login" component={Login} />
      <Route path="/admin">
        <ProtectedRoute component={AdminDashboard} adminOnly />
      </Route>
      <Route path="/admin/vehicles">
        <ProtectedRoute component={AdminVehicles} adminOnly />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="min-h-screen bg-background">
          <Switch>
            <Route path="/admin/*">
              <Router />
            </Route>
            <Route path="/login">
              <Router />
            </Route>
            <Route>
              <Navbar />
              <main className="container mx-auto px-4 py-8">
                <Router />
              </main>
            </Route>
          </Switch>
        </div>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}