import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

interface WeekSelectorProps {
  currentWeekStart: Date;
  selectedDate: Date;
  onWeekChange: (newWeekStart: Date) => void;
  onDateSelect: (date: Date) => void;
}

const WeekSelector = ({
  currentWeekStart,
  selectedDate,
  onWeekChange,
  onDateSelect,
}: WeekSelectorProps) => {
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  const goToPreviousWeek = () => {
    onWeekChange(addDays(currentWeekStart, -7));
  };

  const goToNextWeek = () => {
    onWeekChange(addDays(currentWeekStart, 7));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={goToPreviousWeek}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="text-center">
          <div className="text-sm font-medium text-muted-foreground">
            Week {format(currentWeekStart, "w")}
          </div>
          <div className="text-lg font-semibold">{format(currentWeekStart, "MMM d, yyyy")}</div>
        </div>
        <Button variant="ghost" size="icon" onClick={goToNextWeek}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {weekDates.map((date, index) => {
          const isSelected = isSameDay(date, selectedDate);
          const isToday = isSameDay(date, new Date());

          return (
            <button
              key={index}
              onClick={() => onDateSelect(date)}
              className={`
                flex flex-col items-center justify-center p-3 rounded-lg transition-all
                ${
                  isSelected
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "bg-secondary hover:bg-accent"
                }
                ${isToday && !isSelected ? "ring-2 ring-accent" : ""}
              `}
            >
              <span className="text-xs mb-1">{DAYS[index]}</span>
              <span className="text-lg">{format(date, "d")}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default WeekSelector;
