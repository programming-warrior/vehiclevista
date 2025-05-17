import axios from "axios";
import { BACKEND_URL } from "@/lib/constants";


// export async function blacklistVehicle(auctionId: string, reason: string) {
//   try {
//     const response = await axios.put(
//       `${BACKEND_URL}/api/admin/black-list/auctions/${auctionId}`,
//       { 
//         reason: reason,
//       },
//       {
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${localStorage.getItem("sessionId")}`,
//         },
//         withCredentials: true,
//       }
//     );
//     return response.data;
//   } catch (error: any) {
//     throw new Error(
//       error.response?.data?.message || "Error blacklisting auction"
//     );
//   }
// }

// export async function unBlacklistVehicle(auctionId: string, reason: string) {
//     try {
//       const response = await axios.put(
//         `${BACKEND_URL}/api/admin/un-black-list/auctions/${auctionId}`,
//         { 
//           reason: reason,
//         },
//         {
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${localStorage.getItem("sessionId")}`,
//           },
//           withCredentials: true,
//         }
//       );
//       return response.data;
//     } catch (error: any) {
//       throw new Error(
//         error.response?.data?.message || "Error blacklisting auction"
//       );
//     }
//   }


export async function adminGetAuctions(options: { 
  page?: number; 
  limit?: number, 
  sortBy?: string,
  filter?: string 
} = {}) {
  try {
    const { page = 1, limit = 10, sortBy = "newest", filter } = options;
    
    const queryParams = new URLSearchParams();
    queryParams.append("page", page.toString());
    queryParams.append("limit", limit.toString());
    
    if (sortBy) {
      queryParams.append("sortBy", sortBy);
    }
    
    if (filter) {
      queryParams.append("filter", filter);
    }
    
    const response = await axios.get(
      `${BACKEND_URL}/api/admin/auctions?${queryParams.toString()}`,
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
      error.response?.data?.message || "Error fetching auction"
    );
  }
}