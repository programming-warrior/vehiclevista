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
      "https://images.unsplash.com/photo-1618418721668-0d1f72aa4bab",
      "https://images.unsplash.com/photo-1581814706561-f5bbfa7d984a",
      "https://images.unsplash.com/photo-1583573278124-e8d4fd3edf3c"
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
      "https://images.unsplash.com/photo-1532581140115-3e355d1ed1de",
      "https://images.unsplash.com/photo-1593427934550-4742b652ac84",
      "https://images.unsplash.com/photo-1606128031531-52ae98c9707a"
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
      "https://images.unsplash.com/photo-1505691730847-e62da813ed0e",
      "https://images.unsplash.com/photo-1522775644932-1e20a2479066",
      "https://images.unsplash.com/photo-1547731269-e4073e054f12"
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
