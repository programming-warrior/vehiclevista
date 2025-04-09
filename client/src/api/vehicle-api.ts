import axios from "axios";
import { BACKEND_URL } from "@/lib/constants";
import z from "zod";

export async function getVehicles(searchParams:string){
  try {
    const response = await axios.get(
      `${BACKEND_URL}/api/vehicles/get?`+searchParams  
    );
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Registration failed");
  }
}