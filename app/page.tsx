import TechRadar from "@/components/tech-radar"
import radarConfig from "@/docs/config.json"

export default function Home() {
  return <TechRadar config={radarConfig} />
}
