import axios from "axios";
import { BACKEND_URL } from "@/lib/constants";
import z from "zod";
// import { vehicleUploadSchema } from "@shared/zodSchema/vehicleSchema";

export async function createAuction(
  data:any
) {
  try {
    const response = await axios.post(
      `${BACKEND_URL}/api/auction/create`,
      {
        ...data,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("sessionId")}`,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message);
  }
}

export async function getActiveAuctions(searchParams: string) {
  try {
    const response = await axios.get(
      `${BACKEND_URL}/api/auction/get` + searchParams
    );
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Error fetching vehicle list"
    );
  }
}

export async function getAuctionById(auctionId: string) {
  try {
    const response = await axios.get(
      `${BACKEND_URL}/api/auction/get/${auctionId}`, 
    );
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Error fetching vehicle list"
    );
  }
}