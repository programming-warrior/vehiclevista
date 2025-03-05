import { Card } from "@/components/ui/card";
import { Link } from "wouter";
import { SiAudi, SiBmw, SiFord, SiMercedes, SiFerrari, SiVolkswagen } from "react-icons/si";

const carBrands = [
  { id: 'audi', name: 'Audi', Icon: SiAudi },
  { id: 'bmw', name: 'BMW', Icon: SiBmw },
  { id: 'ford', name: 'Ford', Icon: SiFord },
  { id: 'mercedes', name: 'Mercedes Benz', Icon: SiMercedes },
  { id: 'ferrari', name: 'Ferrari', Icon: SiFerrari },
  { id: 'volkswagen', name: 'Volkswagen', Icon: SiVolkswagen },
];

export default function SearchMakes() {
  return (
    <section className="py-12 bg-pink-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold">Search Makes</h2>
          <Link href="/makes" className="text-sm text-gray-500 hover:text-gray-700">
            View All
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {carBrands.map(({ id, name, Icon }) => (
            <Link 
              key={id} 
              href={`/makes/${id}`}
              className="bg-white rounded-xl p-6 flex flex-col items-center justify-center hover:shadow-md transition-shadow"
            >
              <Icon className="w-12 h-12 mb-3" />
              <span className="text-sm font-medium text-gray-900">{name}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}