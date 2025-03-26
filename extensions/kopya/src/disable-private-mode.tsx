import { showToast, Toast } from "@raycast/api";
import { disablePrivateMode } from "./api";

export default async function Command() {
  try {
    const result = await disablePrivateMode();
    await showToast({
      style: Toast.Style.Success,
      title: "Private Mode Disabled",
      message: result.message,
    });
  } catch (error) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Failed to Disable Private Mode",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
