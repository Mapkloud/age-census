"use client";

import { useState, useSyncExternalStore } from "react";
import { Select } from "@/components/ui/Field";

type TimezoneSelectProps = {
  id: string;
  name: string;
  timeZones: string[];
  defaultValue?: string;
  detect?: boolean;
  required?: boolean;
  "aria-describedby"?: string;
};

const subscribeNoop = () => () => {};

function readBrowserZone(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return undefined;
  }
}

/**
 * Plain <select> of IANA zones. With `detect`, the browser's zone is
 * pre-selected on the client when no default was given.
 */
export function TimezoneSelect({
  timeZones,
  defaultValue,
  detect = false,
  ...rest
}: TimezoneSelectProps) {
  const browserZone = useSyncExternalStore(subscribeNoop, readBrowserZone, () => undefined);
  const [chosen, setChosen] = useState<string | null>(null);

  const detected =
    detect && !defaultValue && browserZone && timeZones.includes(browserZone)
      ? browserZone
      : undefined;
  const value = chosen ?? defaultValue ?? detected ?? "UTC";

  return (
    <>
      <Select value={value} onChange={(event) => setChosen(event.target.value)} {...rest}>
        {timeZones.map((zone) => (
          <option key={zone} value={zone}>
            {zone.replaceAll("_", " ")}
          </option>
        ))}
      </Select>
      {detected && chosen === null ? (
        <p className="text-xs text-muted" aria-live="polite">
          Detected from your device. Change it if you live somewhere else.
        </p>
      ) : null}
    </>
  );
}
