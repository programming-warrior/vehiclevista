import { Vehicle } from "@shared/schema";
import { BACKEND_URL } from "../constants";
import { QueryFunctionContext } from "@tanstack/react-query";

export async function fetchFeaturedVehicles({
  queryKey,
}: QueryFunctionContext<[string, string]>): Promise<Vehicle[]> {
  const [, category] = queryKey;
  const response = await fetch(BACKEND_URL + `/api/vehicles?category=${category}`);
  return response.json();
}
