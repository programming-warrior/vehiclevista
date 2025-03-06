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
import AdminAuctions from "@/pages/admin/auctions";
import AdminEvents from "@/pages/admin/events";
import AdminFeedback from "@/pages/admin/feedback";
import AdminSpareParts from "@/pages/admin/spare-parts";
import AdminInventory from "@/pages/admin/inventory";
import AdminOffers from "@/pages/admin/offers";
import AdminPricing from "@/pages/admin/pricing";
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
              {/* Public Routes */}
              <Route path="/" component={Home} />
              <Route path="/login" component={Login} />
              <Route path="/signin" component={SignIn} />
              <Route path="/classified" component={Classified} />
              <Route path="/vehicle/:id" component={Vehicle} />
              <Route path="/search" component={Search} />
              <Route path="/makes" component={MakesPage} />
              <Route path="/makes/:brand" component={BrandPage} />

              {/* Admin Routes */}
              <Route path="/admin">
                <ProtectedRoute component={AdminDashboard} adminOnly />
              </Route>
              <Route path="/admin/vehicles">
                <ProtectedRoute component={AdminVehicles} adminOnly />
              </Route>
              <Route path="/admin/users">
                <ProtectedRoute component={AdminUsers} adminOnly />
              </Route>
              <Route path="/admin/settings">
                <ProtectedRoute component={AdminSettings} adminOnly />
              </Route>
              <Route path="/admin/auctions">
                <ProtectedRoute component={AdminAuctions} adminOnly />
              </Route>
              <Route path="/admin/events">
                <ProtectedRoute component={AdminEvents} adminOnly />
              </Route>
              <Route path="/admin/feedback">
                <ProtectedRoute component={AdminFeedback} adminOnly />
              </Route>
              <Route path="/admin/spare-parts">
                <ProtectedRoute component={AdminSpareParts} adminOnly />
              </Route>
              <Route path="/admin/inventory">
                <ProtectedRoute component={AdminInventory} adminOnly />
              </Route>
              <Route path="/admin/offers">
                <ProtectedRoute component={AdminOffers} adminOnly />
              </Route>
              <Route path="/admin/pricing">
                <ProtectedRoute component={AdminPricing} adminOnly />
              </Route>

              {/* Trader Routes */}
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

              {/* 404 Route */}
              <Route component={NotFound} />
            </Switch>
          </main>
          <Footer />
          <Toaster />
        </div>
      </AuthProvider>
    </QueryClientProvider>
  );
}