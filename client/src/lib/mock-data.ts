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
      "https://images.unsplash.com/photo-1616422285623-13ff0162193c?auto=format&fit=crop&w=800",
      "https://images.unsplash.com/photo-1609619385002-f40f1df9b7eb?auto=format&fit=crop&w=800",
      "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=800"
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
      "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=800",
      "https://images.unsplash.com/photo-1611016186353-9af58c69a533?auto=format&fit=crop&w=800",
      "https://images.unsplash.com/photo-1611651338412-8403fa6e3599?auto=format&fit=crop&w=800"
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
      "https://images.unsplash.com/photo-1567784177951-6fa58317e16b?auto=format&fit=crop&w=800",
      "https://images.unsplash.com/photo-1581059686228-c10d7cd37dd0?auto=format&fit=crop&w=800",
      "https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=800"
    ]
  },
  {
    id: 4,
    title: "2022 BMW X5 M Sport",
    price: 75995,
    year: 2022,
    make: "BMW",
    model: "X5",
    mileage: 8000,
    fuelType: "Diesel",
    transmission: "Automatic",
    bodyType: "SUV",
    color: "Alpine White",
    description: "Stunning X5 M Sport with panoramic roof and professional multimedia package.",
    location: "Edinburgh, UK",
    latitude: 55.9533,
    longitude: -3.1883,
    category: "suv",
    images: [
      "https://images.unsplash.com/photo-1617469767053-3f7c82b426f4?auto=format&fit=crop&w=800",
      "https://images.unsplash.com/photo-1616422285623-13ff0162193c?auto=format&fit=crop&w=800",
      "https://images.unsplash.com/photo-1607853202273-797f1c22a38e?auto=format&fit=crop&w=800"
    ]
  },
  {
    id: 5,
    title: "2023 Volkswagen Transporter T6.1",
    price: 42995,
    year: 2023,
    make: "Volkswagen",
    model: "Transporter",
    mileage: 5000,
    fuelType: "Diesel",
    transmission: "Manual",
    bodyType: "Van",
    color: "Candy White",
    description: "Latest T6.1 model with air conditioning and navigation system.",
    location: "Leeds, UK",
    latitude: 53.8008,
    longitude: -1.5491,
    category: "van",
    images: [
      "https://images.unsplash.com/photo-1631793740332-49a6b399f6ef?auto=format&fit=crop&w=800",
      "https://images.unsplash.com/photo-1632923047346-3f9f35cf3a6f?auto=format&fit=crop&w=800",
      "https://images.unsplash.com/photo-1632923048791-89b6fab7dc2a?auto=format&fit=crop&w=800"
    ]
  }
];

export const categories = [
  { id: "all", label: "All Vehicles" },
  { id: "luxury", label: "Luxury Cars" },
  { id: "sports", label: "Sports Cars" },
  { id: "classic", label: "Classic Cars" },
  { id: "suv", label: "SUVs" },
  { id: "van", label: "Vans" }
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