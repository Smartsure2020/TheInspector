import "server-only";

export async function sendOtp(phone: string, code: string): Promise<void> {
  if (process.env.SMS_PROVIDER === "twilio") {
    const accountSid = process.env.TWILIO_ACCOUNT_SID!;
    const authToken = process.env.TWILIO_AUTH_TOKEN!;
    const from = process.env.TWILIO_FROM_NUMBER!;
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const body = new URLSearchParams({
      To: phone,
      From: from,
      Body: `Your Inspector verification code is: ${code}. Valid for 10 minutes.`,
    });
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });
    if (!res.ok) throw new Error(`SMS send failed: ${res.status}`);
    return;
  }

  // Dev mode: log to console
  console.log(`\n========================================`);
  console.log(`  OTP for ${phone}: ${code}`);
  console.log(`========================================\n`);
}
