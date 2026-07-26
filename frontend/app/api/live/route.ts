import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function GET() {
  try {
    const dataDir = process.cwd()
    const statePath = path.join(dataDir, "live_state.json")
    const eventsPath = path.join(dataDir, "src", "live_events.jsonl")

    let state = { cursor: 0, events_processed: 0, alerts_generated: 0, segment_counts: {} as Record<string, number>, alerts: [], last_event_time: "N/A" }
    if (fs.existsSync(statePath)) {
      state = JSON.parse(fs.readFileSync(statePath, "utf-8"))
    }

    const events: Record<string, unknown>[] = []
    if (fs.existsSync(eventsPath)) {
      const lines = fs.readFileSync(eventsPath, "utf-8").trim().split("\n")
      const cursor = state.cursor || 0
      const batch = cursor > 0 ? lines.slice(cursor, cursor + 20) : lines.slice(-20)
      batch.forEach((line) => {
        try { events.push(JSON.parse(line)) } catch { /* skip */ }
      })
    }

    return NextResponse.json({ events, state })
  } catch {
    return NextResponse.json({ events: [], state: null })
  }
}
