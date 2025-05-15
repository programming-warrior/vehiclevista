import {
  Search,
  Plus,
  BarChart2,
  Calendar,
  Clock,
  Settings,
  HelpCircle,
  ChevronDown,
  Upload,
  Car,
  Truck,
  Bike,
} from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import VehicleUploadForm from "@/components/seller/vehicle-upload-form";

export default function SellerVehicleUpload() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      {/* <header className="border-b bg-white">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="relative h-10 w-10">
                <svg
                  viewBox="0 0 24 24"
                  className="h-10 w-10 text-red-500"
                  fill="currentColor"
                >
                  <path d="M12 2L2 12h3v8h14v-8h3L12 2z" />
                </svg>
              </div>
              <span className="text-xl font-semibold text-gray-700">
                AutoWorldTrader
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="/dashboard"
                className="text-sm font-medium text-primary"
              >
                Dashboard
              </Link>
              <Link
                href="/my-listings"
                className="text-sm font-medium text-gray-600 hover:text-primary"
              >
                My Listings
              </Link>
              <Link
                href="/auctions"
                className="text-sm font-medium text-gray-600 hover:text-primary"
              >
                My Auctions
              </Link>
              <Link
                href="/analytics"
                className="text-sm font-medium text-gray-600 hover:text-primary"
              >
                Analytics
              </Link>
              <Link
                href="/help"
                className="text-sm font-medium text-gray-600 hover:text-primary"
              >
                Help
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              className="hidden md:flex gap-2"
            >
              <HelpCircle className="h-4 w-4" />
              Seller Support
            </Button>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-sm font-medium">JS</span>
              </div>
              <span className="hidden md:inline text-sm font-medium">
                John Smith
              </span>
              <ChevronDown className="h-4 w-4 text-gray-500" />
            </div>
          </div>
        </div>
      </header> */}

      <main className="py-8 px-16">
        <VehicleUploadForm/>
      </main>
    </div>
  );
}
