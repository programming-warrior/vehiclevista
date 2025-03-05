import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { AuthProvider } from "@/hooks/use-auth";
import { Toaster } from "@/components/ui/toaster";
import { ProtectedRoute } from "@/lib/protected-route";
import Footer from "@/components/footer";
import Home from "@/pages/home";
import Vehicle from "@/pages/vehicle";
import Search from "@/pages/search";
import Login from "@/pages/login";
import SignIn from "@/pages/signin";
import Navbar from "@/components/navbar";
import NotFound from "@/pages/not-found";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminVehicles from "@/pages/admin/vehicles";
import AdminSettings from "@/pages/admin/settings";
import AdminUsers from "@/pages/admin/users";
import Classified from "@/pages/classified";
import TraderDashboard from "@/pages/trader/dashboard";
import TraderBulkUpload from "@/pages/trader/bulk-upload";
import TraderPackages from "@/pages/trader/packages";
import MakesPage from "@/pages/makes";
import BrandPage from "@/pages/makes/[brand]";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="min-h-screen bg-background flex flex-col">
          <Navbar />
          <main className="flex-1">
            <Switch>
              <Route path="/login">
                <Login />
              </Route>
              <Route path="/signin">
                <SignIn />
              </Route>
              <Route path="/classified">
                <Classified />
              </Route>

              {/* Makes Routes */}
              <Route path="/makes">
                <MakesPage />
              </Route>
              <Route path="/makes/:brand">
                <BrandPage />
              </Route>

              {/* Trader/Garage Routes */}
              <Route path="/trader/dashboard">
                <ProtectedRoute 
                  component={TraderDashboard}
                  requiredRoles={["trader", "garage"]}
                />
              </Route>
              <Route path="/trader/bulk-upload">
                <ProtectedRoute 
                  component={TraderBulkUpload}
                  requiredRoles={["trader", "garage"]}
                />
              </Route>
              <Route path="/trader/packages">
                <ProtectedRoute 
                  component={TraderPackages}
                  requiredRoles={["trader", "garage"]}
                />
              </Route>

              {/* Admin Routes */}
              <Route path="/admin">
                <ProtectedRoute 
                  component={AdminDashboard}
                  adminOnly
                />
              </Route>
              <Route path="/admin/vehicles">
                <ProtectedRoute 
                  component={AdminVehicles}
                  adminOnly
                />
              </Route>
              <Route path="/admin/users">
                <ProtectedRoute 
                  component={AdminUsers}
                  adminOnly
                />
              </Route>
              <Route path="/admin/settings">
                <ProtectedRoute 
                  component={AdminSettings}
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
          <Footer />
          <Toaster />
        </div>
      </AuthProvider>
    </QueryClientProvider>
  );
}