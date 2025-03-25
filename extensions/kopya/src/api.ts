import fetch from "node-fetch";
import { getPreferenceValues } from "@raycast/api";

interface Preferences {
  apiUrl: string;
}

export interface ClipboardEntry {
  id: string;
  content: string;
  type: string;
  humanReadableType: string;
  timestamp: string;
  isTextual: boolean;
}

export interface HistoryResponse {
  entries: ClipboardEntry[];
  total: number;
}

interface SearchParams {
  query?: string;
  type?: string;
  limit?: number;
}

function isHistoryResponse(data: unknown): data is HistoryResponse {
  if (!data || typeof data !== "object") return false;
  const response = data as Record<string, unknown>;
  
  if (!Array.isArray(response.entries)) return false;
  if (typeof response.total !== "number") return false;

  return response.entries.every(entry => {
    if (!entry || typeof entry !== "object") return false;
    const e = entry as Record<string, unknown>;
    return (
      typeof e.id === "string" &&
      typeof e.content === "string" &&
      typeof e.type === "string" &&
      typeof e.humanReadableType === "string" &&
      typeof e.timestamp === "string" &&
      typeof e.isTextual === "boolean"
    );
  });
}

export async function getHistory(params: SearchParams = {}): Promise<HistoryResponse> {
  const preferences = getPreferenceValues<Preferences>();
  const searchParams = new URLSearchParams();
  
  if (params.query) {
    searchParams.append("query", params.query);
  }
  if (params.type) {
    searchParams.append("type", params.type);
  }
  if (params.limit) {
    searchParams.append("limit", params.limit.toString());
  }

  const queryString = searchParams.toString();
  const url = `${preferences.apiUrl}/history${queryString ? `?${queryString}` : ""}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: unknown = await response.json();
    if (!isHistoryResponse(data)) {
      throw new Error("Invalid response format from API");
    }
    
    return data;
  } catch (error) {
    console.error("Error fetching history:", error);
    throw error;
  }
}

export interface DeleteByIdResponse {
  success: boolean;
  id: string;
  message: string;
}

export async function deleteEntryById(id: string): Promise<DeleteByIdResponse> {
  const preferences = getPreferenceValues<Preferences>();
  // Ensure the URL is properly formatted and the ID is encoded
  const url = `${preferences.apiUrl}/history/${encodeURIComponent(id)}`;
  
  console.log(`Attempting to delete entry with ID: ${id}`);
  console.log(`DELETE request URL: ${url}`);

  try {
    const response = await fetch(url, {
      method: "DELETE",
    });
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => "No error details available");
      console.error(`Delete request failed with status ${response.status}: ${errorText}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("Delete response:", data);
    return data as DeleteByIdResponse;
  } catch (error) {
    console.error("Error deleting entry:", error);
    throw error;
  }
}
