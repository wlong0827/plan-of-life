import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Norm {
  id: string;
  norm_name: string;
  is_active: boolean;
}

interface DailyChecklistProps {
  selectedDate: Date;
  onChecklistChange?: () => void;
}

const DailyChecklist = ({ selectedDate, onChecklistChange }: DailyChecklistProps) => {
  const [norms, setNorms] = useState<Norm[]>([]);
  const [completions, setCompletions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const dateKey = format(selectedDate, "yyyy-MM-dd");

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const fetchData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Fetch user's active norms
      const { data: normsData, error: normsError } = await supabase
        .from("user_norms")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: true });

      if (normsError) throw normsError;

      setNorms(normsData || []);

      // Fetch completions for the selected date
      const { data: completionsData, error: completionsError } = await supabase
        .from("daily_completions")
        .select("norm_name")
        .eq("completed_date", dateKey);

      if (completionsError) throw completionsError;

      setCompletions(new Set(completionsData?.map((d) => d.norm_name) || []));
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load data",
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
        onChecklistChange?.();
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
        onChecklistChange?.();
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
      {norms.map((norm) => (
        <div
          key={norm.id}
          className="flex items-center space-x-3 p-4 rounded-lg border border-border bg-card hover:bg-accent/5 transition-colors"
        >
          <Checkbox
            id={norm.id}
            checked={completions.has(norm.norm_name)}
            onCheckedChange={() => toggleNorm(norm.norm_name)}
          />
          <label
            htmlFor={norm.id}
            className="flex-1 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
          >
            {norm.norm_name}
          </label>
        </div>
      ))}
    </div>
  );
};

export default DailyChecklist;
