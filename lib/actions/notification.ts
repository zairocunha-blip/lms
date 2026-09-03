"use server";

import { requireUser } from "@/lib/auth/permissions";
import { markAllAsRead } from "@/lib/services/notification";

export async function markNotificationsReadAction() {
  const user = await requireUser();
  await markAllAsRead(user.id);
}
