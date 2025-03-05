import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function HeroSection() {
  return (
    <div className="relative min-h-[600px] bg-cover bg-center" style={{
      backgroundImage: 'url("https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=2000")',
      backgroundBlendMode: 'overlay',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    }}>
      <div className="container mx-auto px-4 py-16">
        {/* Category Pills */}
        <div className="flex gap-2 mb-12">
          <Button variant="secondary" className="bg-white/20 hover:bg-white/30 text-white rounded-full px-8">
            Cars
          </Button>
          <Button variant="secondary" className="bg-white/10 hover:bg-white/20 text-white rounded-full px-8">
            Bikes
          </Button>
          <Button variant="secondary" className="bg-white/10 hover:bg-white/20 text-white rounded-full px-8">
            Vans
          </Button>
        </div>

        {/* Hero Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
              Discover The Best Vehicles Near You Through An Exceptional Classifieds Experience And Exciting Auctions
            </h1>
            <p className="text-lg text-white/80">
              Find your perfect vehicle with ease through classifieds and auctions
            </p>

            {/* Action Buttons */}
            <div className="flex gap-4 mt-8">
              <Button variant="secondary" className="bg-blue-600 hover:bg-blue-700 text-white px-8">
                Live Auction
              </Button>
              <Button variant="secondary" className="bg-white/20 hover:bg-white/30 text-white px-8">
                How it works
              </Button>
            </div>
          </div>

          {/* Quick Finder Form */}
          <div className="bg-white rounded-3xl p-8 shadow-lg">
            <h2 className="text-2xl font-semibold mb-6">Find your vehicle with quick finder</h2>
            <div className="grid grid-cols-2 gap-4">
              <Select>
                <SelectTrigger className="h-12 bg-gray-100">
                  <SelectValue placeholder="All Brands" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mercedes">Mercedes-Benz</SelectItem>
                  <SelectItem value="bmw">BMW</SelectItem>
                  <SelectItem value="audi">Audi</SelectItem>
                </SelectContent>
              </Select>

              <Select>
                <SelectTrigger className="h-12 bg-gray-100">
                  <SelectValue placeholder="All Models" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="a-class">A-Class</SelectItem>
                  <SelectItem value="c-class">C-Class</SelectItem>
                  <SelectItem value="e-class">E-Class</SelectItem>
                </SelectContent>
              </Select>

              <Select>
                <SelectTrigger className="h-12 bg-gray-100">
                  <SelectValue placeholder="All Model Variants" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="amg">AMG</SelectItem>
                  <SelectItem value="sport">Sport</SelectItem>
                  <SelectItem value="se">SE</SelectItem>
                </SelectContent>
              </Select>

              <Select>
                <SelectTrigger className="h-12 bg-gray-100">
                  <SelectValue placeholder="Budget" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10000">Up to £10,000</SelectItem>
                  <SelectItem value="20000">Up to £20,000</SelectItem>
                  <SelectItem value="30000">Up to £30,000</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button className="w-full mt-6 h-12 bg-blue-600 hover:bg-blue-700 text-white text-lg">
              SEARCH
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}