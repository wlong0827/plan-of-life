import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Loader2 } from "lucide-react";
import { format, subDays } from "date-fns";

const SPIRITUAL_NORMS = [
  "Morning Offering",
  "Morning Prayer",
  "Holy Mass",
  "Angelus",
  "Visit to the Blessed Sacrament",
  "Holy Rosary",
  "Spiritual Reading",
  "Examination of Conscience",
  "Three Purity Hail Maries",
];

interface DailySuggestionProps {
  selectedDate: Date;
}

const DailySuggestion = ({ selectedDate }: DailySuggestionProps) => {
  const [suggestion, setSuggestion] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSuggestion();
  }, [selectedDate]);

  const fetchSuggestion = async () => {
    try {
      setLoading(true);
      
      // Fetch last 7 days of completion data
      const endDate = format(selectedDate, "yyyy-MM-dd");
      const startDate = format(subDays(selectedDate, 6), "yyyy-MM-dd");

      const { data: completions, error } = await supabase
        .from("daily_completions")
        .select("completed_date, norm_name")
        .gte("completed_date", startDate)
        .lte("completed_date", endDate);

      if (error) throw error;

      // Organize data by date
      const completionData = [];
      for (let i = 6; i >= 0; i--) {
        const date = format(subDays(selectedDate, i), "yyyy-MM-dd");
        const dayCompletions = completions?.filter(c => c.completed_date === date) || [];
        const completedNorms = new Set(dayCompletions.map(c => c.norm_name));
        
        completionData.push({
          date,
          norms: SPIRITUAL_NORMS.map(norm => ({
            name: norm,
            completed: completedNorms.has(norm)
          }))
        });
      }

      // Call edge function for AI suggestion
      const { data: suggestionData, error: functionError } = await supabase.functions.invoke(
        "daily-suggestion",
        {
          body: { completionData }
        }
      );

      if (functionError) {
        if (functionError.message?.includes("429")) {
          toast({
            variant: "destructive",
            title: "Rate limit exceeded",
            description: "Please try again in a moment.",
          });
          return;
        }
        if (functionError.message?.includes("402")) {
          toast({
            variant: "destructive",
            title: "AI credits exhausted",
            description: "Please add credits in Settings.",
          });
          return;
        }
        throw functionError;
      }

      setSuggestion(suggestionData.suggestion);
    } catch (error: any) {
      console.error("Error fetching suggestion:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load daily suggestion",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 rounded-lg bg-accent/20 border border-accent/30">
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-accent-foreground" />
          <p className="text-sm text-accent-foreground">Generating personalized suggestion...</p>
        </div>
      </div>
    );
  }

  if (!suggestion) return null;

  return (
    <div className="p-4 rounded-lg bg-accent/20 border border-accent/30 space-y-2">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-accent-foreground">Today's Insight</h3>
      </div>
      <p className="text-sm text-accent-foreground leading-relaxed">{suggestion}</p>
    </div>
  );
};

export default DailySuggestion;
