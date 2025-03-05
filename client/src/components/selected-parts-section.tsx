import { Link } from "wouter";

const partCategories = [
  { id: "ecu", name: "ECU kit", icon: "🔧" },
  { id: "exhaust", name: "Exhaust", icon: "🌪️" },
  { id: "turbo", name: "Turbo", icon: "🔄" },
  { id: "wheels", name: "Wheels", icon: "⚙️" },
  { id: "other", name: "Other Parts", icon: "🔨" },
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
        <div className="grid grid-cols-5 gap-4 bg-blue-600 p-6 rounded-[2rem]">
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
      </div>
    </section>
  );
}