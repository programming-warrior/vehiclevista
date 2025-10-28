import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  Car,
  CreditCard,
  Eye,
  Heart,
  History,
  Package,
  Settings,
  ShoppingCart,
  User,
  Loader2,
  MapPin,
  Calendar,
  Fuel,
  Gauge,
  Palette,
  RotateCcw,
  Clock,
  MousePointer,
  TrendingUp,
  Building2,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useUser } from "@/hooks/use-store";
import {
  getUserDetails,
  changePassword,
  getUserBids,
  getUsersAuctionListings,
  getUsersClassifiedListings,
  updateUserCardInfo,
  getMyTraderRequest,
} from "@/api";
import Loader from "@/components/loader";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { STRIPE_PUBLIC_KEY } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import ProfileClassifiedTab from "@/components/user/classified-tab";
import { useLocation } from "wouter";
import ProfileAuctionTab from "@/components/user/auction-tab";
import ProfileFavouriteVehicleTab from "@/components/user/favourite-vehicle-tab";
import ProfileFavouriteAuctionTab from "@/components/user/favourite-auction-tab";
import TraderRequestStatus from "@/components/user/trader-request-status";
import { Link } from "wouter";
import type { TraderRequest } from "@shared/schema";

const stripePromise = loadStripe(STRIPE_PUBLIC_KEY);

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.3 },
  },
};

function StripeCardForm({
  onCardVerified,
}: {
  onCardVerified: (paymentMethodId: string) => void;
}) {
  const { toast } = useToast();
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!stripe || !elements) {
      setError("Stripe not loaded");
      setLoading(false);
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError("Card element not found");
      setLoading(false);
      return;
    }

    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: "card",
      card: cardElement,
    });

    if (error) {
      setError(error.message || "Card verification failed");
      setLoading(false);
    } else if (paymentMethod) {
      try {
        const res = await updateUserCardInfo(paymentMethod.id);
        onCardVerified(paymentMethod.id);
        toast({
          title: "Card Updated",
          description: "Your card has been successfully verified.",
        });
      } catch (e: any) {
        setError(e.response?.data?.error || "Failed to update card info");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <CardElement options={{ style: { base: { fontSize: "16px" } } }} />
      {error && <div className="text-red-500 text-sm">{error}</div>}
      <div className="flex gap-2">
        <Button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            "Add Card"
          )}
        </Button>
      </div>
    </form>
  );
}

