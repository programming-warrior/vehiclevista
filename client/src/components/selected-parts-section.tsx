import { Card } from "@/components/ui/card";
import { Link } from "wouter";

const partCategories = [
  { id: "ecu-kit", name: "ECU kit" },
  { id: "exhaust", name: "Exhaust" },
  { id: "turbo", name: "Turbo" },
  { id: "wheels", name: "Wheels" },
  { id: "other-parts", name: "Other Parts" },
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

        {/* Categories Grid */}
        <div className="w-[500px] relative bg-[#0066CC] bg-gradient-to-br from-blue-600 to-blue-800 p-8 rounded-[2.5rem]">
          <div className="grid grid-cols-3 gap-4 md:grid-cols-5">
            {partCategories.map((category) => (
              <Link
                key={category.id}
                href={`/parts/${category.id}`}
                className="flex flex-col items-center justify-center p-4 rounded-lg border border-white/20 hover:border-white/40 transition-all text-white text-center"
              >
                {/* Category Icons */}
                {category.id === "ecu-kit" && (
                  <svg className="w-6 h-6 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
                  </svg>
                )}
                {category.id === "exhaust" && (
                  <svg className="w-6 h-6 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M6 12h12M6 6h12M6 18h12"/>
                  </svg>
                )}
                {category.id === "turbo" && (
                  <svg className="w-6 h-6 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 16a4 4 0 100-8 4 4 0 000 8z"/>
                    <path d="M12 8v8M8 12h8"/>
                  </svg>
                )}
                {category.id === "wheels" && (
                  <svg className="w-6 h-6 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="8"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
                {category.id === "other-parts" && (
                  <svg className="w-6 h-6 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="4" y="4" width="6" height="6" rx="1"/>
                    <rect x="14" y="4" width="6" height="6" rx="1"/>
                    <rect x="4" y="14" width="6" height="6" rx="1"/>
                    <rect x="14" y="14" width="6" height="6" rx="1"/>
                  </svg>
                )}
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