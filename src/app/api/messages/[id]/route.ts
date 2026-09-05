import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { success, error, forbidden, notFound } from "@/lib/api";
import { createNotification } from "@/lib/notifications";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return error("Unauthorized", 401);

  const conversation = await db.conversation.findUnique({
    where: { id },
    include: {
      members: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!conversation) return notFound("Conversation not found");
  if (!conversation.members.some((m) => m.userId === user.id))
    return forbidden("Not a participant");

  return success({ conversation });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return error("Unauthorized", 401);

  const conversation = await db.conversation.findUnique({
    where: { id },
    include: { members: true },
  });
  if (!conversation) return notFound("Conversation not found");
  if (!conversation.members.some((m) => m.userId === user.id))
    return forbidden("Not a participant");

  const body = await request.json();
  const { text } = body;
  if (!text) return error("Message required", 422);

  const message = await db.message.create({
    data: { conversationId: id, senderId: user.id, content: text },
  });

  await db.conversation.update({
    where: { id },
    data: { updatedAt: new Date(), lastMessageAt: new Date() },
  });

  const recipient = conversation.members.find((m) => m.userId !== user.id);
  if (recipient) {
    await createNotification({
      userId: recipient.userId,
      type: "MESSAGE",
      title: "New message",
      message: `${user.name}: ${text}`,
      link: "/dashboard/messages",
    });
  }

  return success({ message }, 201);
}
