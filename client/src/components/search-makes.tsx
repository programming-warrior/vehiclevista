import { Card } from "@/components/ui/card";
import { Link } from "wouter";
import {
  SiAudi,
  SiBmw,
  SiToyota,
  SiFerrari,
  SiLamborghini,
  SiVolkswagen,
} from "react-icons/si";
import { useHeroSectionSearch } from "@/hooks/use-store";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

const carBrands = [
  { id: "audi", name: "Audi", Icon: SiAudi },
  { id: "bmw", name: "BMW", Icon: SiBmw },
  { id: "ferrari", name: "Ferrari", Icon: SiFerrari },
  { id: "volkswagen", name: "Volkswagen", Icon: SiVolkswagen },
  { id: "toyota", name: "Toyota", Icon: SiToyota },
  { id: "lamborghini", name: "Lamborghini", Icon: SiLamborghini },
];

export default function SearchMakes() {
  const { brand, setSearch } = useHeroSectionSearch();
  const [_ , setLocation ] = useLocation();
  const [isClicked, setIsClicked ] = useState(false);
  

  useEffect(() => {
    if (brand && isClicked) {
       setLocation(`/vehicle`);
      //  setIsClicked(false);
    }
  }, [brand, setSearch]);

  return (
    <section className="py-12 px-10 bg-pink-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold">Search Makes</h2>
          {/* <Link href="/makes" className="text-sm text-gray-500 hover:text-gray-700">
            View All
          </Link> */}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {carBrands.map(({ id, name, Icon }) => (
            <div
            
              key={id}
              onClick={() => {
                setSearch({
                  color: "",
                  fuelType: "",
                  brand: name,
                  model: "",
                  variant: "",
                  transmissionType: "",
                  vehicleType: "",
                  maxBudget: 0,
                  minBudget: 0,
                });
                setIsClicked(true);
              }}
              className="bg-white cursor-pointer rounded-xl p-6 flex flex-col items-center justify-center hover:shadow-md transition-shadow"
            >
              <Icon className="w-12 h-12 mb-3" />
              <span className="text-sm font-medium text-gray-900">{name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
