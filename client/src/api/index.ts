import { BACKEND_URL } from "@/lib/constants";
import axios from "axios";
import {
  registerUser,
  loginUser,
  validateSession,
  logoutUser,
} from "./user-api";
import {
  getVehicles,
  advanceVehicleSearch,
  uploadSingleVehicle,
  uploadBulkVehicle,
  getSellerVehicleListings
} from "./vehicle-api";


async function uploadToPresignedUrl(file: File, presignedUrl: string): Promise<string> {
    try {
      console.log(file.type);
      const response = await fetch(presignedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to upload image: ${response.statusText}`);
      }
      
      // Return the public URL by removing the query parameters from presignedUrl
      return presignedUrl.split('?')[0];
    } catch (error) {
      console.error("Error uploading file:", error);
      throw error;
    }
  }

async function getPresignedUrls(
  files: {
    fileName: string;
    contentType: string;
  }[]
) {
  try {
    const response = await axios.post(
      `${BACKEND_URL}/api/presigned-url`, 
      { files },
      {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
          "Authorization":`Bearer ${localStorage.getItem('sessionId')}`
        },
      }
    );
    return response;
  } catch (error) {
    console.error("Error getting presigned URLs:", error);
    throw error;
  }
}

export {
  uploadToPresignedUrl,
  getPresignedUrls,

  getVehicles,
  advanceVehicleSearch,
  uploadSingleVehicle,
  uploadBulkVehicle,
  getSellerVehicleListings,

  registerUser,
  loginUser,
  validateSession,
  logoutUser,
};