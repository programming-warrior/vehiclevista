import axios from "axios";
import { BACKEND_URL } from "@/lib/constants";

// --- API Utility Functions using Axios ---

/**
 * Fetches a paginated list of all packages for the admin.
 */
export async function adminGetPackages({ page = 1, limit = 10 }: { page: number; limit: number; }) {
  try {
    const sessionId = localStorage.getItem("sessionId");
    const response = await axios.get(`${BACKEND_URL}/api/admin/packages/all`, {
      params: { page, limit },
      headers: {
        Authorization: `Bearer ${sessionId}`,
      },
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || "Failed to fetch packages.");
  }
}

/**
 * Adds a new package.
 */
export async function adminAddPackage(packageData: any) {
  try {
    const sessionId = localStorage.getItem("sessionId");
    const payload = {
      ...packageData,
      prices: JSON.parse(packageData.prices), 
      features: JSON.parse(packageData.features), 
    };
    const response = await axios.post(`${BACKEND_URL}/api/admin/packages/add`, payload, {
        headers: {
            Authorization: `Bearer ${sessionId}`,
        },
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || "Failed to add package.");
  }
}

/**
 * Updates an existing package.
 */
export async function adminUpdatePackage(id: number, packageData: any) {
  try {
    const sessionId = localStorage.getItem("sessionId");
    const body: { [key: string]: any } = { ...packageData };
    if (body.prices && typeof body.prices === 'string') {
        body.prices = JSON.parse(body.prices);
    }
    if (body.features && typeof body.features === 'string') {
        body.features = JSON.parse(body.features);
    }

    const response = await axios.put(`${BACKEND_URL}/api/admin/packages/update/${id}`, body, {
        headers: {
            Authorization: `Bearer ${sessionId}`,
        },
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || "Failed to update package.");
  }
}

/**
 * Toggles the active status of a package.
 */
export async function adminTogglePackageActive(id: number) {
  try {
    const sessionId = localStorage.getItem("sessionId");
    const response = await axios.put(`${BACKEND_URL}/api/admin/packages/toggle-active/${id}`, null, {
        headers: {
            Authorization: `Bearer ${sessionId}`,
        },
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || "Failed to toggle package status.");
  }
}
