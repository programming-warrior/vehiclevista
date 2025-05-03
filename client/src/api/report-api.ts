import axios from "axios";
import { BACKEND_URL } from "@/lib/constants";

export async function uploadUserReport(reportData: any) {
  try {
    const response = await axios.post(
      `${BACKEND_URL}/api/report/user`,
        reportData,
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

export async function uploadListingReport(reportData: any) {
    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/report/listing`,
          reportData,
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


