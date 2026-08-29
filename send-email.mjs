// This runs on Vercel's server, not in the browser — so your Resend API
// key stays hidden and safe, unlike anything in App.jsx.
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { to, subject, message } = req.body || {};
  if (!to || !subject || !message) {
    return res.status(400).json({ error: "Missing 'to', 'subject', or 'message'" });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Email credentials not configured" });
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Wulo's Ice Cubes <orders@wulosicecubes.co.za>",
        to: [to],
        subject,
        html: `<p>${message.replace(/\n/g, "<br>")}</p>`,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(502).json({ error: "Email provider error", details: errText });
    }

    return res.status(200).json({ sent: true });
  } catch (err) {
    return res.status(500).json({ error: "Failed to send email", details: String(err) });
  }
}
