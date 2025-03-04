import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import Home from "@/pages/home";
import Vehicle from "@/pages/vehicle";
import Search from "@/pages/search";
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
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/vehicles" component={AdminVehicles} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background">
        {/* Only show Navbar if not in admin routes */}
        <Switch>
          <Route path="/admin/*">
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
    </QueryClientProvider>
  );
}

export default App;