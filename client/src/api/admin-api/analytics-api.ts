import axios from "axios";
import { BACKEND_URL } from "@/lib/constants";

export async function getPerformanceMetrics() {
    try{
        const response = await axios.get(`${BACKEND_URL}/api/admin/analytics/performance-metrics`,
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("sessionId")}`,
                },
                withCredentials: true,
            }
        );
        return response.data;
    }
    catch(error: any) {
        throw new Error(
            error.response?.data?.message || "Error fetching performance metrics"
        );
    }

}

export async function getTopListings() {
    try{
        const response = await axios.get(`${BACKEND_URL}/api/admin/analytics/top-listings`,
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("sessionId")}`,
                },
                withCredentials: true,
            }
        );
        return response.data;
    }
    catch(error: any) {
        throw new Error(
            error.response?.data?.message || "Error fetching performance metrics"
        );
    }

}