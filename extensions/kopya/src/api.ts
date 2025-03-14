import fetch from "node-fetch";
import { getPreferenceValues } from "@raycast/api";

interface Preferences {
  apiUrl: string;
}

export interface ClipboardEntry {
  id: string;
  content: string;
  type: string;
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
