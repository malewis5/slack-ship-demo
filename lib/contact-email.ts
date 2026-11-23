import { setTimeout as delay } from 'node:timers/promises';
import type { ContactSubmission } from './contact';

// Transactional receipt only: never include research, scores, or project details.
export async function sendContactAcknowledgment(
  leadId: string,
  submission: Pick<ContactSubmission, 'email'>,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_EMAIL_FROM;
  if (!apiKey || !from) throw new Error('Contact email is not configured.');

  const body = JSON.stringify({
    from,
    to: [submission.email],
    subject: 'Thank you for reaching out to NYC Framing',
    text: "Thank you for reaching out to NYC Framing!\n\nWe’re reviewing your request and will reach out within the next week.\n\nThe NYC Framing team",
  });
  // Bounded retries fit within the route's duration, independently of research.
  // Reuse the exact key and payload so ambiguous timeouts cannot duplicate mail.
  for (let attempt = 0; attempt < 3; attempt++) {
    let response: Response | undefined;
    try {
      response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': `contact-ack/${leadId}`,
        },
        body,
        signal: AbortSignal.timeout(5_000),
        redirect: 'error',
      });
    } catch {
      // Network failures can occur after acceptance; the same key makes retry safe.
    }
    if (response?.ok) return;
    if (response && response.status !== 429 && response.status < 500) break;
    if (attempt < 2) await delay(1_000 * (attempt + 1));
  }
  throw new Error('Contact acknowledgment could not be sent.');
}
