import { MenuBarExtra, showToast, Toast, Icon, updateCommandMetadata } from "@raycast/api";
import { useState, useEffect } from "react";
import { getPrivateModeStatus, enablePrivateMode, disablePrivateMode } from "./api";

export default function Command() {
  const [isLoading, setIsLoading] = useState(true);
  const [privateMode, setPrivateMode] = useState(false);
  const [statusText, setStatusText] = useState("Checking...");
  const [remainingTimeText, setRemainingTimeText] = useState<string | null>(null);
  const [scheduledEndTimeText, setScheduledEndTimeText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkPrivateMode();
  }, []);

  const checkPrivateMode = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const status = await getPrivateModeStatus();
      setPrivateMode(status.privateMode);

      if (status.privateMode) {
        setStatusText("Active");
        if (status.timerActive) {
          if (status.remainingTime) {
            setRemainingTimeText(`Auto-disable in ${status.remainingTime}`);
          } else {
            setRemainingTimeText(null);
          }

          if (status.scheduledDisableTime) {
            setScheduledEndTimeText(`Ends at ${status.scheduledDisableTime}`);
          } else {
            setScheduledEndTimeText(null);
          }
        } else {
          setRemainingTimeText(null);
          setScheduledEndTimeText(null);
        }

        // Update command metadata
        let subtitle = "✓ Private Mode";
        if (status.timerActive) {
          if (status.remainingTime && status.scheduledDisableTime) {
            subtitle = `✓ Private Mode (${status.remainingTime} remaining, ends ${status.scheduledDisableTime})`;
          } else if (status.remainingTime) {
            subtitle = `✓ Private Mode (${status.remainingTime} remaining)`;
          } else if (status.scheduledDisableTime) {
            subtitle = `✓ Private Mode (ends ${status.scheduledDisableTime})`;
          }
        }
        updateCommandMetadata({ subtitle });
      } else {
        setStatusText("Inactive");
        setRemainingTimeText(null);
        setScheduledEndTimeText(null);

        // Update command metadata
        updateCommandMetadata({ subtitle: "✗ Public Mode" });
      }
    } catch (error) {
      setError("Failed to check status");
      setStatusText("Error");
      setRemainingTimeText(null);
      setScheduledEndTimeText(null);
      console.error("Error checking private mode status:", error);

      // Update command metadata for error state
      updateCommandMetadata({ subtitle: "! Status Error" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnablePrivateMode = async (timeRange?: string) => {
    try {
      await enablePrivateMode(timeRange);
      await showToast({
        style: Toast.Style.Success,
        title: "Private Mode Enabled",
        message: timeRange ? `Will auto-disable in ${timeRange}` : "Enabled indefinitely",
      });
      await checkPrivateMode();
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to Enable Private Mode",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const handleDisablePrivateMode = async () => {
    try {
      await disablePrivateMode();
      await showToast({
        style: Toast.Style.Success,
        title: "Private Mode Disabled",
      });
      await checkPrivateMode();
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to Disable Private Mode",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const getIcon = () => {
    if (isLoading) return { source: Icon.CircleProgress };
    if (error) return { source: Icon.ExclamationMark };
    return { source: privateMode ? Icon.Eye : Icon.EyeDisabled };
  };

  const getTooltip = () => {
    if (isLoading) return "Checking private mode status...";
    if (error) return "Error checking private mode status";

    if (privateMode) {
      let tooltip = "Private Mode: Active";
      if (remainingTimeText) tooltip += ` (${remainingTimeText})`;
      if (scheduledEndTimeText) tooltip += ` (${scheduledEndTimeText})`;
      return tooltip;
    }

    return "Private Mode: Inactive";
  };

  return (
    <MenuBarExtra icon={getIcon()} title={privateMode ? "On" : "Off"} tooltip={getTooltip()} isLoading={isLoading}>
      <MenuBarExtra.Section title="Status">
        <MenuBarExtra.Item title={`Private Mode: ${statusText}`} icon={privateMode ? Icon.Eye : Icon.EyeDisabled} />
        {remainingTimeText && <MenuBarExtra.Item title={remainingTimeText} icon={Icon.Clock} />}
        {scheduledEndTimeText && <MenuBarExtra.Item title={scheduledEndTimeText} icon={Icon.Calendar} />}
      </MenuBarExtra.Section>

      <MenuBarExtra.Section title="Actions">
        {privateMode ? (
          <MenuBarExtra.Item title="Disable Private Mode" icon={Icon.EyeDisabled} onAction={handleDisablePrivateMode} />
        ) : (
          <>
            <MenuBarExtra.Item title="Enable Private Mode" icon={Icon.Eye} onAction={() => handleEnablePrivateMode()} />
            <MenuBarExtra.Item
              title="Enable for 30 Minutes"
              icon={Icon.Clock}
              onAction={() => handleEnablePrivateMode("30m")}
            />
            <MenuBarExtra.Item
              title="Enable for 1 Hour"
              icon={Icon.Clock}
              onAction={() => handleEnablePrivateMode("1h")}
            />
            <MenuBarExtra.Item
              title="Enable for 8 Hours"
              icon={Icon.Clock}
              onAction={() => handleEnablePrivateMode("8h")}
            />
          </>
        )}
      </MenuBarExtra.Section>

      <MenuBarExtra.Section>
        <MenuBarExtra.Item title="Refresh Status" icon={Icon.ArrowClockwise} onAction={checkPrivateMode} />
      </MenuBarExtra.Section>
    </MenuBarExtra>
  );
}
