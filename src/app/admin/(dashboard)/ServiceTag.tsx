import { SERVICE_COLOR, SERVICE_SHORT, type ServiceKey } from "@/lib/hq";

export function ServiceTag({ service }: { service: ServiceKey }) {
  return (
    <span className="svc">
      <i style={{ background: SERVICE_COLOR[service] }} />
      {SERVICE_SHORT[service]}
    </span>
  );
}
