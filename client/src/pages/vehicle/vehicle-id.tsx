import React, { useState, useEffect } from "react";
import { useParams } from "wouter";
import {
  Heart,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Gauge,
  Tag,
  Palette,
  Info,
  MessageSquare,
  Check,
  DoorOpen,
  Armchair,
  Users,
  Cog,
  Wind,
  GitCommitHorizontal,
  UserCircle,
  CarFront,
  Gavel,
  CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle as DialogTitleComponent,
} from "@/components/ui/dialog";
import ImageGallery from "@/components/image-gallery";
import {
  incrementVehicleViews,
  contactSeller,
  getSellerDetais,
  getVehicleById,
  addToRecentViewApi,
} from "@/api";
import ReportDialog from "@/components/ui/report-dialog";
import MapComponent from "@/components/map-component";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "recharts";
import { Input } from "@/components/ui/input";
import { useUser } from "@/hooks/use-store";
import { toast } from "@/hooks/use-toast";
import { useRecentViews } from "@/hooks/use-store";

export default function VehicleIdPage() {
  const { id } = useParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [vehicle, setVehicle] = useState<any>(null);
  const [seller, setSeller] = useState<any>(null);
  const [contactOpen, setContactOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const { userId, role, card_verified } = useUser();
  const [isOwner, setIsOwner] = useState(false);
  const [contactMessage, setContactMessage] = useState("");
  const { addToRecentView } = useRecentViews();

  const formatString = (str: string | null | undefined): string => {
    if (!str || typeof str !== "string") return "N/A";
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  useEffect(() => {
    setIsOwner(userId === vehicle?.sellerId);
  }, [userId, vehicle]);

  useEffect(() => {
    const fetch = async () => {
      setIsLoading(true);
      try {
        const vehicleData = await getVehicleById(id);
        setVehicle(vehicleData);
        if (vehicleData?.sellerId) {
          const sellerData = await getSellerDetais(vehicleData.sellerId);
          setSeller(sellerData);
        }
        incrementVehicleViews(id).catch((e) => console.error(e));
        addToRecentViewApi(Number(id), "classified")
          .then((data) => addToRecentView(data.savedRecord))
          .catch((e) => console.error(e));
      } catch (error) {
        console.error("Error fetching page data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetch();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="aspect-video w-full rounded-xl bg-gray-200 animate-pulse" />
              <div className="h-10 w-3/4 bg-gray-200 rounded animate-pulse" />
              <div className="h-6 w-1/2 bg-gray-200 rounded animate-pulse" />
              <div className="grid grid-cols-2 gap-4">
                <div className="h-32 bg-gray-200 rounded-lg animate-pulse" />
                <div className="h-32 bg-gray-200 rounded-lg animate-pulse" />
              </div>
            </div>
            <div className="lg:col-span-1">
              <div className="bg-gray-200 animate-pulse h-96 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900">Vehicle not found</h2>
          <p className="mt-2 text-gray-600">The vehicle you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-6">
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Images and Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              {vehicle?.images && vehicle.images.length > 0 ? (
                <ImageGallery images={vehicle.images} />
              ) : (
                <div className="aspect-video bg-gray-200 flex items-center justify-center">
                  <p className="text-gray-500">No images available</p>
                </div>
              )}
            </div>

            {/* Title and Price Section */}
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 break-words">
                    {vehicle.title}
                  </h1>
                  <div className="flex items-center gap-2 text-gray-600 mt-3">
                    <MapPin size={18} className="flex-shrink-0" />
                    <span className="text-sm sm:text-base truncate">
                      {vehicle.location ?? "No location"}
                    </span>
                  </div>
                </div>

                <div className="flex-shrink-0">
                  <div className="text-3xl sm:text-4xl font-bold text-blue-600">
                    £{vehicle.price.toLocaleString()}
                  </div>
                  {vehicle.negotiable && (
                    <Badge className="mt-2 bg-green-100 text-green-800 hover:bg-green-100">
                      Negotiable
                    </Badge>
                  )}
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 mt-6">
                <Badge variant="secondary" className="text-xs sm:text-sm">{vehicle.year}</Badge>
                <Badge variant="secondary" className="text-xs sm:text-sm">
                  {vehicle.mileage.toLocaleString()} miles
                </Badge>
                <Badge variant="secondary" className="text-xs sm:text-sm">
                  {formatString(vehicle.transmission)}
                </Badge>
                <Badge variant="secondary" className="text-xs sm:text-sm">
                  {formatString(vehicle.fuelType)}
                </Badge>
                <Badge variant="secondary" className="text-xs sm:text-sm">
                  {formatString(vehicle.bodyType)}
                </Badge>
                <Badge variant="secondary" className="text-xs sm:text-sm">
                  {formatString(vehicle.color)}
                </Badge>
                <Badge variant="secondary" className="text-xs sm:text-sm">
                  {formatString(vehicle.condition)}
                </Badge>
                {vehicle.openToPX && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 text-xs sm:text-sm">
                    <Check size={14} className="mr-1" /> Open to Part Exchange
                  </Badge>
                )}
              </div>
            </div>

            {/* Vehicle Specifications */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {/* Vehicle Details Card */}
              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Info size={20} className="text-blue-600" />
                    Vehicle Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                      <Tag size={16} />
                      <span>Make</span>
                    </div>
                    <span className="font-medium text-gray-900 text-sm">
                      {formatString(vehicle.make)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                      <Tag size={16} />
                      <span>Model</span>
                    </div>
                    <span className="font-medium text-gray-900 text-sm">
                      {formatString(vehicle.model)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                      <DoorOpen size={16} />
                      <span>Doors</span>
                    </div>
                    <span className="font-medium text-gray-900 text-sm">
                      {vehicle.others?.number_doors ?? "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                      <Armchair size={16} />
                      <span>Seats</span>
                    </div>
                    <span className="font-medium text-gray-900 text-sm">
                      {vehicle.others?.number_seats ?? "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                      <Users size={16} />
                      <span>Previous Owners</span>
                    </div>
                    <span className="font-medium text-gray-900 text-sm">
                      {vehicle.others?.number_previous_owners ?? "N/A"}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Engine & Performance Card */}
              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Cog size={20} className="text-blue-600" />
                    Engine & Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                      <Cog size={16} />
                      <span>Engine Capacity</span>
                    </div>
                    <span className="font-medium text-gray-900 text-sm">
                      {vehicle.engine?.capacity
                        ? `${vehicle.engine.capacity.toFixed(1)}L`
                        : "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                      <Cog size={16} />
                      <span>Cylinders</span>
                    </div>
                    <span className="font-medium text-gray-900 text-sm">
                      {vehicle.engine?.number_cylinders ?? "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                      <Cog size={16} />
                      <span className="whitespace-nowrap">Cylinder Arrangement</span>
                    </div>
                    <span className="font-medium text-gray-900 text-sm text-right">
                      {formatString(vehicle.engine?.cylinder_arrangement)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                      <GitCommitHorizontal size={16} />
                      <span>Drive Train</span>
                    </div>
                    <span className="font-medium text-gray-900 text-sm">
                      {vehicle.others?.drive_train ?? "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                      <Wind size={16} />
                      <span>CO₂ Emission</span>
                    </div>
                    <span className="font-medium text-gray-900 text-sm">
                      {vehicle.engine?.co2_emission
                        ? `${vehicle.engine.co2_emission} g/km`
                        : "N/A"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Description */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                  {vehicle.description ?? "No description provided."}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Contact Card */}
          <div className="lg:col-span-1">
            <Card className="shadow-sm">
              <CardContent className="p-4 sm:p-6 space-y-4">
                {/* Location */}
                <div className="flex items-start gap-2 text-gray-700">
                  <MapPin className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{vehicle.location}</span>
                </div>

                {/* Map */}
                {vehicle.latitude && vehicle.longitude ? (
                  <div className="relative rounded-lg  border border-gray-200 z-0">
                    <MapComponent
                      lat={vehicle.latitude}
                      lon={vehicle.longitude}
                    />
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <p className="text-sm text-gray-600">No location data available</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-3 pt-2">
                  <Button
                    variant="default"
                    className="w-full"
                    size="lg"
                    onClick={() => setContactOpen(true)}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Contact Seller
                  </Button>

                  <Button variant="outline" className="w-full" size="lg">
                    <Heart className="h-4 w-4 mr-2" />
                    Save Vehicle
                  </Button>
                  
                  <Button
                    variant="destructive"
                    className="w-full"
                    size="lg"
                    onClick={() => setReportOpen(true)}
                  >
                    <Info className="h-4 w-4 mr-2" />
                    Report Vehicle
                  </Button>
                </div>

                {/* Listing Information */}
                <div className="pt-4 border-t border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-3">Listing Information</h3>
                  <div className="space-y-2.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Listed</span>
                      <span className="text-gray-900 font-medium">
                        {
                          vehicle.createdAt ? 
                          new Date(vehicle.createdAt).toLocaleDateString()
                          : "Not Available"
                        }
                      </span>
                    </div>
      
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Seller Profile Section */}
        {seller && (
          <Card className="mt-6 shadow-sm">
            <CardHeader className="border-b border-gray-200">
              <CardTitle className="flex items-center gap-3 text-xl sm:text-2xl">
                <UserCircle className="h-8 w-8 text-blue-600" />
                About the Seller
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                {/* Seller Info */}
                <div className="space-y-2">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                    {seller?.username}
                  </h3>
                  <div className="flex items-center gap-2 text-gray-600 text-sm">
                    <CalendarDays size={16} className="flex-shrink-0" />
                    <span>Member since {seller?.createdAt}</span>
                  </div>
                </div>

                {/* Seller Stats */}
                <div className="flex flex-wrap gap-6 justify-start md:justify-center">
                  <div className="flex items-center gap-3">
                    <CarFront className="h-8 w-8 text-gray-400" />
                    <div>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900">
                        {seller?.totalVehiclesListed}
                      </p>
                      <p className="text-sm text-gray-600">Vehicles</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Gavel className="h-8 w-8 text-gray-400" />
                    <div>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900">
                        {seller?.totalAuctionsListed}
                      </p>
                      <p className="text-sm text-gray-600">Auctions</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-start md:justify-end">
                  <Button variant="outline" className="w-full md:w-auto">
                    View Seller's Other Listings
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Report Dialog */}
      <ReportDialog
        isOpen={reportOpen}
        onOpenChange={setReportOpen}
        type="vehicle"
        targetId={id}
      />

      {/* Contact Dialog */}
      <Dialog open={contactOpen} onOpenChange={setContactOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitleComponent>Contact Seller</DialogTitleComponent>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {(isOwner || !userId) && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-700">
                  {isOwner && <span>You are the owner of this vehicle.</span>}
                  {!userId && (
                    <span className="text-red-600">You need to login first.</span>
                  )}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-sm font-medium">Your Message</Label>
              <Textarea
                className="w-full min-h-32 resize-none"
                placeholder="I'm interested in this vehicle. Is it still available?"
                onChange={(e) => setContactMessage(e.target.value)}
                value={contactMessage}
                disabled={!userId || isOwner}
              />
            </div>

            <Button
              className="w-full"
              disabled={!userId || isOwner}
              onClick={async () => {
                if (!userId) {
                  toast({
                    title: "Login Required",
                    description: "You need to login to contact the seller.",
                    variant: "destructive",
                  });
                  setContactOpen(false);
                  return;
                }
                if (isOwner) {
                  toast({
                    title: "Action Forbidden",
                    description: "You cannot contact yourself.",
                    variant: "destructive",
                  });
                  return;
                }
                try {
                  await contactSeller({
                    vehicleId: vehicle.id,
                    message: contactMessage,
                  });
                  toast({
                    title: "Message Sent",
                    description: "Your message has been sent successfully.",
                  });
                } catch (error: any) {
                  console.error("Error sending message:", error);
                  toast({
                    title: "Error",
                    description: error.message,
                    variant: "destructive",
                  });
                } finally {
                  setContactOpen(false);
                }
              }}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Send Message
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}