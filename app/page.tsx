import TechRadar from "@/components/tech-radar"
import radarConfig from "@/lib/radar-config.json"

export default function Home() {
  return <TechRadar config={radarConfig} />
}
