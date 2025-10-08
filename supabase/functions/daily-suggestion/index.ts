import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Token cache to avoid unnecessary token requests
let tokenCache: { access_token: string; expires_at: number } | null = null;

async function getGlooAccessToken(): Promise<string> {
  const CLIENT_ID = Deno.env.get("GLOO_CLIENT_ID");
  const CLIENT_SECRET = Deno.env.get("GLOO_CLIENT_SECRET");
  
  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error("GLOO_CLIENT_ID and GLOO_CLIENT_SECRET must be configured");
  }

  // Check if we have a valid cached token
  if (tokenCache && tokenCache.expires_at > Date.now() / 1000 + 60) {
    return tokenCache.access_token;
  }

  // Get new token
  const TOKEN_URL = "https://platform.ai.gloo.com/oauth2/token";
  const credentials = btoa(`${CLIENT_ID}:${CLIENT_SECRET}`);
  
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": `Basic ${credentials}`,
    },
    body: "grant_type=client_credentials&scope=api/access",
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Gloo token error:", response.status, errorText);
    throw new Error("Failed to get Gloo access token");
  }

  const tokenData = await response.json();
  tokenCache = {
    access_token: tokenData.access_token,
    expires_at: Math.floor(Date.now() / 1000) + tokenData.expires_in,
  };

  return tokenData.access_token;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { completionData } = await req.json();
    
    // Get Gloo access token
    const accessToken = await getGlooAccessToken();

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
Provide ONE specific, actionable suggestion in 1-2 sentences.
Be concrete and practical, not general or vague.`;

    const userPrompt = `Over the past ${totalDays} days, this person has completed ${overallRate}% of their spiritual norms.
Their least consistent practices are: ${weakestNorms}.
Give one specific actionable tip to improve.`;

    const response = await fetch("https://platform.ai.gloo.com/ai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "us.anthropic.claude-sonnet-4-20250514-v1:0",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 80
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gloo API error:", response.status, errorText);
      throw new Error("Gloo API error");
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
