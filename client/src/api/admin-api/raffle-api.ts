import axios from "axios";
import { BACKEND_URL } from "@/lib/constants";

export async function getRaffles(options: { page?: number; limit?: number, filter?:any } = {} ) {
  try {
    const { page = 1, limit = 5, filter } = options;
    const response = await axios.get(
      `${BACKEND_URL}/api/admin/raffle/get?page=${page}&limit=${limit}&filter=${filter}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("sessionId")}`,
        },
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Error fetching performance metrics"
    );
  }
}

export async function createRaffle(data : any ) {
    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/admin/raffle/create`,
        data,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("sessionId")}`,
          },
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Error creating raffle"
      );
    }
  }
  



