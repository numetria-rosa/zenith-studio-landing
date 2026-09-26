"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function saveOnboarding(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const projectId = String(formData.get("projectId") || "");
  const businessName = String(formData.get("businessName") || "").trim().slice(0, 120);
  const yourName = String(formData.get("yourName") || "").trim().slice(0, 120);

  const project = await db.serviceProject.findFirst({
    where: { id: projectId, userId: session.user.id },
    select: { id: true },
  });
  if (!project || !businessName) redirect(`/services/dashboard/${projectId}`);

  await db.serviceProject.update({ where: { id: project.id }, data: { title: businessName } });
  if (yourName) await db.user.update({ where: { id: session.user.id }, data: { name: yourName } });

  revalidatePath(`/services/dashboard/${project.id}`, "layout");
  redirect(`/services/dashboard/${project.id}`);
}
