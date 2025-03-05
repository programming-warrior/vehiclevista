import { Card } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Bookmark } from "lucide-react";

const partCategories = [
  { id: "ecu", name: "ECU kit", icon: "🔧" },
  { id: "exhaust", name: "Exhaust", icon: "🌪️" },
  { id: "turbo", name: "Turbo", icon: "🔄" },
  { id: "wheels", name: "Wheels", icon: "⚙️" },
  { id: "other", name: "Other Parts", icon: "🔨" },
];

const parts = [
  {
    id: 1,
    name: "High-performance exhaust",
    type: "Gear Mechanism",
    price: 2000,
    image: "https://images.unsplash.com/photo-1624994752390-4fc080d7f88b?auto=format&fit=crop&w=800"
  },
  {
    id: 2,
    name: "High Performance turbocharger",
    type: "Engine",
    price: 348,
    image: "https://images.unsplash.com/photo-1635784130692-8716d22e2cd7?auto=format&fit=crop&w=800"
  },
  {
    id: 3,
    name: "Sports car wheel",
    type: "Performance",
    price: 467,
    image: "https://images.unsplash.com/photo-1626668893632-6f3a4466d22f?auto=format&fit=crop&w=800"
  },
  {
    id: 4,
    name: "ECU (Electronic Control Unit)",
    type: "Engine",
    price: 1278,
    image: "https://images.unsplash.com/photo-1635784130692-8716d22e2cd7?auto=format&fit=crop&w=800"
  }
];

export default function SelectedPartsSection() {
  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold">Selected Sports Car Part</h2>
          <Link href="/parts" className="text-sm text-gray-500 hover:text-gray-700">
            View All
          </Link>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-5 gap-4 mb-8 bg-blue-600 p-6 rounded-[2rem]">
          {partCategories.map((category) => (
            <Link
              key={category.id}
              href={`/parts/${category.id}`}
              className="flex flex-col items-center gap-2 text-white hover:opacity-80 transition-opacity"
            >
              <span className="text-2xl">{category.icon}</span>
              <span className="text-sm font-medium">{category.name}</span>
            </Link>
          ))}
        </div>

        {/* Parts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {parts.map((part) => (
            <Card key={part.id} className="group">
              <AspectRatio ratio={4/3}>
                <img
                  src={part.image}
                  alt={part.name}
                  className="object-cover w-full h-full rounded-t-xl"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 bg-white/80 hover:bg-white rounded-md"
                >
                  <Bookmark className="h-4 w-4" />
                </Button>
              </AspectRatio>
              <div className="p-4">
                <div className="text-sm text-muted-foreground mb-1">Type: {part.type}</div>
                <h3 className="font-semibold mb-2">{part.name}</h3>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold">${part.price}</span>
                  <Button size="sm" variant="ghost" className="bg-purple-100 hover:bg-purple-200">
                    <svg className="w-4 h-4 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}