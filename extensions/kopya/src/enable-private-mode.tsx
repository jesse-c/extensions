import { showToast, Toast } from "@raycast/api";
import { enablePrivateMode } from "./api";

interface Arguments {
  hours?: string;
  minutes?: string;
}

export default async function Command(props: { arguments: Arguments }) {
  try {
    console.log("Command arguments:", JSON.stringify(props.arguments));

    const { hours, minutes } = props.arguments;

    console.log("Hours:", hours, "Minutes:", minutes);

    // Calculate total time in minutes
    let timeRange: string | undefined = undefined;
    let timeDescription = "";

    // Check if we have valid numeric inputs
    const hoursNum = hours && hours.trim() !== "" ? parseInt(hours, 10) : 0;
    const minutesNum = minutes && minutes.trim() !== "" ? parseInt(minutes, 10) : 0;

    console.log("Parsed hours:", hoursNum, "Parsed minutes:", minutesNum);

    // Only proceed if we have at least one valid number > 0
    if ((hoursNum > 0 || minutesNum > 0) && !isNaN(hoursNum) && !isNaN(minutesNum)) {
      // If both are specified, combine them
      if (hoursNum > 0 && minutesNum > 0) {
        timeRange = `${hoursNum}h${minutesNum}m`;
        timeDescription = `${hoursNum} hour${hoursNum !== 1 ? "s" : ""} ${minutesNum} minute${minutesNum !== 1 ? "s" : ""}`;
      }
      // If only hours are specified
      else if (hoursNum > 0) {
        timeRange = `${hoursNum}h`;
        timeDescription = `${hoursNum} hour${hoursNum !== 1 ? "s" : ""}`;
      }
      // If only minutes are specified
      else if (minutesNum > 0) {
        timeRange = `${minutesNum}m`;
        timeDescription = `${minutesNum} minute${minutesNum !== 1 ? "s" : ""}`;
      }

      console.log("Generated timeRange:", timeRange);
    } else {
      console.log("No valid time range provided");
    }

    console.log("Final timeRange being sent to API:", timeRange);

    // Call API with explicit timeRange
    const result = await enablePrivateMode(timeRange);

    console.log("API response:", result);

    await showToast({
      style: Toast.Style.Success,
      title: "Private Mode Enabled",
      message: timeRange ? `Will auto-disable in ${timeDescription}.` : "Enabled indefinitely.",
    });
  } catch (error) {
    console.error("Error in enable-private-mode command:", error);
    await showToast({
      style: Toast.Style.Failure,
      title: "Failed to Enable Private Mode",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
