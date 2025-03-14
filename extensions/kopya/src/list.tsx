import { ActionPanel, List, Action, Icon, Detail, showToast, Toast, getPreferenceValues, openExtensionPreferences } from "@raycast/api";
import { useState } from "react";
import { getHistory } from "./api";
import { useCachedPromise } from "@raycast/utils";

type ClipboardType = "All Types" | "Text" | "URL" | "Image" | "File";
const TYPES: ClipboardType[] = ["All Types", "Text", "URL", "Image", "File"];

interface Preferences {
  apiUrl: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function ImagePreview({ content, type }: { content: string; type: string }) {
  return (
    <Detail
      markdown={`<div align="center">

![${type}](data:${type};base64,${content})

Size: ${formatBytes(Buffer.from(content, "base64").length)}
</div>`}
      actions={
        <ActionPanel>
          <Action.CopyToClipboard content={content} title="Copy Image" />
        </ActionPanel>
      }
    />
  );
}

export default function Command() {
  const preferences = getPreferenceValues<Preferences>();
  const [searchText, setSearchText] = useState("");
  const [selectedType, setSelectedType] = useState<ClipboardType>("All Types");

  const { data, isLoading, error } = useCachedPromise(
    async (search: string, type: ClipboardType) => {
      try {
        return await getHistory({
          query: search || undefined,
          type: type === "All Types" ? undefined : type.toLowerCase(),
          limit: 100,
        });
      } catch (err) {
        if (err instanceof Error) {
          await showToast({
            style: Toast.Style.Failure,
            title: "Failed to connect to API",
            message: `Could not connect to ${preferences.apiUrl}`,
          });
        }
        throw err;
      }
    },
    [searchText, selectedType],
    {
      initialData: { entries: [], total: 0 },
    },
  );

  // Group entries by date
  const groupedEntries = data.entries.reduce(
    (groups, entry) => {
      const date = new Date(entry.timestamp);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let groupName = "";
      if (date.toDateString() === today.toDateString()) {
        groupName = "Today";
      } else if (date.toDateString() === yesterday.toDateString()) {
        groupName = "Yesterday";
      } else {
        groupName = date.toLocaleDateString();
      }

      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      groups[groupName].push(entry);
      return groups;
    },
    {} as Record<string, typeof data.entries>,
  );

  const getIcon = (type: string) => {
    if (type.toLowerCase().includes("image")) return Icon.Image;
    if (type.toLowerCase().includes("url")) return Icon.Link;
    if (type.toLowerCase().includes("file")) return Icon.Document;
    return Icon.Text;
  };

  const getTitle = (entry: (typeof data.entries)[0]) => {
    if (entry.type.toLowerCase().includes("image")) {
      const bytes = Buffer.from(entry.content, "base64").length;
      return `<${entry.type} data: ${formatBytes(bytes)}>`;
    }
    return entry.content;
  };

  const getDetailContent = (entry: (typeof data.entries)[0]) => {
    if (entry.type.toLowerCase().includes("image")) {
      const bytes = Buffer.from(entry.content, "base64").length;
      return `<div align="center">

![${entry.type}](data:${entry.type};base64,${entry.content})

Size: ${formatBytes(bytes)}
</div>`;
    }
    return entry.isTextual ? entry.content : `Type: ${entry.type}`;
  };

  if (error) {
    return (
      <List>
        <List.EmptyView
          icon={Icon.ExclamationMark}
          title="Failed to connect to API"
          description={`Could not connect to ${preferences.apiUrl}. Check the API URL in preferences.`}
          actions={
            <ActionPanel>
              <Action
                title="Open Preferences"
                icon={Icon.Gear}
                onAction={openExtensionPreferences}
              />
            </ActionPanel>
          }
        />
      </List>
    );
  }

  return (
    <List
      isLoading={isLoading}
      onSearchTextChange={setSearchText}
      searchBarPlaceholder="Type to filter entries..."
      navigationTitle="Clipboard History"
      isShowingDetail
      searchBarAccessory={
        <List.Dropdown
          tooltip="Select Type"
          value={selectedType}
          onChange={(newValue) => setSelectedType(newValue as ClipboardType)}
        >
          {TYPES.map((type) => (
            <List.Dropdown.Item key={type} title={type} value={type} />
          ))}
        </List.Dropdown>
      }
    >
      {Object.entries(groupedEntries).map(([date, entries]) => (
        <List.Section key={date} title={date}>
          {entries.map((entry) => (
            <List.Item
              key={entry.id}
              icon={getIcon(entry.type)}
              title={getTitle(entry)}
              detail={
                <List.Item.Detail
                  markdown={getDetailContent(entry)}
                  metadata={
                    <List.Item.Detail.Metadata>
                      <List.Item.Detail.Metadata.Label title="Content type" text={entry.type} />
                      <List.Item.Detail.Metadata.Separator />
                      <List.Item.Detail.Metadata.Label
                        title="Time"
                        text={new Date(entry.timestamp).toLocaleString()}
                      />
                    </List.Item.Detail.Metadata>
                  }
                />
              }
              actions={
                <ActionPanel>
                  <Action.CopyToClipboard
                    content={entry.content}
                    title={entry.type.toLowerCase().includes("image") ? "Copy Image" : "Copy to Clipboard"}
                  />
                  {entry.type.toLowerCase().includes("image") && (
                    <Action.Push
                      title="Preview Image"
                      target={<ImagePreview content={entry.content} type={entry.type} />}
                      icon={Icon.Eye}
                    />
                  )}
                </ActionPanel>
              }
            />
          ))}
        </List.Section>
      ))}
    </List>
  );
}
