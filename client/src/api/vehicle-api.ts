import axios from "axios";
import { BACKEND_URL } from "@/lib/constants";
import z from "zod";
import { vehicleUploadSchema } from "@shared/zodSchema/vehicleSchema";

export async function getVehicles(searchParams: string) {
  try {
    const response = await axios.get(
      `${BACKEND_URL}/api/vehicles?` + searchParams
    );
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Error fetching vehicle list"
    );
  }
}

export async function getVehicleById(vehicleId: string) {
  try {
    const response = await axios.get(
      `${BACKEND_URL}/api/vehicles/` + vehicleId
    );
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Error fetching vehicle list"
    );
  }
}


export async function getFeaturedVehicles(searchParam: string) {
  try {
    const response = await axios.get(
      `${BACKEND_URL}/api/vehicles/featured?` + searchParam
    );
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Error fetching vehicle list"
    );
  }
}

export async function getDraftVehicle(draftId: number) {
  try {
    const response = await axios.get(
      `${BACKEND_URL}/api/vehicles/seller/draft/` + draftId,
      {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("sessionId")}`,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Error fetching vehicle list"
    );
  }
}

export async function getSellerVehicleListings(searchParams: string) {
  try {
    const response = await axios.get(
      `${BACKEND_URL}/api/vehicles/seller/listings?` + searchParams,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${localStorage.getItem("sessionId")}`,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Error fetching vehicle list"
    );
  }
}

export async function advanceVehicleSearch(searchParam: string) {
  try {
    const response = await axios.post(
      `${BACKEND_URL}/api/vehicles/advance-search`,
      {
        searchParam,
      }
    );
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message);
  }
}

export async function uploadBulkVehicle(formData: FormData) {
  try {
    const response = await axios.post(
      `${BACKEND_URL}/api/vehicles/upload-bulk`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${localStorage.getItem("sessionId")}`,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message);
  }
}

export async function uploadSingleVehicle(
  data: z.infer<typeof vehicleUploadSchema>
) {
  try {
    const response = await axios.post(
      `${BACKEND_URL}/api/vehicles/upload-single`,
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
    console.log(error);
    throw new Error(error.response?.data?.error);
  }
}

export async function incrementVehicleClicks(vehicleId: string) {
  try {
    const response = await axios.post(
      `${BACKEND_URL}/api/vehicles/increase-clicks/`,
      {
        vehicleId,
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
    throw new Error(
      error.response?.data?.message || "Error incrementing vehicle clicks"
    );
  }
}

export async function incrementVehicleViews(vehicleId: string) {
  try {
    const response = await axios.post(
      `${BACKEND_URL}/api/vehicles/increase-views/`,
      {
        vehicleId,
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
    // throw new Error(
    //   error.response?.data?.message || "Error incrementing vehicle clicks"
    // );
  }
}
