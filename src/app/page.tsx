import { PhysioloApp } from "@/components/PhysioloApp";

export default function Home() {
  const nowIso = new Date().toISOString();

  return <PhysioloApp mode="full" nowIso={nowIso} />;
}