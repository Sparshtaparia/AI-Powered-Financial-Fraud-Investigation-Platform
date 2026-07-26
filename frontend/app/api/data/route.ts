import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { buildAnalytics, buildCongestionInsights } from "@/lib/analytics"

function parseCsv(filePath: string): Record<string, string>[] {
  const csv = fs.readFileSync(filePath, "utf-8")
  const lines = csv.trim().split("\n")
  const headers = lines[0].split(",").map((h) => h.trim())
  return lines.slice(1).map((line) => {
    const vals = line.split(",")
    const obj: Record<string, string> = {}
    headers.forEach((h, i) => (obj[h] = vals[i]?.trim() ?? ""))
    return obj
  })
}

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get("type") || "rre"
  const dataDir = path.join(process.cwd(), "../backend")

  try {
    if (type === "rre") {
      const records = parseCsv(path.join(dataDir, "segment_rre_scores.csv"))
      return NextResponse.json(records.map((r) => ({
        segment_id: r.segment_id,
        total_violations: parseInt(r.total_violations) || 0,
        core_parking_violations: parseInt(r.core_parking_violations) || 0,
        avg_severity: parseFloat(r.avg_severity) || 0,
        active_days: parseInt(r.active_days) || 0,
        road_name: r.road_name || "Unnamed Road",
        highway_class: r.highway_class || "unknown",
        persistence: parseFloat(r.persistence) || 0,
        capacity_loss: parseFloat(r.capacity_loss) || 0,
        rre_score: parseFloat(r.rre_score) || 0,
        picq_score: parseFloat(r.picq_score) || 0,
        quadrant: r.quadrant || "Q4",
      })))
    }

    if (type === "coords") {
      const records = parseCsv(path.join(dataDir, "snapped_parking_data.csv"))
      const segMap = new Map<string, { lat: number; lng: number; road: string; highway: string; violations: number }>()
      records.slice(0, 20000).forEach((r) => {
        if (r.segment_id && r.latitude && r.longitude) {
          const existing = segMap.get(r.segment_id)
          if (existing) {
            existing.violations++
          } else {
            segMap.set(r.segment_id, {
              lat: parseFloat(r.latitude),
              lng: parseFloat(r.longitude),
              road: r.road_name || "Unnamed Road",
              highway: r.highway_class || "unknown",
              violations: 1,
            })
          }
        }
      })
      const coords = Array.from(segMap.entries()).map(([segment_id, pos]) => ({ segment_id, ...pos }))
      return NextResponse.json(coords)
    }

    if (type === "hourly") {
      const records = parseCsv(path.join(dataDir, "snapped_parking_data.csv"))
      const hourly: Record<number, number> = {}
      records.slice(0, 30000).forEach((r) => {
        const h = parseInt(r.hour)
        if (!isNaN(h)) hourly[h] = (hourly[h] || 0) + 1
      })
      return NextResponse.json(
        Object.entries(hourly).map(([hour, count]) => ({ hour: parseInt(hour), count })).sort((a, b) => a.hour - b.hour)
      )
    }

    if (type === "analytics") {
      const rreRaw = parseCsv(path.join(dataDir, "segment_rre_scores.csv"))
      const snappedRaw = parseCsv(path.join(dataDir, "snapped_parking_data.csv"))
      const hourDistRaw = parseCsv(path.join(dataDir, "snapped_parking_data.csv"))

      const rre = rreRaw.map((r) => ({
        total_violations: parseInt(r.total_violations) || 0,
        rre_score: parseFloat(r.rre_score) || 0,
        capacity_loss: parseFloat(r.capacity_loss) || 0,
        road_name: r.road_name || "Unnamed Road",
        active_days: parseInt(r.active_days) || 0,
        highway_class: r.highway_class || "unknown",
        persistence: parseFloat(r.persistence) || 0,
        picq_score: parseFloat(r.picq_score) || 0,
        quadrant: r.quadrant || "Q4",
      }))

      const snapSample = snappedRaw.slice(0, 5000)

      const hourly: Record<number, number> = {}
      hourDistRaw.slice(0, 30000).forEach((r) => {
        const h = parseInt(r.hour)
        if (!isNaN(h)) hourly[h] = (hourly[h] || 0) + 1
      })
      const hourDist = Object.entries(hourly).map(([hour, count]) => ({ hour: parseInt(hour), count })).sort((a, b) => a.hour - b.hour)

      const analytics = buildAnalytics(rre, snapSample, hourDist)
      return NextResponse.json(analytics)
    }

    if (type === "top-roads") {
      const records = parseCsv(path.join(dataDir, "segment_rre_scores.csv"))
      const sorted = records
        .filter((r) => r.road_name && r.road_name !== "Unnamed Road")
        .sort((a, b) => parseFloat(b.rre_score) - parseFloat(a.rre_score))
        .slice(0, 15)
        .map((r) => ({
          segment_id: r.segment_id,
          road_name: r.road_name,
          rre_score: parseFloat(r.rre_score) || 0,
          picq_score: parseFloat(r.picq_score) || 0,
          quadrant: r.quadrant || "Q4",
          total_violations: parseInt(r.total_violations) || 0,
          capacity_loss: parseFloat(r.capacity_loss) || 0,
          active_days: parseInt(r.active_days) || 0,
          highway_class: r.highway_class || "unknown",
        }))
      return NextResponse.json(sorted)
    }

    if (type === "vehicle-types") {
      const records = parseCsv(path.join(dataDir, "snapped_parking_data.csv"))
      const counts: Record<string, number> = {}
      records.slice(0, 5000).forEach((r) => {
        const vt = r.vehicle_type || "UNKNOWN"
        counts[vt] = (counts[vt] || 0) + 1
      })
      return NextResponse.json(
        Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([type, count]) => ({ type, count }))
      )
    }

    if (type === "police-stations") {
      const records = parseCsv(path.join(dataDir, "snapped_parking_data.csv"))
      const counts: Record<string, number> = {}
      records.slice(0, 5000).forEach((r) => {
        const ps = r.police_station || "UNKNOWN"
        counts[ps] = (counts[ps] || 0) + 1
      })
      return NextResponse.json(
        Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 20).map(([station, count]) => ({ station, count }))
      )
    }

    if (type === "day-of-week") {
      const records = parseCsv(path.join(dataDir, "snapped_parking_data.csv"))
      const counts: Record<string, number> = {}
      records.slice(0, 5000).forEach((r) => {
        const d = r.day_of_week || "UNKNOWN"
        counts[d] = (counts[d] || 0) + 1
      })
      const order = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
      return NextResponse.json(
        order.filter((d) => counts[d]).map((day) => ({ day, count: counts[day] || 0 }))
      )
    }

    if (type === "enforcement-plan") {
      const records = parseCsv(path.join(dataDir, "enforcement_plan.csv"))
      return NextResponse.json(records.map((r) => ({
        ...r,
        "Expected Recovery": parseFloat(r["Expected Recovery"]) || 0,
      })))
    }

    if (type === "dq") {
      const dqPath = path.join(dataDir, "src", "dq_report.json")
      if (!fs.existsSync(dqPath)) return NextResponse.json(null)
      return NextResponse.json(JSON.parse(fs.readFileSync(dqPath, "utf-8")))
    }

    if (type === "congestion") {
      const rreRaw = parseCsv(path.join(dataDir, "segment_rre_scores.csv"))
      const snappedRaw = parseCsv(path.join(dataDir, "snapped_parking_data.csv"))
      const hourDistRaw = parseCsv(path.join(dataDir, "snapped_parking_data.csv"))

      const rre = rreRaw.map((r) => ({
        total_violations: parseInt(r.total_violations) || 0,
        rre_score: parseFloat(r.rre_score) || 0,
        capacity_loss: parseFloat(r.capacity_loss) || 0,
        road_name: r.road_name || "Unnamed Road",
        active_days: parseInt(r.active_days) || 0,
        highway_class: r.highway_class || "unknown",
        persistence: parseFloat(r.persistence) || 0,
        picq_score: parseFloat(r.picq_score) || 0,
        quadrant: r.quadrant || "Q4",
      }))

      const hourly: Record<number, number> = {}
      hourDistRaw.slice(0, 30000).forEach((r) => {
        const h = parseInt(r.hour)
        if (!isNaN(h)) hourly[h] = (hourly[h] || 0) + 1
      })
      const hourDist = Object.entries(hourly).map(([hour, count]) => ({ hour: parseInt(hour), count })).sort((a, b) => a.hour - b.hour)

      const snapSample = snappedRaw.slice(0, 5000)
      const insights = buildCongestionInsights(rre, snapSample, hourDist)
      return NextResponse.json(insights)
    }

    return NextResponse.json({ error: "Unknown type" }, { status: 400 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
