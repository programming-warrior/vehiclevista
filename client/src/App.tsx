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
import SignIn from "@/pages/signin";
import Navbar from "@/components/navbar";
import NotFound from "@/pages/not-found";
import AdminDashboard from "@/pages/admin";
import AdminVehicles from "@/pages/admin/vehicles";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="min-h-screen bg-background">
          <Navbar />
          <main className="container mx-auto px-4 py-8">
            <Switch>
              <Route path="/login">
                <Login />
              </Route>
              <Route path="/signin">
                <SignIn />
              </Route>
              <Route path="/admin/vehicles">
                <ProtectedRoute 
                  component={AdminVehicles}
                  adminOnly
                />
              </Route>
              <Route path="/admin">
                <ProtectedRoute 
                  component={AdminDashboard}
                  adminOnly
                />
              </Route>
              <Route path="/vehicle/:id">
                <Vehicle />
              </Route>
              <Route path="/search">
                <Search />
              </Route>
              <Route path="/">
                <Home />
              </Route>
              <Route>
                <NotFound />
              </Route>
            </Switch>
          </main>
          <Toaster />
        </div>
      </AuthProvider>
    </QueryClientProvider>
  );
}