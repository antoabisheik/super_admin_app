const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

admin.initializeApp();
const db = admin.firestore();

exports.sendEmailNotification = functions.firestore
  .document("notification_history/{docId}")
  .onCreate(async (snap, context) => {
    const data = snap.data();

    if (data.channel !== "email") return;

    try {
      const configSnap = await db.collection("notification_config").doc("email").get();
      const config = configSnap.data();

      if (!config || !config.is_configured) {
        console.log("⚠️ Email config missing or inactive");
        await snap.ref.update({ status: "Failed", error: "Missing SMTP config" });
        return;
      }

      const transporter = nodemailer.createTransport({
        host: config.smtp_host,
        port: parseInt(config.smtp_port || "587"),
        secure: false,
        auth: {
          user: config.smtp_user,
          pass: config.smtp_password,
        },
      });

      const mailOptions = {
        from: `"${config.from_name}" <${config.from_email}>`,
        to: data.recipients?.[0] || config.from_email, // fallback
        subject: data.subject || "Notification",
        text: data.customMessage || "Empty message",
      };

      await transporter.sendMail(mailOptions);

      await snap.ref.update({
        status: "Delivered",
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log("✅ Email sent successfully!");
    } catch (err) {
      console.error("❌ Error sending email:", err);
      await snap.ref.update({ status: "Failed", error: err.message });
    }
  });
