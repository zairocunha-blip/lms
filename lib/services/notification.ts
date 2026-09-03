import "server-only";
import { prisma } from "@/lib/db/prisma";
import type { NotificationType } from "@prisma/client";

export async function notify(userId: string, type: NotificationType, message: string) {
  await prisma.notification.create({ data: { userId, type, message } });
}

export async function notifyMany(userIds: string[], type: NotificationType, message: string) {
  if (userIds.length === 0) return;
  await prisma.notification.createMany({
    data: userIds.map((userId) => ({ userId, type, message })),
  });
}

export async function getUnreadCount(userId: string) {
  return prisma.notification.count({ where: { userId, isRead: false } });
}

export async function listNotifications(userId: string, take = 20) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take,
  });
}

export async function markAllAsRead(userId: string) {
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
}
