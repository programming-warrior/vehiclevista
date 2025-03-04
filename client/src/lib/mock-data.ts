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
      "https://images.unsplash.com/photo-1563720360172-67b8f3dce741",
      "https://images.unsplash.com/photo-1605515298946-d864f4a4d715",
      "https://images.unsplash.com/photo-1554222413-474187503de3"
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
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70",
      "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d",
      "https://images.unsplash.com/photo-1582134133410-c9e3cc35f7d0"
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
      "https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd",
      "https://images.unsplash.com/photo-1621800043295-a73fe2f76e2c",
      "https://images.unsplash.com/photo-1583121274602-3e2820c69888"
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
      "https://images.unsplash.com/photo-1555215695-3004980ad54e",
      "https://images.unsplash.com/photo-1549399542-7e3f8b79c341",
      "https://images.unsplash.com/photo-1506015391300-4802dc74de2e"
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
      "https://images.unsplash.com/photo-1558185348-c1f6e23de77c",
      "https://images.unsplash.com/photo-1559416523-140ddc3d238c",
      "https://images.unsplash.com/photo-1586190848861-99aa4a171e90"
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