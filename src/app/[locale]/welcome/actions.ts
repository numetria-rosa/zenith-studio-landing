"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function saveBusinessName(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const projectId = String(formData.get("projectId") || "");
  const name = String(formData.get("businessName") || "").trim().slice(0, 120);

  const project = await db.serviceProject.findFirst({
    where: { id: projectId, userId: session.user.id },
    select: { id: true },
  });
  if (!project) redirect("/sign-in");

  if (name) await db.serviceProject.update({ where: { id: project.id }, data: { title: name } });
  redirect(`/services/dashboard/${project.id}`);
}
