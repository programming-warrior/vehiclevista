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

    // fetchAucionListings();
    fetchUserDetails();
    fetchUserBids();
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
      <div className="container mx-auto py-8 px-4 max-w-6xl bg-white">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row gap-6 mb-8"
        >
          <div className="md:w-1/3">
            <Card className="h-full border-gray-200">
              <CardHeader className="pb-2">
                <div className="flex justify-center">
                  <Avatar className="h-24 w-24">
                    <AvatarImage
                      src={userData.avatarUrl}
                      alt={userData.username}
                    />
                    <AvatarFallback className="bg-blue-100 text-blue-800">
                      {userData.username.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </CardHeader>
              <CardContent className="text-center">
                <h2 className="text-2xl font-bold text-black">
                  {userData.username}
                </h2>
                <p className="text-gray-600">{userData.email}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Member since {userData.memberSince}
                </p>

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

          <div className="md:w-2/3">
            <Tabs
              defaultValue="account"
              value={activeTab}
              onValueChange={handleTabChange}
              className="h-full"
            >
              <TabsList className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 mb-6 bg-gray-100">
                <TabsTrigger
                  value="account"
                  className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                >
                  <User size={16} />
                  <span className="hidden md:inline">Account</span>
                </TabsTrigger>
                <TabsTrigger
                  value="classified"
                  className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                >
                  <Package size={16} />
                  <span className="hidden md:inline">Classified</span>
                </TabsTrigger>
                <TabsTrigger
                  value="auctions"
                  className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                >
                  <History size={16} />
                  <span className="hidden md:inline">Auctions</span>
                </TabsTrigger>
                <TabsTrigger
                  value="favourite-vehicles"
                  className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                >
                  <Heart size={16} />
                  <span className="hidden md:inline">Saved Vehi..</span>
                </TabsTrigger>
                <TabsTrigger
                  value="favourite-auctions"
                  className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                >
                  <Heart size={16} />
                  <span className="hidden md:inline">Saved Auc..</span>
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
                    <CardHeader>
                      <CardTitle className="text-black">
                        Account Settings
                      </CardTitle>
                      <CardDescription className="text-gray-600">
                        Manage your account details and preferences
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {formSuccess && (
                        <Alert className="bg-blue-50 text-blue-800 border-blue-200">
                          <AlertTitle>Success</AlertTitle>
                          <AlertDescription>{formSuccess}</AlertDescription>
                        </Alert>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="username" className="text-black">
                          Username
                        </Label>
                        <Input
                          id="username"
                          type="text"
                          defaultValue={userData.username}
                          disabled={true}
                          className="border-gray-200"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-black">
                          Email Address
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          defaultValue={userData.email}
                          disabled={true}
                          className="border-gray-200"
                        />
                      </div>

                      <div className="pt-2">
                        <Button
                          onClick={() =>
                            setIsPasswordFormOpen(!isPasswordFormOpen)
                          }
                          variant="outline"
                          className="w-full justify-between border-gray-200 text-black hover:bg-gray-50"
                        >
                          Change Password
                          <Settings size={16} />
                        </Button>

                        {isPasswordFormOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="mt-4 p-4 border border-gray-200 rounded-md"
                          >
                            <form onSubmit={handlePasswordSubmit}>
                              {formError && (
                                <Alert className="mb-4 bg-red-50 text-red-800 border-red-200">
                                  <AlertCircle className="h-4 w-4" />
                                  <AlertTitle>Error</AlertTitle>
                                  <AlertDescription>
                                    {formError}
                                  </AlertDescription>
                                </Alert>
                              )}

                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label
                                    htmlFor="currentPassword"
                                    className="text-black"
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
                                    className="border-gray-200"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label
                                    htmlFor="newPassword"
                                    className="text-black"
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
                                    className="border-gray-200"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label
                                    htmlFor="confirmPassword"
                                    className="text-black"
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
                                    className="border-gray-200"
                                  />
                                </div>

                                <div className="flex justify-end gap-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsPasswordFormOpen(false)}
                                    className="border-gray-200 text-black hover:bg-gray-50"
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    type="submit"
                                    className="bg-blue-600 hover:bg-blue-700"
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
                          className="w-full justify-between border-gray-200 text-black hover:bg-gray-50"
                        >
                          Payment Methods
                          <CreditCard size={16} />
                        </Button>

                        {isPaymentFormOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="mt-4 p-4 border border-gray-200 rounded-md"
                          >
                            <StripeCardForm
                              onCardVerified={(id) => setPaymentMethodId(id)}
                            />
                          </motion.div>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button
                        variant="outline"
                        className="border-gray-200 text-black hover:bg-gray-50"
                      >
                        Cancel
                      </Button>
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        Save Changes
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>

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
