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
} from "lucide-react";
import { motion } from "framer-motion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useUser } from "@/hooks/use-store";
import {
  getUserDetails,
  changePassword,
  getUserBids,
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

console.log(STRIPE_PUBLIC_KEY);

const stripePromise = loadStripe(STRIPE_PUBLIC_KEY);

// Mock data
// const mockUser = {
//   username: 'carEnthusiast88',
//   email: 'car.enthusiast@example.com',
//   avatarUrl: '/api/placeholder/150/150',
//   memberSince: 'Jan 2023',
//   totalBids: 47,
//   totalPurchases: 8,
//   totalSold: 5,
//   savedVehicles: 12
// };

const mockBidHistory = [
  {
    id: 1,
    vehicle: "2021 Tesla Model 3",
    amount: "$41,500",
    date: "2025-04-21",
    status: "outbid",
  },
  {
    id: 2,
    vehicle: "2022 Ford Mustang GT",
    amount: "$48,750",
    date: "2025-04-18",
    status: "winning",
  },
  {
    id: 3,
    vehicle: "2020 Jeep Wrangler",
    amount: "$32,000",
    date: "2025-04-15",
    status: "won",
  },
  {
    id: 4,
    vehicle: "2019 BMW X5",
    amount: "$37,250",
    date: "2025-04-10",
    status: "outbid",
  },
];

const mockPurchases = [
  {
    id: 1,
    vehicle: "2020 Jeep Wrangler",
    amount: "$32,000",
    date: "2025-04-15",
    status: "delivered",
  },
  {
    id: 2,
    vehicle: "2018 Audi A4",
    amount: "$22,500",
    date: "2025-03-25",
    status: "in transit",
  },
];

const mockSold = [
  {
    id: 1,
    vehicle: "2016 Toyota Camry",
    amount: "$12,500",
    date: "2025-04-05",
    status: "completed",
  },
  {
    id: 2,
    vehicle: "2017 Honda Civic",
    amount: "$10,750",
    date: "2025-03-15",
    status: "completed",
  },
];

const mockSavedVehicles = [
  {
    id: 1,
    vehicle: "2023 Porsche 911",
    currentBid: "$98,500",
    endsIn: "2 days",
  },
  {
    id: 2,
    vehicle: "2022 Range Rover Sport",
    currentBid: "$76,250",
    endsIn: "5 days",
  },
  {
    id: 3,
    vehicle: "2021 Mercedes-Benz E-Class",
    currentBid: "$45,000",
    endsIn: "1 day",
  },
];

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
      //   onCardVerified(paymentMethod.id);
      try {
        const res= await updateUserCardInfo(paymentMethod.id);
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
        <Button type="submit" className="w-full" disabled={loading}>
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
    
  const [activeTab, setActiveTab] = useState("account");
  const [isPasswordFormOpen, setIsPasswordFormOpen] = useState(false);
  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);
  const { userId, role, card_verified } = useUser();
  const [userData, setUserData] = useState<any>(null);
  const [bidHistory, setBidHistory] = useState<any>([]);
  const [paymentMethodId, setPaymentMethodId] = useState<string | null>(null);

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
        setBidHistory(data);
      } catch (error) {
        console.error("Error fetching user bids:", error);
      }
    };

    fetchUserDetails();
    fetchUserBids();
  }, [userId]);

  // Form state (would normally use zod and react-hook-form)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [cardForm, setCardForm] = useState({
    cardNumber: "",
    cardName: "",
    expiryDate: "",
    cvv: "",
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
    // Basic validation (would use zod in actual implementation)
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

  type StatusType =
    | "outbid"
    | "winning"
    | "won"
    | "delivered"
    | "in transit"
    | "completed";

  const StatusBadge = ({ status }: { status: StatusType | string }) => {
    const statusColors: Record<StatusType, string> = {
      outbid: "bg-red-100 text-red-800",
      winning: "bg-green-100 text-green-800",
      won: "bg-blue-100 text-blue-800",
      delivered: "bg-green-100 text-green-800",
      "in transit": "bg-yellow-100 text-yellow-800",
      completed: "bg-blue-100 text-blue-800",
    };

    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${
          statusColors[status as StatusType] || "bg-gray-100 text-gray-800"
        }`}
      >
        {status}
      </span>
    );
  };

  if (!userData) {
    return <Loader />;
  }

  return (
    <Elements stripe={stripePromise}>
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row gap-6 mb-8"
        >
          <div className="md:w-1/3">
            <Card className="h-full">
              <CardHeader className="pb-2">
                <div className="flex justify-center">
                  <Avatar className="h-24 w-24">
                    <AvatarImage
                      src={userData.avatarUrl}
                      alt={userData.username}
                    />
                    <AvatarFallback>
                      {userData.username.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </CardHeader>
              <CardContent className="text-center">
                <h2 className="text-2xl font-bold">{userData.username}</h2>
                <p className="text-gray-500">{userData.email}</p>
                <p className="text-sm text-gray-400 mt-1">
                  Member since {userData.memberSince}
                </p>

                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold">{userData.totalBids}</p>
                    <p className="text-sm text-gray-500">Total Bids</p>
                  </div>
                  {/* <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold">{mockUser.totalPurchases}</p>
                  <p className="text-sm text-gray-500">Purchases</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold">{mockUser.totalSold}</p>
                  <p className="text-sm text-gray-500">Sold</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold">{mockUser.savedVehicles}</p>
                  <p className="text-sm text-gray-500">Saved</p>
                </div> */}
                </div>
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
              <TabsList className="grid grid-cols-2 md:grid-cols-5 mb-6">
                <TabsTrigger
                  value="account"
                  className="flex items-center gap-2"
                >
                  <User size={16} />
                  <span className="hidden md:inline">Account</span>
                </TabsTrigger>
                <TabsTrigger value="bids" className="flex items-center gap-2">
                  <History size={16} />
                  <span className="hidden md:inline">Bids</span>
                </TabsTrigger>
                <TabsTrigger
                  value="purchases"
                  className="flex items-center gap-2"
                >
                  <ShoppingCart size={16} />
                  <span className="hidden md:inline">Purchases</span>
                </TabsTrigger>
                <TabsTrigger value="sold" className="flex items-center gap-2">
                  <Package size={16} />
                  <span className="hidden md:inline">Sold</span>
                </TabsTrigger>
                <TabsTrigger value="saved" className="flex items-center gap-2">
                  <Heart size={16} />
                  <span className="hidden md:inline">Saved</span>
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
                  <Card>
                    <CardHeader>
                      <CardTitle>Account Settings</CardTitle>
                      <CardDescription>
                        Manage your account details and preferences
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {formSuccess && (
                        <Alert className="bg-green-50 text-green-800 border-green-200">
                          <AlertTitle>Success</AlertTitle>
                          <AlertDescription>{formSuccess}</AlertDescription>
                        </Alert>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          type="text"
                          defaultValue={userData.username}
                          disabled={true}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          defaultValue={userData.email}
                          disabled={true}
                        />
                      </div>

                      <div className="pt-2">
                        <Button
                          onClick={() =>
                            setIsPasswordFormOpen(!isPasswordFormOpen)
                          }
                          variant="outline"
                          className="w-full justify-between"
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
                            className="mt-4 p-4 border rounded-md"
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
                                  <Label htmlFor="currentPassword">
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
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="newPassword">
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
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="confirmPassword">
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
                                  />
                                </div>

                                <div className="flex justify-end gap-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsPasswordFormOpen(false)}
                                  >
                                    Cancel
                                  </Button>
                                  <Button type="submit">Update Password</Button>
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
                          className="w-full justify-between"
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
                            className="mt-4 p-4 border rounded-md"
                          >
                            <StripeCardForm
                              onCardVerified={(id) => setPaymentMethodId(id)}
                            />
                          </motion.div>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button variant="outline">Cancel</Button>
                      <Button>Save Changes</Button>
                    </CardFooter>
                  </Card>
                </TabsContent>

                <TabsContent value="bids" className="mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle>Your Bid History</CardTitle>
                      <CardDescription>
                        Track all your bids on vehicle auctions
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="space-y-4"
                      >
                        {bidHistory.length === 0 && (
                          <Alert className="bg-yellow-50 text-yellow-800 border-yellow-200">
                            <AlertTitle>No Bids Found</AlertTitle>
                            <AlertDescription>
                              You have not placed any bids yet.
                            </AlertDescription>
                          </Alert>
                        )}
                        {bidHistory.map((bid: any) => (
                          <motion.div
                            key={bid.id}
                            variants={itemVariants}
                            className="p-4 border rounded-lg hover:shadow-md transition-shadow flex justify-between items-center"
                          >
                            <div className="flex items-center gap-4">
                              <div className="bg-gray-100 p-2 rounded-full">
                                <Car size={24} />
                              </div>
                              <div>
                                <h3 className="font-medium">
                                  {bid.vehicleYear} {bid.vehicleMake}{" "}
                                  {bid.vehicleModel}
                                </h3>
                                <p className="text-sm text-gray-500">
                                  Bid: $ {bid.bidAmount}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end">
                              <StatusBadge status={bid.status || "winning"} />
                              <p className="text-xs text-gray-500 mt-1">
                                {bid.createdAt}
                              </p>
                            </div>
                          </motion.div>
                        ))}
                      </motion.div>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" className="w-full">
                        View All Bids
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>

                <TabsContent value="purchases" className="mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle>Your Purchases</CardTitle>
                      <CardDescription>
                        Vehicles you've successfully purchased
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="space-y-4"
                      >
                        {mockPurchases.map((purchase) => (
                          <motion.div
                            key={purchase.id}
                            variants={itemVariants}
                            className="p-4 border rounded-lg hover:shadow-md transition-shadow flex justify-between items-center"
                          >
                            <div className="flex items-center gap-4">
                              <div className="bg-blue-100 p-2 rounded-full">
                                <ShoppingCart
                                  size={24}
                                  className="text-blue-600"
                                />
                              </div>
                              <div>
                                <h3 className="font-medium">
                                  {purchase.vehicle}
                                </h3>
                                <p className="text-sm text-gray-500">
                                  Price: {purchase.amount}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end">
                              <StatusBadge status={purchase.status} />
                              <p className="text-xs text-gray-500 mt-1">
                                {purchase.date}
                              </p>
                            </div>
                          </motion.div>
                        ))}
                      </motion.div>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" className="w-full">
                        View All Purchases
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>

                <TabsContent value="sold" className="mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle>Vehicles You've Sold</CardTitle>
                      <CardDescription>
                        Track your vehicle sales
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="space-y-4"
                      >
                        {mockSold.map((item) => (
                          <motion.div
                            key={item.id}
                            variants={itemVariants}
                            className="p-4 border rounded-lg hover:shadow-md transition-shadow flex justify-between items-center"
                          >
                            <div className="flex items-center gap-4">
                              <div className="bg-green-100 p-2 rounded-full">
                                <Package size={24} className="text-green-600" />
                              </div>
                              <div>
                                <h3 className="font-medium">{item.vehicle}</h3>
                                <p className="text-sm text-gray-500">
                                  Sold for: {item.amount}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end">
                              <StatusBadge status={item.status} />
                              <p className="text-xs text-gray-500 mt-1">
                                {item.date}
                              </p>
                            </div>
                          </motion.div>
                        ))}
                      </motion.div>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" className="w-full">
                        View All Sold Vehicles
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>

                <TabsContent value="saved" className="mt-0">
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
                </TabsContent>
              </motion.div>
            </Tabs>
          </div>
        </motion.div>
      </div>
    </Elements>
  );
}
