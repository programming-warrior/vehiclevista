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

export default function SellerDashboard() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="border-b bg-white">
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
      </header>

      {/* Main Content */}
      <main className="flex-1 bg-gray-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
          <div className="container py-12 md:py-12">
            <div className="">
              <div className="flex items-center justify-around gap-4">
                <Button
                  size="lg"
                  className="bg-white text-blue-700 hover:bg-gray-100"
                >
                  <Plus className="mr-2 h-4 w-4" /> List New Vehicle
                </Button>
                <Button
                  size="lg"
                  className="bg-white text-blue-700 hover:bg-gray-100"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Auction
                </Button>
              </div>

              {/* <div className="hidden md:block relative h-80">
                <div className="absolute inset-0 bg-black/20 rounded-lg"></div>
                <img
                  src="/placeholder.svg?height=400&width=600"
                  alt="Seller success"
                  width={600}
                  height={400}
                  className="rounded-lg object-cover h-full w-full"
                />
              </div> */}
            </div>
          </div>
        </section>

        {/* Quick Stats */}
        <section className="container py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Active Listings
                    </p>
                    <h3 className="text-2xl font-bold mt-1">12</h3>
                  </div>
                  <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Car className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Live Auctions
                    </p>
                    <h3 className="text-2xl font-bold mt-1">3</h3>
                  </div>
                  <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Clock className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Pending Bids
                    </p>
                    <h3 className="text-2xl font-bold mt-1">8</h3>
                  </div>
                  <div className="h-12 w-12 bg-amber-100 rounded-full flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Total Sales
                    </p>
                    <h3 className="text-2xl font-bold mt-1">$45,280</h3>
                  </div>
                  <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <BarChart2 className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Main Dashboard Content */}
        <section className="container pb-12">
          <Tabs defaultValue="listings">
            <div className="flex justify-between items-center mb-6">
              <TabsList>
                <TabsTrigger value="listings">My Listings</TabsTrigger>
                <TabsTrigger value="auctions">My Auctions</TabsTrigger>
                <TabsTrigger value="drafts">Drafts</TabsTrigger>
              </TabsList>
              <div className="flex gap-3">
                <Button variant="outline" className="gap-2">
                  <Settings className="h-4 w-4" />
                  Filters
                </Button>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Listing
                </Button>
              </div>
            </div>

            <TabsContent value="listings" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Active Listings</h2>
                <div className="flex gap-2">
                  <Select defaultValue="all">
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Vehicle Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="cars">Cars</SelectItem>
                      <SelectItem value="bikes">Bikes</SelectItem>
                      <SelectItem value="vans">Vans</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select defaultValue="recent">
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Sort By" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">Most Recent</SelectItem>
                      <SelectItem value="views">Most Views</SelectItem>
                      <SelectItem value="price-high">
                        Price: High to Low
                      </SelectItem>
                      <SelectItem value="price-low">
                        Price: Low to High
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="p-0">
                    <div className="relative h-48">
                      <img
                        src="/placeholder.svg?height=300&width=500"
                        alt="BMW 5 Series"
                        width={500}
                        height={300}
                        className="object-cover h-full w-full rounded-t-lg"
                      />
                      <Badge className="absolute top-3 left-3 bg-green-500">
                        Active
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg">BMW 5 Series</h3>
                      <p className="font-bold text-lg">$42,500</p>
                    </div>
                    <p className="text-sm text-gray-500 mb-3">
                      2020 • 25,000 miles • Petrol • Automatic
                    </p>
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">Views:</span>
                        <span className="font-medium">245</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">Inquiries:</span>
                        <span className="font-medium">12</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0 flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      Convert to Auction
                    </Button>
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader className="p-0">
                    <div className="relative h-48">
                      <img
                        src="/placeholder.svg?height=300&width=500"
                        alt="Audi Q5"
                        width={500}
                        height={300}
                        className="object-cover h-full w-full rounded-t-lg"
                      />
                      <Badge className="absolute top-3 left-3 bg-green-500">
                        Active
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg">Audi Q5</h3>
                      <p className="font-bold text-lg">$38,900</p>
                    </div>
                    <p className="text-sm text-gray-500 mb-3">
                      2021 • 18,500 miles • Diesel • Automatic
                    </p>
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">Views:</span>
                        <span className="font-medium">189</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">Inquiries:</span>
                        <span className="font-medium">8</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0 flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      Convert to Auction
                    </Button>
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader className="p-0">
                    <div className="relative h-48">
                      <img
                        src="/placeholder.svg?height=300&width=500"
                        alt="Honda CBR"
                        width={500}
                        height={300}
                        className="object-cover h-full w-full rounded-t-lg"
                      />
                      <Badge className="absolute top-3 left-3 bg-green-500">
                        Active
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg">Honda CBR 650R</h3>
                      <p className="font-bold text-lg">$8,750</p>
                    </div>
                    <p className="text-sm text-gray-500 mb-3">
                      2022 • 3,200 miles • Petrol • Manual
                    </p>
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">Views:</span>
                        <span className="font-medium">312</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">Inquiries:</span>
                        <span className="font-medium">15</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0 flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      Convert to Auction
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="auctions" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Active Auctions</h2>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Auction
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="p-0">
                    <div className="relative h-48">
                      <img
                        src="/placeholder.svg?height=300&width=500"
                        alt="Mercedes C-Class"
                        width={500}
                        height={300}
                        className="object-cover h-full w-full rounded-t-lg"
                      />
                      <Badge className="absolute top-3 left-3 bg-red-500">
                        Live Auction
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg">
                        Mercedes C-Class
                      </h3>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Current Bid</p>
                        <p className="font-bold text-lg">$35,750</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mb-3">
                      2019 • 32,000 miles • Petrol • Automatic
                    </p>
                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Time Remaining</span>
                        <span className="font-medium">1d 4h 32m</span>
                      </div>
                      <Progress value={65} className="h-2" />
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">Bids:</span>
                        <span className="font-medium">18</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">Watchers:</span>
                        <span className="font-medium">42</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0 flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      View Details
                    </Button>
                    <Button size="sm" className="flex-1">
                      Manage Auction
                    </Button>
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader className="p-0">
                    <div className="relative h-48">
                      <img
                        src="/placeholder.svg?height=300&width=500"
                        alt="Ford Mustang"
                        width={500}
                        height={300}
                        className="object-cover h-full w-full rounded-t-lg"
                      />
                      <Badge className="absolute top-3 left-3 bg-red-500">
                        Live Auction
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg">Ford Mustang GT</h3>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Current Bid</p>
                        <p className="font-bold text-lg">$48,200</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mb-3">
                      2018 • 15,000 miles • Petrol • Manual
                    </p>
                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Time Remaining</span>
                        <span className="font-medium">2d 8h 15m</span>
                      </div>
                      <Progress value={78} className="h-2" />
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">Bids:</span>
                        <span className="font-medium">24</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">Watchers:</span>
                        <span className="font-medium">67</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0 flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      View Details
                    </Button>
                    <Button size="sm" className="flex-1">
                      Manage Auction
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="drafts" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Draft Listings</h2>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Draft
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="p-0">
                    <div className="relative h-48 bg-gray-100 flex items-center justify-center">
                      <Upload className="h-12 w-12 text-gray-400" />
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg">Toyota Camry</h3>
                      <p className="font-bold text-lg">$22,500</p>
                    </div>
                    <p className="text-sm text-gray-500 mb-3">
                      2017 • 45,000 miles • Petrol • Automatic
                    </p>
                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Completion</span>
                        <span className="font-medium">65%</span>
                      </div>
                      <Progress value={65} className="h-2" />
                    </div>
                    <p className="text-sm text-amber-600">
                      Missing: 4 photos, vehicle history
                    </p>
                  </CardContent>
                  <CardFooter className="p-4 pt-0 flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      Edit
                    </Button>
                    <Button size="sm" className="flex-1">
                      Complete Listing
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 border-t">
        <div className="container py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500">
              © 2023 AutoWorldTrader. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link
                href="/terms"
                className="text-sm text-gray-500 hover:text-gray-900"
              >
                Terms
              </Link>
              <Link
                href="/privacy"
                className="text-sm text-gray-500 hover:text-gray-900"
              >
                Privacy
              </Link>
              <Link
                href="/help"
                className="text-sm text-gray-500 hover:text-gray-900"
              >
                Help Center
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
