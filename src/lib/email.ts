import nodemailer from "nodemailer";

type EmailOptions = {
  to: string;
  subject: string;
  html: string;
  template?: string;
};

// Abstraction so the email provider can be swapped later (e.g. Postmark, SendGrid).
export class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  private getTransporter() {
    if (this.transporter) return this.transporter;
    const host = process.env.EMAIL_HOST;
    if (!host) {
      // In development without SMTP config, fall back to a logging/skip transport
      return null;
    }
    this.transporter = nodemailer.createTransport({
      host,
      port: Number(process.env.EMAIL_PORT || 587),
      secure: process.env.EMAIL_SECURE === "true",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    return this.transporter;
  }

  async send({ to, subject, html }: EmailOptions): Promise<boolean> {
    const transporter = this.getTransporter();
    if (!transporter) {
      // Development mode: log the email instead of sending
      console.log(`[EMAIL-DEV] To: ${to} | Subject: ${subject}`);
      return true;
    }
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || "Acadexa <no-reply@acadexa.local>",
        to,
        subject,
        html,
      });
      return true;
    } catch (e) {
      console.error("Email send failed:", e);
      return false;
    }
  }

  private wrap(title: string, bodyText: string): string {
    return `
      <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b;">
        <div style="border-bottom: 2px solid #4f46e5; padding-bottom: 16px; margin-bottom: 24px;">
          <span style="font-size: 20px; font-weight: 700; color: #4f46e5;">Acadexa</span>
        </div>
        <h1 style="font-size: 20px; margin: 0 0 16px;">${title}</h1>
        <div style="font-size: 15px; line-height: 1.6;">${bodyText}</div>
        <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #64748b;">
          You are receiving this email because you have an account on Acadexa.
        </div>
      </div>
    `;
  }

  async sendWelcome(email: string, name: string) {
    const body = `<p>Hi ${name},</p><p>Welcome to Acadexa — your academic research platform. We're glad to have you on board.</p>`;
    await this.send({
      to: email,
      subject: "Welcome to Acadexa",
      html: this.wrap("Welcome!", body),
    });
  }

  async sendEmailVerification(email: string, name: string, link: string) {
    const body = `<p>Hi ${name},</p><p>Please verify your email by clicking the button below:</p>
      <p><a href="${link}" style="background:#4f46e5;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">Verify Email</a></p>
      <p style="font-size:13px;color:#64748b;">This link expires in 24 hours.</p>`;
    await this.send({
      to: email,
      subject: "Verify your email",
      html: this.wrap("Verify your email", body),
    });
  }

  async sendPasswordReset(email: string, link: string) {
    const body = `<p>We received a request to reset your password. Click below to continue:</p>
      <p><a href="${link}" style="background:#4f46e5;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">Reset Password</a></p>`;
    await this.send({
      to: email,
      subject: "Reset your password",
      html: this.wrap("Reset your password", body),
    });
  }

  async sendGeneric(to: string, subject: string, title: string, bodyText: string) {
    await this.send({ to, subject, html: this.wrap(title, bodyText) });
  }
}

export const emailService = new EmailService();

export async function sendEmail(to: string, subject: string, html: string) {
  return emailService.send({ to, subject, html });
}
