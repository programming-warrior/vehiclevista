import { useEffect } from "react";
import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { BACKEND_URL } from "./lib/constants";
import { Toaster } from "@/components/ui/toaster";
import { ProtectedRoute } from "@/lib/protected-route";
import Footer from "@/components/footer";
import Home from "@/pages/home";
import VehicleIdPage from "@/pages/vehicle/vehicle-id";
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
import AuctionPage from "@/pages/auction/auction";
import Register from "@/pages/register";
import SellerDashboard from "@/pages/seller";
import SellerVehicleUpload from "./pages/seller/upload";
import { useUser } from "./hooks/use-store";
import { useValidateSession } from "./hooks/use-validatesession";
import Loader from "./components/loader";
import VehiclePage from "./pages/vehicle/vehicle";
import SellerVehilceBulkUpload from "./pages/seller/bulk-upload";
import { useWebSocket } from "./hooks/use-store";
import AuctionIdPage from "./pages/auction/auction-id";
import { useToast } from "./hooks/use-toast";
import { WEBSOCKET_URL } from "./lib/constants";
import UserProfile from "@/pages/user-profile";
import AdminPublicBlacklist from "./pages/admin/public-blacklist";
import AdminRafflePage from "./pages/admin/raffle";
import RaffleIdPage from "./pages/raffle/raffle-id";
import NotificationsPage from "./pages/notifications";
import { useNotification } from "./hooks/use-store";
import SellerAuctionUpload from "@/pages/seller/auction-create";
import ScrollToTop from "./components/scroll-to-top";
import VehicleEditPage from "./pages/vehicle/vehicle-edit";
import RunningRafflePage from "./pages/raffle/raffle";
import AdminPaymentHistory from "./pages/admin/payment-history";
import AdminBuyerSellerChatHistory from "./pages/admin/buyer-seller-chat";
import { getRecentView } from "./api/user-api";
import { useRecentViews } from "./hooks/use-store";

export default function App() {
  const { userId, role, card_verified } = useUser();
  const { isValidating } = useValidateSession();
  const { setSocket, socket, closeSocket } = useWebSocket();
  const { toast } = useToast();
  const {
    unReadCount,
    addNotification,
    setUnReadCount,
    setTotalNotifications,
  } = useNotification();
  const { setRecentView } = useRecentViews();

  useEffect(() => {
    const sessionId = localStorage.getItem("sessionId");
    //fetch the recent views
    getRecentView()
      .then((data) => {
        console.log("fetched recent view")
        console.log(data)
        setRecentView(data);
      })
      .catch((e) => console.log(e));

    if (!socket) {
      let ws;
      if (sessionId) {
        ws = new WebSocket(`${WEBSOCKET_URL}`, ["Authorization", sessionId]);
      } else {
        ws = new WebSocket(`${WEBSOCKET_URL}`);
      }

      ws.onopen = () => {
        console.log("WebSocket connected ✅");
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        // console.log("WebSocket message:", data);
        if (data.event === "BID_PLACED") {
          console.log("BID_PLACED");
          const { bidId, auctionId, bidAmount, userId } = data.message;
          toast({
            title: "Bid Place successfully",
            description: `Your bid for amount $${bidAmount} is successfull`,
          });
        } else if (data.event === "RAFFLE_TICKET_PURCHASED") {
          console.log("RAFFLE_TICKET_PURCHASED");
          const { bidId, raffleId, ticketQuantity, userId } = data.message;
          toast({
            title: "Bid Place successfully",
            description: `Your raffle $${ticketQuantity} tickets purchase is successfull`,
          });
        } else if (data.event == "BID_PLACED_ERROR") {
          console.log("bid error");
          const { error, payload } = data.message;
          toast({
            variant: "destructive",
            title: "Bid Failed",
            description: error,
          });
        } else if (data.event === "RECEIVE_NOTIFICATION") {
          console.log("RECEIVE_NOTIFICATION");
          const { message, type, notificationId, createdAt } = data.message;

          addNotification({ id: notificationId, type, message, createdAt });
          console.log(unReadCount);
          setUnReadCount(unReadCount + 1);
          setTotalNotifications((prev: number) => prev + 1);
        }
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
          <ScrollToTop />
          <Switch>
            {/* Public Routes */}

            <Route path="/profile" component={UserProfile} />
            <Route path="/notifications" component={NotificationsPage} />
            <Route path="/" component={Home} />
            <Route path="/login" component={Login} />
            <Route path="/register" component={Register} />
            {/* <Route path="/classified" component={Classified} /> */}
            <Route path="/vehicle" component={VehiclePage} />
            <Route path="/vehicle/:id" component={VehicleIdPage} />
            <Route path="/vehicle/edit/:id" component={VehicleEditPage} />
            <Route path="/search" component={Search} />
            <Route path="/makes" component={MakesPage} />
            <Route path="/makes/:brand" component={BrandPage} />
            <Route path="/auction" component={AuctionPage} />
            <Route path="/auction/:id" component={AuctionIdPage} />
            <Route path="/raffle" component={RunningRafflePage} />

            {/* Admin Routes */}
            <Route path="/admin">
              <ProtectedRoute component={AdminDashboard} adminOnly />
            </Route>
            <Route path="/admin/raffle/:id">
              <ProtectedRoute component={RaffleIdPage} adminOnly />
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
            <Route path="/admin/payment-history">
              <ProtectedRoute component={AdminPaymentHistory} adminOnly />
            </Route>
            <Route path="/admin/buyer-seller-chat">
              <ProtectedRoute
                component={AdminBuyerSellerChatHistory}
                adminOnly
              />
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
            <Route path="/seller/auction/create">
              <SellerAuctionUpload />
            </Route>
            <Route path="/seller/vehicle/upload">
              <SellerVehicleUpload />
            </Route>
            {/* <Route path="/seller/vehicle/bulk-upload">
              <ProtectedRoute component={SellerVehilceBulkUpload} />
            </Route> */}

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
