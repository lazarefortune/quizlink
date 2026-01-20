"use client";

import * as React from "react";
import { format } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useLocale } from "@/lib/i18n/use-locale";

import "react-day-picker/dist/style.css";

type DateTimePickerProps = {
  value?: string; // ISO datetime string
  onChange: (value: string) => void;
  disabled?: boolean;
  min?: Date;
  placeholder?: string;
};

export function DateTimePicker({
  value,
  onChange,
  disabled,
  min,
  placeholder = "Sélectionner une date et heure",
}: DateTimePickerProps) {
  const { locale } = useLocale();
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(
    value ? new Date(value) : undefined
  );
  const [timeValue, setTimeValue] = React.useState<string>(
    value
      ? format(new Date(value), "HH:mm")
      : format(new Date(), "HH:mm")
  );
  const [isOpen, setIsOpen] = React.useState(false);

  const dateLocale = locale === "fr" ? fr : enUS;

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    const [hours, minutes] = timeValue.split(":").map(Number);
    const newDateTime = new Date(date);
    newDateTime.setHours(hours || 0, minutes || 0, 0, 0);

    setSelectedDate(newDateTime);
    onChange(newDateTime.toISOString());
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    setTimeValue(newTime);

    if (selectedDate) {
      const [hours, minutes] = newTime.split(":").map(Number);
      const newDateTime = new Date(selectedDate);
      newDateTime.setHours(hours || 0, minutes || 0, 0, 0);
      onChange(newDateTime.toISOString());
    }
  };

  const displayValue = selectedDate
    ? `${format(selectedDate, "PPP", { locale: dateLocale })} ${timeValue}`
    : placeholder;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="secondary"
          className={cn(
            "w-full justify-start text-left font-normal",
            !selectedDate && "text-muted-foreground"
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {displayValue}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3 space-y-3">
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            locale={dateLocale}
            disabled={min ? (date) => date < min : undefined}
            initialFocus
          />
          <div className="flex items-center gap-2 border-t pt-3">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <Input
              type="time"
              value={timeValue}
              onChange={handleTimeChange}
              className="flex-1"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedDate(undefined);
                setTimeValue(format(new Date(), "HH:mm"));
                onChange("");
                setIsOpen(false);
              }}
            >
              Effacer
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              Valider
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
