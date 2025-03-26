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

  return response.entries.every((entry) => {
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

  // Determine which endpoint to use based on whether we're searching
  const endpoint = params.query ? "search" : "history";

  if (params.query) {
    console.log(`Searching with query: ${params.query}`);
    searchParams.append("query", params.query);
  }
  if (params.type) {
    searchParams.append("type", params.type);
  }
  if (params.limit) {
    searchParams.append("limit", params.limit.toString());
  }

  const queryString = searchParams.toString();
  const url = `${preferences.apiUrl}/${endpoint}${queryString ? `?${queryString}` : ""}`;
  console.log(`Fetching from: ${url}`);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: unknown = await response.json();
    if (!isHistoryResponse(data)) {
      throw new Error("Invalid response format from API");
    }

    console.log(`Received ${data.entries.length} entries from API`);
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

export interface PrivateModeResponse {
  success: boolean;
  message: string;
}

export interface PrivateModeStatusResponse {
  privateMode: boolean;
  timerActive: boolean;
  scheduledDisableTime: string | null;
  remainingTime: string | null;
}

export async function enablePrivateMode(timeRange?: string): Promise<PrivateModeResponse> {
  const preferences = getPreferenceValues<Preferences>();
  const baseUrl = `${preferences.apiUrl}/private/enable`;

  console.log(`Enabling private mode${timeRange ? ` with time range: ${timeRange}` : ""}`);

  try {
    // Only append the query parameter if timeRange is defined and not empty
    let requestUrl = baseUrl;
    if (timeRange && timeRange.trim() !== "") {
      const queryParam = new URLSearchParams({ range: timeRange }).toString();
      requestUrl = `${baseUrl}?${queryParam}`;
    }

    console.log("Request URL:", requestUrl);

    const response = await fetch(requestUrl, {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Enable private mode response:", data);
    return data as PrivateModeResponse;
  } catch (error) {
    console.error("Error enabling private mode:", error);
    throw error;
  }
}

export async function disablePrivateMode(): Promise<PrivateModeResponse> {
  const preferences = getPreferenceValues<Preferences>();
  const url = `${preferences.apiUrl}/private/disable`;

  console.log("Disabling private mode");

  try {
    const response = await fetch(url, {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Disable private mode response:", data);
    return data as PrivateModeResponse;
  } catch (error) {
    console.error("Error disabling private mode:", error);
    throw error;
  }
}

export async function getPrivateModeStatus(): Promise<PrivateModeStatusResponse> {
  const preferences = getPreferenceValues<Preferences>();
  const url = `${preferences.apiUrl}/private/status`;

  console.log("Getting private mode status");

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Private mode status response:", data);
    return data as PrivateModeStatusResponse;
  } catch (error) {
    console.error("Error getting private mode status:", error);
    throw error;
  }
}
