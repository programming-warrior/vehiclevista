import { db } from "../db"; 
import { vehicles } from '../../shared/schema'; 
import { faker } from '@faker-js/faker';
import { eq } from 'drizzle-orm';

async function seedVehicles(count: number = 40) {
  // Create a type for the makes to ensure type safety
  const makes = ['BMW', 'Audi', 'Mercedes-Benz'] as const;
  type Make = typeof makes[number];
  
  const models = {
    'BMW': ['X3', 'X5', '3 Series'],
    'Audi': ['A4', 'Q5', 'A6'],
    'Mercedes-Benz': ['C-Class', 'E-Class', 'GLA'],
  };
  
  const bodyTypes = ['SUV', 'Sedan', 'Coupe', 'Hatchback'];
  const fuelTypes = ['Petrol', 'Diesel', 'Electric', 'Hybrid'];
  const transmissions = ['Automatic', 'Manual'];
  const categories = ['dealer', 'classified', 'auction'];
  const conditions = ['clean', 'catS', 'catN'];
  const sellerTypes = ['private', 'trader', 'garage'];
  const contactPreferences = ['phone', 'email', 'both'];
  const colors = ['Black', 'White', 'Silver', 'Red', 'Blue'];

  const vehicleData = Array.from({ length: count }).map(() => {
    // Use type assertion to tell TypeScript that make is a valid key
    const make = faker.helpers.arrayElement(makes) as Make;
    const model = faker.helpers.arrayElement(models[make]);

    return {
      title: `${make} ${model} ${faker.vehicle.model()}`,
      price: faker.number.int({ min: 5000, max: 90000 }),
      year: faker.number.int({ min: 2008, max: 2023 }),
      make,
      model: model as string, // Explicitly cast to string
      mileage: faker.number.int({ min: 10000, max: 150000 }),
      fuelType: faker.helpers.arrayElement(fuelTypes),
      transmission: faker.helpers.arrayElement(transmissions),
      bodyType: faker.helpers.arrayElement(bodyTypes),
      color: faker.helpers.arrayElement(colors),
      description: faker.lorem.sentences(2),
      location: faker.location.city(),
      latitude: faker.location.latitude(),
      longitude: faker.location.longitude(),
      images: [faker.image.urlPicsumPhotos(), faker.image.urlPicsumPhotos()],
      category: faker.helpers.arrayElement(categories),
      condition: faker.helpers.arrayElement(conditions),
      openToPX: faker.datatype.boolean(),
      sellerId: faker.number.int({ min: 1, max: 100 }),
      sellerType: faker.helpers.arrayElement(sellerTypes),
      contactPreference: faker.helpers.arrayElement(contactPreferences),
      listingStatus: 'active',
      negotiable: faker.datatype.boolean(),
      createdAt: new Date(),
      views: faker.number.int({ min: 0, max: 1000 }),
      clicks: faker.number.int({ min: 0, max: 500 }),
      leads: faker.number.int({ min: 0, max: 100 }),
    };
  });

  console.log(`Seeding ${count} vehicles...`);
  await db.insert(vehicles).values(vehicleData);
  console.log('✅ Seeding completed.');
}

seedVehicles().catch((err) => {
  console.error('❌ Seeding failed:', err);
});