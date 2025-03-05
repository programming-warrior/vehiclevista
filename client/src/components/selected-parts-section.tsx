import { Card } from "@/components/ui/card";
import { Link } from "wouter";

const partCategories = [
  { id: "ecu-kit", name: "ECU kit" },
  { id: "exhaust", name: "Exhaust" },
  { id: "turbo", name: "Turbo" },
  { id: "wheels", name: "Wheels" },
  { id: "other", name: "Other Parts" },
];

export default function SelectedPartsSection() {
  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h2 className="text-4xl font-bold" style={{ 
            fontFamily: "ClashDisplay-Variable, sans-serif"
          }}>
            Selected Sports Car Part
          </h2>
        </div>

        {/* Categories in blue box */}
        <div className="w-[500px] bg-[#0066CC] bg-gradient-to-br from-blue-600 to-blue-800 p-8 rounded-[2.5rem]">
          <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
            {partCategories.map((category) => (
              <Link
                key={category.id}
                href={`/parts/${category.id}`}
                className="flex flex-col items-center justify-center p-4 rounded-lg border border-white/20 hover:border-white/40 transition-all text-white text-center"
              >
                <div className="text-base font-medium">
                  {category.name}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}