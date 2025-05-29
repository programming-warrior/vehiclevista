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
} from "lucide-react";
import { getVehicleById } from "@/api/vehicle-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ImageGallery from "@/components/image-gallery";
import { incrementVehicleViews, contactSeller } from "@/api";
import ReportDialog from "@/components/ui/report-dialog";
import MapComponent from "@/components/map-component";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "recharts";
import { Input } from "@/components/ui/input";
import { useUser } from "@/hooks/use-store";
import { toast } from "@/hooks/use-toast";

export default function VehiclePage() {
  const { id } = useParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [vehicle, setVehicle] = useState<any>(null);
  const [contactOpen, setContactOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const { userId, role, card_verified } = useUser();
  const [isOwner, setIsOwner] = useState(false);
  const [contactMessage, setContactMessage] = useState("");


  useEffect(() => {
    setIsOwner(userId === vehicle?.sellerId);
  }, [userId, vehicle]);

  useEffect(() => {
    const fetchVehicle = async () => {
      setIsLoading(true);
      try {
        const response = await getVehicleById(id);
        console.log(response);
        setVehicle(response);
      } catch (error) {
        console.error("Error fetching vehicle data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    incrementVehicleViews(id);
    fetchVehicle();
  }, [id]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="aspect-[4/3] rounded-lg bg-gray-200 animate-pulse" />
            <div className="h-8 w-64 bg-gray-200 animate-pulse" />
            <div className="h-6 w-32 bg-gray-200 animate-pulse" />
          </div>
          <div className="lg:col-span-1">
            <div className="bg-gray-200 animate-pulse h-64 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="container mx-auto p-4 md:p-6 flex items-center justify-center min-h-[50vh]">
        <div className="text-xl font-medium">Vehicle not found</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 bg-gray-50">
      <div className="bg-white shadow-md rounded-lg overflow-hidden p-6">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left column - Gallery and details */}
          <div className="lg:col-span-2">
            {/* Image Gallery */}
            {vehicle?.images && vehicle.images.length > 0 ? (
              <ImageGallery images={vehicle.images} />
            ) : (
              <div className="aspect-[4/3] bg-gray-200 flex items-center justify-center rounded-md mb-6">
                <p>No images available</p>
              </div>
            )}
            <div className="mt-8">
              <div className="flex justify-between items-start flex-wrap gap-4">
                <div>
                  <h1 className="text-3xl font-bold">{vehicle.title}</h1>
                  <div className="flex items-center gap-2 text-gray-600 mt-2">
                    <MapPin size={16} />
                    <span>{vehicle.location}</span>
                  </div>
                </div>

                <div className="text-3xl font-bold text-primary">
                  £{vehicle.price.toLocaleString()}
                  {vehicle.negotiable && (
                    <span className="text-sm font-normal ml-2 bg-green-100 text-green-700 py-1 px-2 rounded-full">
                      Negotiable
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-6">
                <Badge variant="secondary">{vehicle.year}</Badge>
                <Badge variant="secondary">
                  {vehicle.mileage.toLocaleString()} miles
                </Badge>
                <Badge variant="secondary">{vehicle.transmission}</Badge>
                <Badge variant="secondary">{vehicle.fuelType}</Badge>
                <Badge variant="secondary">{vehicle.bodyType}</Badge>
                <Badge variant="secondary">{vehicle.color}</Badge>
                <Badge variant="secondary">{vehicle.condition}</Badge>
                {vehicle.openToPX && (
                  <Badge
                    variant="outline"
                    className="bg-blue-50 text-blue-700 border-blue-200"
                  >
                    <Check size={14} className="mr-1" /> Open to Part Exchange
                  </Badge>
                )}
              </div>

              <Separator className="my-6" />

              {/* Vehicle specifications */}
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h2 className="text-lg font-semibold mb-4 flex items-center">
                    <Info size={18} className="mr-2" />
                    Vehicle Details
                  </h2>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-gray-700">
                        <Tag size={16} className="mr-2" />
                        <span>Make</span>
                      </div>
                      <span className="font-medium">{vehicle.make}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-gray-700">
                        <Tag size={16} className="mr-2" />
                        <span>Model</span>
                      </div>
                      <span className="font-medium">{vehicle.model}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-gray-700">
                        <Calendar size={16} className="mr-2" />
                        <span>Year</span>
                      </div>
                      <span className="font-medium">{vehicle.year}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-gray-700">
                        <Gauge size={16} className="mr-2" />
                        <span>Mileage</span>
                      </div>
                      <span className="font-medium">
                        {vehicle.mileage.toLocaleString()} miles
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-gray-700">
                        <Palette size={16} className="mr-2" />
                        <span>Color</span>
                      </div>
                      <span className="font-medium">{vehicle.color}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h2 className="text-lg font-semibold mb-4 flex items-center">
                    <Info size={18} className="mr-2" />
                    Additional Information
                  </h2>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-gray-700">
                        <Tag size={16} className="mr-2" />
                        <span>Body Type</span>
                      </div>
                      <span className="font-medium">{vehicle.bodyType}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-gray-700">
                        <Tag size={16} className="mr-2" />
                        <span>Fuel Type</span>
                      </div>
                      <span className="font-medium">{vehicle.fuelType}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-gray-700">
                        <Tag size={16} className="mr-2" />
                        <span>Transmission</span>
                      </div>
                      <span className="font-medium">
                        {vehicle.transmission}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-gray-700">
                        <Tag size={16} className="mr-2" />
                        <span>Registration</span>
                      </div>
                      <span className="font-medium">
                        {vehicle.registration_num}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-gray-700">
                        <Tag size={16} className="mr-2" />
                        <span>Category</span>
                      </div>
                      <span className="font-medium capitalize">
                        {vehicle.category}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h2 className="text-xl font-semibold mb-4">Description</h2>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700 whitespace-pre-line">
                    {vehicle.description}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right column - Contact */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
                  <MapPin className="h-4 w-4" />
                  {vehicle.location}
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
                  {vehicle.latitude && vehicle.longitude ? (
                    <MapComponent
                      lat={vehicle.latitude}
                      lon={vehicle.longitude}
                    />
                  ) : (
                    <p className="text-gray-400 text-xs font-light">
                      {" "}
                      No Map Preview
                    </p>
                  )}
                </div>

                <div className="space-y-4">
                  {/* <Button className="w-full" size="lg">
                    <Phone className="h-4 w-4 mr-2" />
                    Show Phone Number
                  </Button> */}

                  <Button
                    variant="outline"
                    className="w-full"
                    size="lg"
                    onClick={() => setContactOpen(true)}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Contact Seller
                  </Button>

                  <Button variant="secondary" className="w-full" size="lg">
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

                <div className="mt-6 pt-6 border-t">
                  <h3 className="font-medium mb-2">Listing Information</h3>
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Listed</span>
                      <span>
                        {new Date(vehicle.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {/* <div className="flex justify-between">
                      <span className="text-gray-600">Views</span>
                      <span>{vehicle.views}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Reference</span>
                      <span>#{vehicle.id}</span>
                    </div> */}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

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
            <DialogTitle>Contact Seller</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                {isOwner && <span>You are the owner of this vehicle.</span>}
                {!userId && (
                  <span className="text-red-500">You need to login first.</span>
                )}
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Your Message</Label>
              <Textarea
                className="w-full min-h-32 rounded-md border border-gray-300 p-3"
                placeholder="I'm interested in this vehicle. Is it still available?"
                onChange={(e) => setContactMessage(e.target.value)}
                value={contactMessage}
                disabled={!userId || isOwner}
              />
            </div>

            <Button
              className="w-full bg-blue-500 hover:bg-blue-600"
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
                } catch (error:any) {
                  console.error("Error sending message:", error);
                  toast({
                    title: "Error",
                    description:
                      error.message,
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
