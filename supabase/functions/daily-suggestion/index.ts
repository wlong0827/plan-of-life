import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { completionData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Analyze the completion data to generate insights
    const totalDays = completionData.length;
    const completionStats = completionData.reduce((acc: any, day: any) => {
      const total = day.norms.length;
      const completed = day.norms.filter((n: any) => n.completed).length;
      acc.totalPossible += total;
      acc.totalCompleted += completed;
      
      day.norms.forEach((norm: any) => {
        if (!acc.normStats[norm.name]) {
          acc.normStats[norm.name] = { completed: 0, total: 0 };
        }
        acc.normStats[norm.name].total++;
        if (norm.completed) {
          acc.normStats[norm.name].completed++;
        }
      });
      
      return acc;
    }, { totalCompleted: 0, totalPossible: 0, normStats: {} });

    const overallRate = (completionStats.totalCompleted / completionStats.totalPossible * 100).toFixed(1);
    
    // Find least completed norms
    const normRates = Object.entries(completionStats.normStats).map(([name, stats]: [string, any]) => ({
      name,
      rate: (stats.completed / stats.total * 100).toFixed(1),
      completed: stats.completed,
      total: stats.total
    })).sort((a, b) => parseFloat(a.rate) - parseFloat(b.rate));

    const weakestNorms = normRates.slice(0, 3).map(n => `${n.name} (${n.rate}%)`).join(", ");

    const systemPrompt = `You are a compassionate spiritual advisor helping someone maintain their daily spiritual practices. 
Based on their completion history, provide ONE practical, encouraging suggestion to help them improve.
Keep it brief (2-3 sentences), actionable, and focused on building sustainable habits.
Be warm and understanding, not judgmental.`;

    const userPrompt = `Over the past ${totalDays} days, this person has completed ${overallRate}% of their spiritual norms.
Their least consistent practices are: ${weakestNorms}.
Provide a practical, encouraging suggestion to help them improve.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 150
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), 
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits in Settings." }), 
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const suggestion = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ suggestion, stats: { overallRate, weakestNorms } }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in daily-suggestion function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
