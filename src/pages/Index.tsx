import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { startOfWeek } from "date-fns";
import DailyChecklist from "@/components/DailyChecklist";
import WeekSelector from "@/components/WeekSelector";
import DailySuggestion from "@/components/DailySuggestion";

const Index = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date()));
  const [selectedDate, setSelectedDate] = useState(new Date());
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        navigate("/auth");
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto p-4 pb-20">
        <header className="flex items-center justify-between py-6">
          <div>
            <h1 className="text-3xl font-bold text-primary">Plan of Life</h1>
            <p className="text-sm text-muted-foreground">Track your spiritual practices</p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleSignOut}>
            <LogOut className="h-5 w-5" />
          </Button>
        </header>

        <div className="space-y-6">
          <WeekSelector
            currentWeekStart={currentWeekStart}
            selectedDate={selectedDate}
            onWeekChange={setCurrentWeekStart}
            onDateSelect={setSelectedDate}
          />

          <DailySuggestion selectedDate={selectedDate} />

          <div>
            <h2 className="text-lg font-semibold mb-4">Today's Norms</h2>
            <DailyChecklist selectedDate={selectedDate} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
