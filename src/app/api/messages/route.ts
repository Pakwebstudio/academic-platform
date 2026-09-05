import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api";
import { createNotification } from "@/lib/notifications";

// List conversations for current user
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return error("Unauthorized", 401);

  const conversations = await db.conversation.findMany({
    where: { members: { some: { userId: user.id } } },
    include: {
      members: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
  });

  return success({
    conversations: conversations.map((c) => {
      const other = c.members.find((m) => m.userId !== user.id)?.user;
      const last = c.messages[0];
      return {
        id: c.id,
        otherUser: other || null,
        lastMessage: last ? { content: last.content, createdAt: last.createdAt } : null,
      };
    }),
  });
}

// Start a conversation or send first message
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return error("Unauthorized", 401);

  const body = await request.json();
  const { recipientId, text } = body;
  if (!recipientId || !text) return error("Recipient and message required", 422);

  if (recipientId === user.id) return error("Cannot message yourself", 400);

  // Find existing direct conversation
  const existing = await db.conversation.findFirst({
    where: {
      members: { some: { userId: user.id } },
      AND: { members: { some: { userId: recipientId } } },
    },
    include: { members: true },
  });

  let conversation = existing;
  if (!conversation) {
    conversation = await db.conversation.create({
      data: {
        members: { create: [{ userId: user.id }, { userId: recipientId }] },
      },
      include: { members: true },
    });
  }

  const message = await db.message.create({
    data: {
      conversationId: conversation.id,
      senderId: user.id,
      content: text,
    },
  });

  await db.conversation.update({
    where: { id: conversation.id },
    data: { updatedAt: new Date(), lastMessageAt: new Date() },
  });

  await createNotification({
    userId: recipientId,
    type: "MESSAGE",
    title: "New message",
    message: `${user.name} sent you a message`,
    link: "/dashboard/messages",
  });

  return success({ conversationId: conversation.id, message }, 201);
}
