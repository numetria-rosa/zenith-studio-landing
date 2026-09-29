import { redirect } from "next/navigation";
import { LEARN_BASE } from "@/components/learn/nav";

export default function FinalModuleHome() {
  redirect(`${LEARN_BASE}/final/agents`);
}