export default function UserProfile() {
  const [location] = useLocation();
  console.log(location);
  const queryParams = new URLSearchParams(window.location.search);
  console.log(queryParams.get("tab"));
  const currentTab = queryParams.get("tab") || "account";
  const [activeTab, setActiveTab] = useState(currentTab);
  const [isPasswordFormOpen, setIsPasswordFormOpen] = useState(false);
  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);
  const { userId, role, card_verified } = useUser();
  const [userData, setUserData] = useState<any>(null);
  const [bidHistory, setBidHistory] = useState<any>([]);
  const [paymentMethodId, setPaymentMethodId] = useState<string | null>(null);
  const [classifiedListings, setClassifiedListings] = useState<any[]>([]);
  const [auctionListings, setAuctionListings] = useState<any[]>([]);
  const [traderRequest, setTraderRequest] = useState<TraderRequest | null>(null);
  const [loadingTraderRequest, setLoadingTraderRequest] = useState(true);

  console.log("role: ", role)
  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const data = await getUserDetails();
        setUserData(data);
      } catch (error) {
        console.error("Error fetching user details:", error);
      }
    };

    const fetchUserBids = async () => {
      try {
        const data = await getUserBids();
        console.log("User Bids:", data);
        setBidHistory(data || []);
      } catch (error) {
        console.error("Error fetching user bids:", error);
        setBidHistory([]);
      }
    };

    const fetchTraderRequest = async () => {
      try {
        setLoadingTraderRequest(true);
        const request = await getMyTraderRequest();
        setTraderRequest(request);
      } catch (error) {
        console.error("Error fetching trader request:", error);
      } finally {
        setLoadingTraderRequest(false);
      }
    };

    fetchUserDetails();
    fetchUserBids();
    fetchTraderRequest();
  }, [userId]);

  // Form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const handleTabChange = (value: any) => {
    setActiveTab(value);
    setIsPasswordFormOpen(false);
    setIsPaymentFormOpen(false);
    setFormError("");
    setFormSuccess("");
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !passwordForm.currentPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmPassword
    ) {
      setFormError("All fields are required");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setFormError("New passwords do not match");
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setFormError("Password must be at least 8 characters");
      return;
    }
    try {
      await changePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword
      );
      setFormSuccess("Password updated successfully!");
      setFormError("");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (e: any) {
      setFormError(e.message ?? "Password update failed.");
    }

    setTimeout(() => {
      setIsPasswordFormOpen(false);
      setFormSuccess("");
    }, 10000);
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const getStatusColor = (status: string) => {
      switch (status.toLowerCase()) {
        case "active":
          return "bg-blue-100 text-blue-800 border-blue-200";
        case "blacklisted":
          return "bg-black text-white border-black";
        case "sold":
          return "bg-gray-100 text-gray-800 border-gray-200";
        case "expired":
          return "bg-gray-100 text-gray-600 border-gray-200";
        default:
          return "bg-gray-100 text-gray-800 border-gray-200";
      }
    };

    return (
      <span
        className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(
          status
        )}`}
      >
        {status}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  if (!userData) {
    return <Loader />;
  }

  return (
    <Elements stripe={stripePromise}>
      <div className="container mx-auto py-4 sm:py-6 md:py-8 px-3 sm:px-4 md:px-6 max-w-6xl bg-white min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col lg:flex-row gap-4 md:gap-6 mb-6 md:mb-8"
        >
          <div className="w-full lg:w-1/3">
            <Card className="h-full border-gray-200">
              <CardHeader className="pb-2 pt-4 sm:pt-6">
                <div className="flex justify-center">
                  <Avatar className="h-20 w-20 sm:h-24 sm:w-24">
                    <AvatarImage
                      src={userData.avatarUrl}
                      alt={userData.username}
                    />
                    <AvatarFallback className="bg-blue-100 text-blue-800 text-lg sm:text-xl">
                      {userData.username.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </CardHeader>
              <CardContent className="text-center px-4 sm:px-6">
                <h2 className="text-xl sm:text-2xl font-bold text-black break-words">
                  {userData.username}
                </h2>
                <p className="text-sm sm:text-base text-gray-600 break-all">{userData.email}</p>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  Member since {userData.memberSince}
                </p>

                {/* Role Badge */}
                <div className="mt-3 sm:mt-4 flex justify-center">
                  {role === "trader" && (
                    <Badge className="bg-blue-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2">
                      <Building2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      Verified Trader
                    </Badge>
                  )}

                </div>

                {/* Trader Application Section */}
                {!loadingTraderRequest && (
                  <div className="mt-4 sm:mt-6 space-y-3">
                    {role === "trader" || role === "garage" ? (
                      // User is already a trader - show status message
                      <Alert className="bg-green-50 border-green-200 text-left">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800 text-xs sm:text-sm">
                          You have full trader access and benefits.
                        </AlertDescription>
                      </Alert>
                    ) : traderRequest ? (
                      // User has a pending/approved/rejected request
                      null // Will show in the trader status tab
                    ) : (
                      // User hasn't applied yet - show apply button
                      <Link href="/trader/create">
                        <Button 
                          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg transition-all duration-200 text-sm sm:text-base"
                          size="lg"
                        >
                          <Building2 className="mr-1.5 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                          <span className="hidden xs:inline">Become a Trader</span>
                          <span className="xs:hidden">Trader</span>
                          <ArrowRight className="ml-1.5 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </Link>
                    )}
                  </div>
                )}

                {/* <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-2xl font-bold text-blue-600">
                      {userData.totalBids}
                    </p>
                    <p className="text-sm text-gray-600">Total Bids</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <p className="text-2xl font-bold text-black">
                      {userData.totalPurchases}
                    </p>
                    <p className="text-sm text-gray-600">Purchases</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <p className="text-2xl font-bold text-black">
                      {userData.totalSold}
                    </p>
                    <p className="text-sm text-gray-600">Sold</p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-2xl font-bold text-blue-600">
                      {userData.savedVehicles}
                    </p>
                    <p className="text-sm text-gray-600">Saved</p>
                  </div>
                </div> */}
              </CardContent>
            </Card>
          </div>

          <div className="w-full lg:w-2/3">
            <Tabs
              defaultValue="account"
              value={activeTab}
              onValueChange={handleTabChange}
              className="h-full"
            >
              <TabsList className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 mb-4 sm:mb-6 bg-gray-100 w-full h-auto gap-1 p-1">
                <TabsTrigger
                  value="account"
                  className="flex items-center justify-center gap-1 sm:gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs sm:text-sm px-2 py-2 sm:py-2.5"
                >
                  <User size={14} className="sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Account</span>
                  <span className="sm:hidden">Acct</span>
                </TabsTrigger>
                {traderRequest && (
                  <TabsTrigger
                    value="trader-status"
                    className="flex items-center justify-center gap-1 sm:gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs sm:text-sm px-2 py-2 sm:py-2.5"
                  >
                    <Building2 size={14} className="sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Trader</span>
                    <span className="sm:hidden">Trade</span>
                  </TabsTrigger>
                )}
                <TabsTrigger
                  value="classified"
                  className="flex items-center justify-center gap-1 sm:gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs sm:text-sm px-2 py-2 sm:py-2.5"
                >
                  <Package size={14} className="sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Classified</span>
                  <span className="sm:hidden">Class</span>
                </TabsTrigger>
                <TabsTrigger
                  value="auctions"
                  className="flex items-center justify-center gap-1 sm:gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs sm:text-sm px-2 py-2 sm:py-2.5"
                >
                  <History size={14} className="sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Auctions</span>
                  <span className="sm:hidden">Auct</span>
                </TabsTrigger>
                <TabsTrigger
                  value="favourite-vehicles"
                  className="flex items-center justify-center gap-1 sm:gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs sm:text-sm px-2 py-2 sm:py-2.5"
                >
                  <Heart size={14} className="sm:w-4 sm:h-4" />
                  <span className="hidden lg:inline">Saved Vehi..</span>
                  <span className="hidden sm:inline lg:hidden">Vehicles</span>
                  <span className="sm:hidden">Cars</span>
                </TabsTrigger>
                <TabsTrigger
                  value="favourite-auctions"
                  className="flex items-center justify-center gap-1 sm:gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs sm:text-sm px-2 py-2 sm:py-2.5"
                >
                  <Heart size={14} className="sm:w-4 sm:h-4" />
                  <span className="hidden lg:inline">Saved Auc..</span>
                  <span className="hidden sm:inline lg:hidden">Auctions</span>
                  <span className="sm:hidden">Bids</span>
                </TabsTrigger>
              </TabsList>

              <motion.div
                key={activeTab}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <TabsContent value="account" className="mt-0">
                  <Card className="border-gray-200">
                    <CardHeader className="px-4 sm:px-6 py-4 sm:py-6">
                      <CardTitle className="text-lg sm:text-xl text-black">
                        Account Settings
                      </CardTitle>
                      <CardDescription className="text-sm sm:text-base text-gray-600">
                        Manage your account details and preferences
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
                      {formSuccess && (
                        <Alert className="bg-blue-50 text-blue-800 border-blue-200">
                          <AlertTitle className="text-sm sm:text-base">Success</AlertTitle>
                          <AlertDescription className="text-xs sm:text-sm">{formSuccess}</AlertDescription>
                        </Alert>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="username" className="text-sm sm:text-base text-black">
                          Username
                        </Label>
                        <Input
                          id="username"
                          type="text"
                          defaultValue={userData.username}
                          disabled={true}
                          className="border-gray-200 text-sm sm:text-base"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm sm:text-base text-black">
                          Email Address
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          defaultValue={userData.email}
                          disabled={true}
                          className="border-gray-200 text-sm sm:text-base break-all"
                        />
                      </div>

                      <div className="pt-2">
                        <Button
                          onClick={() =>
                            setIsPasswordFormOpen(!isPasswordFormOpen)
                          }
                          variant="outline"
                          className="w-full justify-between border-gray-200 text-black hover:bg-gray-50 text-sm sm:text-base h-10 sm:h-11"
                        >
                          Change Password
                          <Settings size={14} className="sm:w-4 sm:h-4" />
                        </Button>

                        {isPasswordFormOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="mt-3 sm:mt-4 p-3 sm:p-4 border border-gray-200 rounded-md"
                          >
                            <form onSubmit={handlePasswordSubmit}>
                              {formError && (
                                <Alert className="mb-3 sm:mb-4 bg-red-50 text-red-800 border-red-200">
                                  <AlertCircle className="h-4 w-4" />
                                  <AlertTitle className="text-sm sm:text-base">Error</AlertTitle>
                                  <AlertDescription className="text-xs sm:text-sm">
                                    {formError}
                                  </AlertDescription>
                                </Alert>
                              )}

                              <div className="space-y-3 sm:space-y-4">
                                <div className="space-y-2">
                                  <Label
                                    htmlFor="currentPassword"
                                    className="text-sm sm:text-base text-black"
                                  >
                                    Current Password
                                  </Label>
                                  <Input
                                    id="currentPassword"
                                    type="password"
                                    value={passwordForm.currentPassword}
                                    onChange={(e) =>
                                      setPasswordForm({
                                        ...passwordForm,
                                        currentPassword: e.target.value,
                                      })
                                    }
                                    className="border-gray-200 text-sm sm:text-base"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label
                                    htmlFor="newPassword"
                                    className="text-sm sm:text-base text-black"
                                  >
                                    New Password
                                  </Label>
                                  <Input
                                    id="newPassword"
                                    type="password"
                                    value={passwordForm.newPassword}
                                    onChange={(e) =>
                                      setPasswordForm({
                                        ...passwordForm,
                                        newPassword: e.target.value,
                                      })
                                    }
                                    className="border-gray-200 text-sm sm:text-base"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label
                                    htmlFor="confirmPassword"
                                    className="text-sm sm:text-base text-black"
                                  >
                                    Confirm New Password
                                  </Label>
                                  <Input
                                    id="confirmPassword"
                                    type="password"
                                    value={passwordForm.confirmPassword}
                                    onChange={(e) =>
                                      setPasswordForm({
                                        ...passwordForm,
                                        confirmPassword: e.target.value,
                                      })
                                    }
                                    className="border-gray-200 text-sm sm:text-base"
                                  />
                                </div>

                                <div className="flex flex-col sm:flex-row justify-end gap-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsPasswordFormOpen(false)}
                                    className="border-gray-200 text-black hover:bg-gray-50 text-sm sm:text-base w-full sm:w-auto"
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    type="submit"
                                    className="bg-blue-600 hover:bg-blue-700 text-sm sm:text-base w-full sm:w-auto"
                                  >
                                    Update Password
                                  </Button>
                                </div>
                              </div>
                            </form>
                          </motion.div>
                        )}
                      </div>

                      <div className="pt-2">
                        <Button
                          onClick={() =>
                            setIsPaymentFormOpen(!isPaymentFormOpen)
                          }
                          variant="outline"
                          className="w-full justify-between border-gray-200 text-black hover:bg-gray-50 text-sm sm:text-base h-10 sm:h-11"
                        >
                          Payment Methods
                          <CreditCard size={14} className="sm:w-4 sm:h-4" />
                        </Button>

                        {isPaymentFormOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="mt-3 sm:mt-4 p-3 sm:p-4 border border-gray-200 rounded-md"
                          >
                            <StripeCardForm
                              onCardVerified={(id) => setPaymentMethodId(id)}
                            />
                          </motion.div>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between px-4 sm:px-6 py-4 sm:py-6">
                      <Button
                        variant="outline"
                        className="border-gray-200 text-black hover:bg-gray-50 w-full sm:w-auto text-sm sm:text-base"
                      >
                        Cancel
                      </Button>
                      <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto text-sm sm:text-base">
                        Save Changes
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>

                {traderRequest && (
                  <TabsContent value="trader-status" className="mt-0">
                    <TraderRequestStatus request={traderRequest} />
                  </TabsContent>
                )}

                <TabsContent value="classified" className="mt-0">
                  <ProfileClassifiedTab />
                </TabsContent>
                <TabsContent value="auctions" className="mt-0">
                  <ProfileAuctionTab />
                </TabsContent>
                <TabsContent value="favourite-vehicles" className="mt-0">
                  <ProfileFavouriteVehicleTab />
                </TabsContent>
                <TabsContent value="favourite-auctions" className="mt-0">
                  <ProfileFavouriteAuctionTab />
                </TabsContent>

                {/* <TabsContent value="saved" className="mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle>Saved Vehicles</CardTitle>
                      <CardDescription>
                        Vehicles you're watching
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="space-y-4"
                      >
                        {mockSavedVehicles.map((vehicle) => (
                          <motion.div
                            key={vehicle.id}
                            variants={itemVariants}
                            className="p-4 border rounded-lg hover:shadow-md transition-shadow flex justify-between items-center"
                          >
                            <div className="flex items-center gap-4">
                              <div className="bg-red-100 p-2 rounded-full">
                                <Heart size={24} className="text-red-500" />
                              </div>
                              <div>
                                <h3 className="font-medium">
                                  {vehicle.vehicle}
                                </h3>
                                <p className="text-sm text-gray-500">
                                  Current bid: {vehicle.currentBid}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <p className="text-xs font-semibold bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                                Ends in: {vehicle.endsIn}
                              </p>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="flex items-center gap-1"
                              >
                                <Eye size={14} />
                                View
                              </Button>
                            </div>
                          </motion.div>
                        ))}
                      </motion.div>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" className="w-full">
                        View All Saved Vehicles
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent> */}
              </motion.div>
            </Tabs>
          </div>
        </motion.div>
      </div>
    </Elements>
  );
}
