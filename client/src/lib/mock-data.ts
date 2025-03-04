import type { Vehicle } from "@shared/schema";

export const mockVehicles: Vehicle[] = [
  {
    id: 1,
    title: "2021 Mercedes-Benz S-Class S500 AMG Line",
    price: 89995,
    year: 2021,
    make: "Mercedes-Benz",
    model: "S-Class",
    mileage: 15000,
    fuelType: "Petrol",
    transmission: "Automatic",
    bodyType: "Saloon",
    color: "Obsidian Black",
    description: "Stunning example of the latest S-Class with full service history and amazing specification.",
    location: "London, UK",
    latitude: 51.5074,
    longitude: -0.1278,
    category: "luxury",
    images: [
      "https://images.unsplash.com/photo-1618418721668-0d1f72aa4bab?auto=format&fit=crop&w=800",
      "https://images.unsplash.com/photo-1581814706561-f5bbfa7d984a?auto=format&fit=crop&w=800",
      "https://images.unsplash.com/photo-1583573278124-e8d4fd3edf3c?auto=format&fit=crop&w=800"
    ]
  },
  {
    id: 2,
    title: "2020 Porsche 911 Carrera S",
    price: 94995,
    year: 2020,
    make: "Porsche",
    model: "911",
    mileage: 12000,
    fuelType: "Petrol",
    transmission: "PDK",
    bodyType: "Coupe",
    color: "GT Silver",
    description: "Beautiful 992 generation 911 with Sports Chrono Package and extended leather interior.",
    location: "Manchester, UK",
    latitude: 53.4808,
    longitude: -2.2426,
    category: "sports",
    images: [
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800",
      "https://images.unsplash.com/photo-1614200187524-dc4b892acf16?auto=format&fit=crop&w=800",
      "https://images.unsplash.com/photo-1626668893632-6f3a4466d22f?auto=format&fit=crop&w=800"
    ]
  },
  {
    id: 3,
    title: "1965 Ford Mustang Fastback",
    price: 65000,
    year: 1965,
    make: "Ford",
    model: "Mustang",
    mileage: 84000,
    fuelType: "Petrol",
    transmission: "Manual",
    bodyType: "Coupe",
    color: "Vintage Burgundy",
    description: "Beautifully restored classic Mustang Fastback. Original engine with documented history.",
    location: "Birmingham, UK",
    latitude: 52.4862,
    longitude: -1.8904,
    category: "classic",
    images: [
      "https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?auto=format&fit=crop&w=800",
      "https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=800",
      "https://images.unsplash.com/photo-1587838155980-392e89172c44?auto=format&fit=crop&w=800"
    ]
  }
];

export const categories = [
  { id: "all", label: "All Vehicles" },
  { id: "luxury", label: "Luxury Cars" },
  { id: "sports", label: "Sports Cars" },
  { id: "classic", label: "Classic Cars" },
  { id: "suv", label: "SUVs" },
  { id: "van", label: "Vans" },
  { id: "bike", label: "Bikes" }
];

export const bodyTypes = [
  "Saloon",
  "Coupe",
  "SUV",
  "Hatchback",
  "Estate",
  "Convertible",
  "Van"
];

export const makes = [
  "Audi",
  "BMW",
  "Ford",
  "Mercedes-Benz",
  "Porsche",
  "Toyota",
  "Volkswagen"
];