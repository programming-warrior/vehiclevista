import { Link } from "wouter";
import VehicleCard from "@/components/vehicle-card";
import type { Vehicle } from "@shared/schema";

export default function SuperAdSection() {
  // Example data - replace with real data from API
  const vehicles = [
    {
      id: 1,
      title: "Ford Transit - 2021",
      description: "4.0 D5 PowerPulse Momentum 5dr AW...",
      price: 22000,
      mileage: 2500,
      fuelType: "Diesel",
      transmission: "Manual",
      condition: "clean",
      images: ["https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=800"],
    },
    {
      id: 2,
      title: "New GLC - 2023",
      description: "4.0 D5 PowerPulse Momentum 5dr AW...",
      price: 95000,
      mileage: 50,
      fuelType: "Petrol",
      transmission: "Automatic",
      condition: "clean",
      images: ["https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800"],
    },
    {
      id: 3,
      title: "Audi A6 3.5 - New",
      description: "3.5 D5 PowerPulse Momentum 5dr AW...",
      price: 58000,
      mileage: 100,
      fuelType: "Petrol",
      transmission: "Automatic",
      condition: "clean",
      images: ["https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=800"],
    },
    {
      id: 4,
      title: "Corolla Altis - 2023",
      description: "3.5 D5 PowerPulse Momentum 5dr AW...",
      price: 45000,
      mileage: 15000,
      fuelType: "Petrol",
      transmission: "Automatic",
      condition: "clean",
      images: ["https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=800"],
    }
  ] as Vehicle[];

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold">Super Ad (8)</h2>
          <Link href="/super-ads" className="text-sm text-gray-500 hover:text-gray-700">
            View All
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {vehicles.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} />
          ))}
        </div>
      </div>
    </section>
  );
}
