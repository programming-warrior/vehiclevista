import axios from "axios";
import { BACKEND_URL } from "@/lib/constants";


export async function blacklistUser(userId: string, reason: string) {
  try {
    const response = await axios.put(
      `${BACKEND_URL}/api/admin/black-list/${userId}`,
      { 
        reason: reason,
      },
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
      error.response?.data?.message || "Error blacklisting user"
    );
  }
}

export async function unBlacklistUser(userId: string, reason: string) {
    try {
      const response = await axios.put(
        `${BACKEND_URL}/api/admin/un-black-list/${userId}`,
        { 
          reason: reason,
        },
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
        error.response?.data?.message || "Error blacklisting user"
      );
    }
  }


export async function getUsers(options: { 
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
      `${BACKEND_URL}/api/admin/users?${queryParams.toString()}`,
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
      error.response?.data?.message || "Error fetching users"
    );
  }
}