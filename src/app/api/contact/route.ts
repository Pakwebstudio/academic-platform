import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api";
import { emailService } from "@/lib/email";

// Contact form submission. Anonymous users may submit; logged-in sends are attributed.
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();

  const body = await request.json();
  const { name, email, subject, message } = body;
  if (!name || !email || !message || !subject)
    return error("Name, email, subject and message are required", 422);

  const adminEmails = await db.user.findMany({
    where: { role: "ADMIN" },
    select: { email: true },
    take: 5,
  });

  if (adminEmails.length > 0) {
    await emailService.sendGeneric(
      adminEmails[0].email,
      `[Acadexa Contact] ${subject}`,
      "Contact Message",
      `<p><strong>From:</strong> ${name} (${email})</p><p><strong>Subject:</strong> ${subject}</p><p><strong>Message:</strong></p><p>${message.replace(/\n/g, "<br/>")}</p>`
    ).catch(() => {});
  }

  // Notify admins in-app
  const admins = await db.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
  if (admins.length > 0) {
    const senderId = user?.id || admins[0].id;
    await db.adminNotification.create({
      data: {
        senderId,
        audience: "ADMIN",
        title: "New contact message",
        message: `${name} (${email}): ${subject}`,
      },
    });
  }

  return success({ message: "Message sent" });
}