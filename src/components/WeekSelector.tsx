import { format, addDays, isSameDay } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

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
  const [completionCounts, setCompletionCounts] = useState<Record<string, number>>({});
  const [totalActiveNorms, setTotalActiveNorms] = useState<number>(9);

  useEffect(() => {
    fetchActiveNormsCount();
    fetchWeekCompletions();
  }, [currentWeekStart]);

  const fetchActiveNormsCount = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { count, error } = await supabase
        .from("user_norms")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_active", true);

      if (error) throw error;

      setTotalActiveNorms(count || 1); // Prevent division by zero
    } catch (error) {
      console.error("Error fetching active norms count:", error);
      setTotalActiveNorms(9); // Fallback to default
    }
  };

  const fetchWeekCompletions = async () => {
    try {
      const startDate = format(currentWeekStart, "yyyy-MM-dd");
      const endDate = format(addDays(currentWeekStart, 6), "yyyy-MM-dd");

      const { data, error } = await supabase
        .from("daily_completions")
        .select("completed_date, norm_name")
        .gte("completed_date", startDate)
        .lte("completed_date", endDate);

      if (error) throw error;

      const counts: Record<string, number> = {};
      data?.forEach((completion) => {
        const date = completion.completed_date;
        counts[date] = (counts[date] || 0) + 1;
      });

      setCompletionCounts(counts);
    } catch (error) {
      console.error("Error fetching week completions:", error);
    }
  };

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
          const dateKey = format(date, "yyyy-MM-dd");
          const completedCount = completionCounts[dateKey] || 0;
          const progressPercentage = totalActiveNorms > 0 
            ? (completedCount / totalActiveNorms) * 100 
            : 0;

          return (
            <button
              key={index}
              onClick={() => onDateSelect(date)}
              className={`
                relative flex flex-col items-center justify-center p-3 rounded-lg transition-all overflow-hidden bg-secondary
                ${
                  isSelected
                    ? "ring-2 ring-primary font-semibold"
                    : "hover:ring-2 hover:ring-accent"
                }
                ${isToday && !isSelected ? "ring-2 ring-accent" : ""}
              `}
            >
              <div 
                className="absolute bottom-0 left-0 right-0 bg-primary/30 transition-all duration-300"
                style={{ height: `${progressPercentage}%` }}
              />
              <span className="text-xs mb-1 relative z-10">{DAYS[index]}</span>
              <span className="text-lg relative z-10">{format(date, "d")}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default WeekSelector;
