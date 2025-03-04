import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, MapPin, Car, MessageCircle, Banknote } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import type { Vehicle } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface ClassifiedListingProps {
  vehicle: Vehicle;
}

export default function ClassifiedListing({ vehicle }: ClassifiedListingProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const handleContact = (method: 'phone' | 'email') => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to contact sellers",
        variant: "destructive",
      });
      return;
    }

    // In a real app, this would open a contact form or show contact details
    toast({
      title: "Contact Seller",
      description: `Contact method: ${method}. This feature will be implemented soon.`,
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{vehicle.title}</CardTitle>
          <Badge variant={vehicle.listingStatus === 'active' ? 'default' : 'secondary'}>
            {vehicle.listingStatus.charAt(0).toUpperCase() + vehicle.listingStatus.slice(1)}
          </Badge>
        </div>
        <CardDescription className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          {vehicle.location}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="aspect-video relative rounded-lg overflow-hidden">
          <img
            src={vehicle.images[0]}
            alt={vehicle.title}
            className="object-cover w-full h-full"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Car className="h-4 w-4" />
            <span>{vehicle.year} {vehicle.make} {vehicle.model}</span>
          </div>
          <div className="flex items-center gap-2">
            <Banknote className="h-4 w-4" />
            <span>£{vehicle.price.toLocaleString()}</span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{vehicle.description}</p>
      </CardContent>
      <CardFooter className="flex justify-between">
        {vehicle.contactPreference !== 'email' && (
          <Button
            variant="outline"
            onClick={() => handleContact('phone')}
            className="flex items-center gap-2"
          >
            <Phone className="h-4 w-4" />
            Call Seller
          </Button>
        )}
        {vehicle.contactPreference !== 'phone' && (
          <Button
            variant="outline"
            onClick={() => handleContact('email')}
            className="flex items-center gap-2"
          >
            <Mail className="h-4 w-4" />
            Email Seller
          </Button>
        )}
        {vehicle.negotiable && (
          <Button
            variant="secondary"
            onClick={() => handleContact('email')}
            className="flex items-center gap-2"
          >
            <MessageCircle className="h-4 w-4" />
            Make Offer
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
