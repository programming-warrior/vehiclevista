import { Card } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Link } from "wouter";

const categories = [
  {
    id: "grand-tourers",
    title: "GRAND TOURERS",
    image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800",
  },
  {
    id: "super-cars",
    title: "SUPER CARS",
    image: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=800",
  },
  {
    id: "air-cooled",
    title: "AIR COOLED",
    image: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=800",
  },
];

export default function ExploreCategories() {
  return (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold">Explore Categories</h2>
          <Link href="/categories" className="text-sm text-gray-500 hover:text-gray-700">
            View All
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <Link key={category.id} href={`/category/${category.id}`}>
              <Card className="group cursor-pointer overflow-hidden">
                <AspectRatio ratio={16/9}>
                  <div className="relative w-full h-full">
                    <img
                      src={category.image}
                      alt={category.title}
                      className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <h3 className="text-white text-3xl font-bold tracking-wider" style={{ 
                        fontFamily: "Arial",
                        letterSpacing: "0.2em",
                        textShadow: "2px 2px 4px rgba(0,0,0,0.5)"
                      }}>
                        {category.title}
                      </h3>
                    </div>
                  </div>
                </AspectRatio>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}