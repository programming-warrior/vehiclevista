import { useEffect} from "react";
import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { BACKEND_URL } from "./lib/constants";
import { Toaster } from "@/components/ui/toaster";
import { ProtectedRoute } from "@/lib/protected-route";
import Footer from "@/components/footer";
import Home from "@/pages/home";
import VehiclePage from "@/pages/vehicle";
import Search from "@/pages/search";
import Login from "@/pages/login";
import Navbar from "@/components/navbar";
import NotFound from "@/pages/not-found";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminVehicles from "@/pages/admin/vehicles";
// import AdminSettings from "@/pages/admin/settings";
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
import AuctionPage from "@/pages/auction";
import Register from "@/pages/register";
import SellerDashboard from "@/pages/seller";
import SellerVehicleUpload from "./pages/seller/upload";
import { useUser } from "./hooks/use-store";
import { useValidateSession } from "./hooks/use-validatesession";
import Loader from "./components/loader";
import VehiclesList from "./pages/vehicles";
import SellerVehilceBulkUpload from "./pages/seller/bulk-upload";
import AuctionForm from "@/pages/seller/auction-create";
import { useWebSocket } from "./hooks/use-store";
import AuctionIdPage from "./pages/auction/auction-id";
import { useToast } from "./hooks/use-toast";
import { WEBSOCKET_URL } from "./lib/constants";
import UserProfile from "@/pages/user-profile";
import AdminPublicBlacklist from "./pages/admin/public-blacklist";
import AdminRafflePage from "./pages/admin/raffle";
import RaffleIdPage from "./pages/raffle/raffle-id";

export default function App() {
  const { userId, role, card_verified } = useUser();
  const { isValidating } = useValidateSession();
  const { setSocket, socket, closeSocket } = useWebSocket();
  const {toast} = useToast();

  useEffect(() => {
    console.log(userId)
    console.log(card_verified)
    console.log(role)
    const sessionId = localStorage.getItem("sessionId");
    console.log(sessionId);
    if (sessionId && !socket) {

      const ws = new WebSocket(`${WEBSOCKET_URL}`, ["Authorization", sessionId]);

      ws.onopen = () => {
        console.log("WebSocket connected ✅");
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        // console.log("WebSocket message:", data);
        if(data.event==='BID_PLACED'){
          console.log('BID_PLACED')
          const {bidId, auctionId, bidAmount, userId} = data.message;
          toast({
            title:'Bid Place successfully', 
            description: `Your bid for amount $${bidAmount} is successfull`
          })
        }
        else if(data.event==='RAFFLE_TICKET_PURCHASED'){
          console.log('RAFFLE_TICKET_PURCHASED')
          const {bidId, raffleId, ticketQuantity, userId} = data.message;
          toast({
            title:'Bid Place successfully', 
            description: `Your raffle $${ticketQuantity} tickets purchase is successfull`
          })
        }
        else if (data.event=='BID_PLACED_ERROR'){
          console.log('bid error');
          const {error, payload} = data.message;
          toast({
            variant: 'destructive',
            title:'Bid Failed', 
            description: error
          })
        }
        // handle message types here
      };

      ws.onerror = (err) => {
        setSocket(null);
        console.error("WebSocket error:", err);
      };

      ws.onclose = () => {
        setSocket(null);
        console.log("WebSocket closed ❌");
      };

      setSocket(ws);
    }

    return () => {
      closeSocket();
    };
  }, []);

  if (!userId || !role) {
    if (isValidating) return <Loader />;
  }
  
  return (

    <QueryClientProvider client={queryClient}>
      {/* <AuthProvider> */}
        <div className="min-h-screen bg-background flex flex-col">
          <Navbar />
          <main className="flex-1">
            <Switch>
              {/* Public Routes */}
              <Route path="/profile" component={UserProfile} />
              <Route path="/" component={Home} />
              <Route path="/login" component={Login} />
              <Route path="/register" component={Register} />
              {/* <Route path="/classified" component={Classified} /> */}
              <Route path="/vehicle" component={VehiclesList} />
              <Route path="/vehicle/:id" component={VehiclePage} />
              <Route path="/search" component={Search} />
              <Route path="/makes" component={MakesPage} />
              <Route path="/makes/:brand" component={BrandPage} />
              <Route path="/auction" component={AuctionPage} />
              <Route path="/auction/:id" component={AuctionIdPage} />
               <Route path="/raffle/:id" component={RaffleIdPage} />

              {/* Admin Routes */}
              <Route path="/admin">
                <ProtectedRoute component={AdminDashboard} adminOnly />
              </Route>
              <Route path="/admin/blacklist">
                <ProtectedRoute component={AdminPublicBlacklist} adminOnly />
              </Route>
              <Route path="/admin/vehicles">
                <ProtectedRoute component={AdminVehicles} adminOnly />
              </Route>
              <Route path="/admin/raffle">
                <ProtectedRoute component={AdminRafflePage} adminOnly />
              </Route>
              <Route path="/admin/users">
                <ProtectedRoute component={AdminUsers} adminOnly />
              </Route>
              {/* <Route path="/admin/settings">
                <ProtectedRoute component={AdminSettings} adminOnly />
              </Route> */}
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

              {/* Seller Routes */}
              {/* <Route path="/seller" >
                <ProtectedRoute
                  component={SellerDashboard}
                  requiredRoles={["seller"]}
                />
              </Route> */}
              <Route path="/seller/auction/create" >
                <ProtectedRoute
                  component={AuctionForm}
                />
              </Route>
              <Route path="/seller/vehicle/upload" >
                <ProtectedRoute
                  component={SellerVehicleUpload}
                />
              </Route>
              <Route path="/seller/vehicle/bulk-upload" >
                <ProtectedRoute
                  component={SellerVehilceBulkUpload}
                />
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
    </QueryClientProvider>
  );
}
