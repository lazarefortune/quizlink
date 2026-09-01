"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type TimeZoneContextValue = {
  timeZone: string;
  setTimeZone: (timeZone: string) => void;
};

const TimeZoneContext = createContext<TimeZoneContextValue | undefined>(
  undefined,
);

type TimeZoneProviderProps = {
  initialTimeZone: string;
  children: ReactNode;
};

export function TimeZoneProvider({
  initialTimeZone,
  children,
}: TimeZoneProviderProps): React.ReactElement {
  const [timeZone, setTimeZone] = useState(initialTimeZone);

  const value = useMemo(
    () => ({ timeZone, setTimeZone }),
    [timeZone],
  );

  return (
    <TimeZoneContext.Provider value={value}>{children}</TimeZoneContext.Provider>
  );
}

export function useTimeZone(): TimeZoneContextValue {
  const context = useContext(TimeZoneContext);
  if (context === undefined) {
    throw new Error("useTimeZone must be used within a TimeZoneProvider");
  }
  return context;
}
