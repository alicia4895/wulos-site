// This runs on Vercel's server, not in the browser — so your BulkSMS
// username/password stay hidden and safe, unlike anything in App.jsx.
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { to, message } = req.body || {};
  if (!to || !message) {
    return res.status(400).json({ error: "Missing 'to' or 'message'" });
  }

  // Normalize South African numbers to international format (+27...)
  let phone = to.trim().replace(/\s+/g, "");
  if (phone.startsWith("0")) {
    phone = "+27" + phone.slice(1);
  }

  const username = process.env.BULKSMS_USERNAME;
  const password = process.env.BULKSMS_PASSWORD;

  if (!username || !password) {
    return res.status(500).json({ error: "SMS credentials not configured" });
  }

  try {
    const auth = Buffer.from(`${username}:${password}`).toString("base64");
    const response = await fetch("https://api.bulksms.com/v1/messages", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: phone,
        body: message,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(502).json({ error: "SMS provider error", details: errText });
    }

    return res.status(200).json({ sent: true });
  } catch (err) {
    return res.status(500).json({ error: "Failed to send SMS", details: String(err) });
  }
}
