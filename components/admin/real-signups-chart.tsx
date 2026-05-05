"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type RealSignupsChartProps = {
  data: Array<{
    dateKey: string;
    label: string;
    signups: number;
  }>;
};

type PeriodPreset =
  | "today"
  | "yesterday"
  | "dayBeforeYesterday"
  | "lastWeek"
  | "lastMonth"
  | "7d"
  | "30d"
  | "3m"
  | "6m"
  | "12m";

function toDateFromKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

function getRangeStart(today: Date, preset: PeriodPreset): Date {
  const start = new Date(today);
  start.setHours(0, 0, 0, 0);
  switch (preset) {
    case "today":
      return start;
    case "yesterday":
      start.setDate(start.getDate() - 1);
      return start;
    case "dayBeforeYesterday":
      start.setDate(start.getDate() - 2);
      return start;
    case "lastWeek":
      start.setDate(start.getDate() - 7);
      return start;
    case "lastMonth":
      start.setMonth(start.getMonth() - 1);
      return start;
    case "7d":
      start.setDate(start.getDate() - 6);
      return start;
    case "30d":
      start.setDate(start.getDate() - 29);
      return start;
    case "3m":
      start.setMonth(start.getMonth() - 3);
      return start;
    case "6m":
      start.setMonth(start.getMonth() - 6);
      return start;
    case "12m":
      start.setMonth(start.getMonth() - 12);
      return start;
    default:
      return start;
  }
}

export function RealSignupsChart({ data }: RealSignupsChartProps) {
  const { locale } = useLocale();
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodPreset>("30d");
  const periodOptions: Array<{ id: PeriodPreset; label: string }> =
    locale === "fr"
      ? [
          { id: "today", label: "Aujourd'hui" },
          { id: "yesterday", label: "Hier" },
          { id: "dayBeforeYesterday", label: "Avant-hier" },
          { id: "lastWeek", label: "Semaine dernière" },
          { id: "lastMonth", label: "Mois dernier" },
          { id: "7d", label: "7J" },
          { id: "30d", label: "30J" },
          { id: "3m", label: "3M" },
          { id: "6m", label: "6M" },
          { id: "12m", label: "12M" },
        ]
      : [
          { id: "today", label: "Today" },
          { id: "yesterday", label: "Yesterday" },
          { id: "dayBeforeYesterday", label: "Day before yesterday" },
          { id: "lastWeek", label: "Last week" },
          { id: "lastMonth", label: "Last month" },
          { id: "7d", label: "7D" },
          { id: "30d", label: "30D" },
          { id: "3m", label: "3M" },
          { id: "6m", label: "6M" },
          { id: "12m", label: "12M" },
        ];

  const filteredData = (() => {
    if (data.length === 0) {
      return data;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = getRangeStart(today, selectedPeriod);

    return data.filter((point) => {
      const pointDate = toDateFromKey(point.dateKey);
      if (selectedPeriod === "yesterday") {
        return pointDate.getTime() === start.getTime();
      }
      if (selectedPeriod === "dayBeforeYesterday") {
        return pointDate.getTime() === start.getTime();
      }
      return pointDate >= start && pointDate <= today;
    });
  })();

  const totalInRange = filteredData.reduce((sum, point) => sum + point.signups, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <Card className="border-border/70">
      <CardHeader>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle className="text-xl">{t(locale, "admin.dashboard.realSignupChartTitle")}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {totalInRange} {t(locale, "admin.dashboard.signupsEver")}
            </p>
          </div>
          <div className="w-fit max-w-xs">
            <Select
              value={selectedPeriod}
              onValueChange={(value) => setSelectedPeriod(value as PeriodPreset)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {periodOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <motion.div
          key={selectedPeriod}
          initial={{ opacity: 0, scale: 0.985 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="h-[320px] w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={filteredData}>
              <defs>
                <linearGradient id="signupGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.38} />
                  <stop offset="70%" stopColor="hsl(var(--primary))" stopOpacity={0.09} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" tick={{ fontSize: 14 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 14 }} />
              <Tooltip
                formatter={(value) => [Number(value ?? 0), t(locale, "admin.dashboard.signupsEver")]}
                labelFormatter={(label) => String(label)}
              />
              <Area
                type="monotone"
                dataKey="signups"
                stroke="hsl(var(--primary))"
                fill="url(#signupGradient)"
                strokeWidth={3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </CardContent>
      </Card>
    </motion.div>
  );
}
