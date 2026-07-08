import { PhysioloApp } from "@/components/PhysioloApp";

export default function WidgetPage() {
  const nowIso = new Date().toISOString();

  return <PhysioloApp mode="widget" nowIso={nowIso} />;
}