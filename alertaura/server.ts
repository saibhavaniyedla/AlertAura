import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import { createServer as createViteServer } from "vite";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API routes FIRST
  app.post("/api/send-sos-email", async (req, res) => {
    const { to, subject, body } = req.body;
    console.log(`[Email Service] Received request to send email to: ${to}`);

    if (!to || !subject || !body) {
      console.warn("[Email Service] Missing required fields in request body");
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      const smtpHost = process.env.SMTP_HOST || "smtp.ethereal.email";
      const smtpUser = process.env.SMTP_USER || "test@ethereal.email";
      
      console.log(`[Email Service] Using SMTP Host: ${smtpHost}, User: ${smtpUser}`);

      // Use SMTP settings from environment variables
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: {
          user: smtpUser,
          pass: process.env.SMTP_PASS || "testpass",
        },
      });

      const info = await transporter.sendMail({
        from: process.env.SMTP_FROM || '"AlertAura SOS" <sos@alertaura.com>',
        to,
        subject,
        text: body,
        html: `<div style="font-family: sans-serif; padding: 20px; border: 2px solid #ef4444; border-radius: 10px;">
                <h1 style="color: #ef4444;">EMERGENCY SOS ALERT</h1>
                <p style="font-size: 16px; color: #334155;">${body.replace(/\n/g, '<br>')}</p>
                <hr style="border: 1px solid #e2e8f0; margin: 20px 0;">
                <p style="font-size: 12px; color: #94a3b8;">This is an automated emergency message from AlertAura.</p>
              </div>`,
      });

      console.log(`[Email Service] Message sent successfully: ${info.messageId}`);
      res.json({ success: true, messageId: info.messageId });
    } catch (error) {
      console.error("[Email Service] Error sending email:", error);
      res.status(500).json({ error: "Failed to send email", details: error instanceof Error ? error.message : String(error) });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
