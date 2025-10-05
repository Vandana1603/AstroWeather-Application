import { groq } from "@ai-sdk/groq"
import { streamText } from "ai"

export async function POST(req: Request) {
  try {
    const { messages, location } = await req.json()

    console.log("[v0] Chat API received request with", messages?.length, "messages")

    const systemPrompt = `You are a helpful NASA Weather Assistant specializing in Earth observation data and weather predictions. 
You help users understand weather patterns, climate data, and predictions based on NASA's Earth observation systems.

${location ? `The user is currently viewing data for: ${location.name} (${location.lat.toFixed(4)}°, ${location.lng.toFixed(4)}°)` : "No location is currently selected."}

Provide clear, concise, and scientifically accurate information about:
- Weather predictions and patterns
- NASA Earth observation data sources (GES DISC, Giovanni, Worldview)
- Climate trends and historical data
- How to interpret weather parameters (temperature, precipitation, wind speed, humidity, air quality, cloud cover, solar radiation)
- Probability distributions and bell curves
- Severe weather alerts and safety

Keep responses friendly, informative, and under 150 words unless more detail is specifically requested.`

    const result = streamText({
      model: groq("llama-3.3-70b-versatile"),
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      temperature: 0.7,
      maxTokens: 500,
    })

    console.log("[v0] Chat API streaming response")
    return result.toTextStreamResponse()
  } catch (error) {
    console.error("[v0] Chat API error:", error)
    return Response.json(
      {
        error: "Failed to process chat request",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

