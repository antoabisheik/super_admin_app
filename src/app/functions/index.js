const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

admin.initializeApp();
const db = admin.firestore();

// Firestore trigger for new email notifications
exports.sendEmailNotification = functions.firestore
  .document("notification_history/{docId}")
  .onCreate(async (snap, context) => {
    const data = snap.data();

    // Only process email channel
    if (data.channel !== "email") return;

    try {
      // Get SMTP configuration from Firestore
      const configSnap = await db.collection("notification_config").doc("email").get();
      const config = configSnap.data();

      if (!config || !config.is_configured) {
        console.log("⚠️ Email config not found or inactive");
        await snap.ref.update({ status: "Failed", error: "Email config not set" });
        return;
      }

      // Setup Gmail transporter
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
        to: "your-email@gmail.com", // <-- Replace with actual recipient
        subject: data.subject || "No subject",
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
