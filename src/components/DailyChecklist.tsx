import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { format, startOfWeek, addDays } from "date-fns";

const SPIRITUAL_NORMS = [
  "Morning offering",
  "Morning prayer",
  "Holy mass",
  "Angelus",
  "Visit to the blessed sacrament",
  "Holy rosary",
  "Spiritual reading",
  "Examination of conscience",
  "Three purity hail maries",
];

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

interface DailyChecklistProps {
  selectedDate: Date;
}

const DailyChecklist = ({ selectedDate }: DailyChecklistProps) => {
  const [completions, setCompletions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const dateKey = format(selectedDate, "yyyy-MM-dd");

  useEffect(() => {
    fetchCompletions();
  }, [selectedDate]);

  const fetchCompletions = async () => {
    try {
      const { data, error } = await supabase
        .from("daily_completions")
        .select("norm_name")
        .eq("completed_date", dateKey);

      if (error) throw error;

      setCompletions(new Set(data?.map((d) => d.norm_name) || []));
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load completions",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleNorm = async (normName: string) => {
    const isCompleted = completions.has(normName);

    try {
      if (isCompleted) {
        const { error } = await supabase
          .from("daily_completions")
          .delete()
          .eq("norm_name", normName)
          .eq("completed_date", dateKey);

        if (error) throw error;

        setCompletions((prev) => {
          const next = new Set(prev);
          next.delete(normName);
          return next;
        });
      } else {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const { error } = await supabase.from("daily_completions").insert({
          user_id: user.id,
          norm_name: normName,
          completed_date: dateKey,
        });

        if (error) throw error;

        setCompletions((prev) => new Set(prev).add(normName));
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      {SPIRITUAL_NORMS.map((norm) => (
        <div
          key={norm}
          className="flex items-center space-x-3 p-4 rounded-lg border border-border bg-card hover:bg-accent/5 transition-colors"
        >
          <Checkbox
            id={norm}
            checked={completions.has(norm)}
            onCheckedChange={() => toggleNorm(norm)}
          />
          <label
            htmlFor={norm}
            className="flex-1 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
          >
            {norm}
          </label>
        </div>
      ))}
    </div>
  );
};

export default DailyChecklist;
