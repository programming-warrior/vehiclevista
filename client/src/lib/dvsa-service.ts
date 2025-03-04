import { apiRequest } from "./queryClient";

export interface DVLAVehicleResponse {
  registrationNumber: string;
  make: string;
  model: string;
  yearOfManufacture: number;
  engineCapacity: number;
  fuelType: string;
  color: string;
}

export async function lookupVehicle(registrationNumber: string): Promise<DVLAVehicleResponse> {
  try {
    const response = await apiRequest(
      "POST",
      "/api/vehicles/lookup",
      { registrationNumber }
    );
    return await response.json();
  } catch (error) {
    throw new Error("Failed to lookup vehicle details");
  }
}
