import assert from 'node:assert/strict';
import { beforeEach, mock, test } from 'node:test';

const delay = mock.fn(async () => {});
mock.module('node:timers/promises', { namedExports: { setTimeout: delay } });
const { sendContactAcknowledgment } = await import('../lib/contact-email.ts');
const leadId = 'lead-12345678-1234-4234-8234-123456789abc';
const submission = { email: 'customer@example.com', message: 'Private project details' };

beforeEach((t) => {
  const previous = { key: process.env.RESEND_API_KEY, from: process.env.CONTACT_EMAIL_FROM };
  t.after(() => {
    for (const [name, value] of [['RESEND_API_KEY', previous.key], ['CONTACT_EMAIL_FROM', previous.from]]) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  });
  process.env.RESEND_API_KEY = 'test-only-key';
  process.env.CONTACT_EMAIL_FROM = 'NYC Framing <hello@example.com>';
  delay.mock.resetCalls();
  t.mock.method(globalThis, 'fetch', async () => Response.json({ id: 'email-test' }));
});

test('sends a plain text receipt to only the validated submitter', async () => {
  await sendContactAcknowledgment(leadId, submission);
  assert.equal(fetch.mock.callCount(), 1);
  const [url, options] = fetch.mock.calls[0].arguments;
  assert.equal(url, 'https://api.resend.com/emails');
  assert.equal(options.method, 'POST');
  assert.equal(options.redirect, 'error');
  assert.equal(options.headers.Authorization, 'Bearer test-only-key');
  assert.equal(options.headers['Idempotency-Key'], `contact-ack/${leadId}`);
  assert.ok(options.signal instanceof AbortSignal);
  assert.deepEqual(JSON.parse(options.body), {
    from: process.env.CONTACT_EMAIL_FROM,
    to: [submission.email],
    subject: 'Thank you for reaching out to NYC Framing',
    text: 'Thank you for reaching out to NYC Framing!\n\nWe’re reviewing your request and will reach out within the next week.\n\nThe NYC Framing team',
  });
  assert.equal(delay.mock.callCount(), 0);
});

for (const name of ['RESEND_API_KEY', 'CONTACT_EMAIL_FROM']) {
  test(`missing ${name} fails explicitly without a network request`, async () => {
    delete process.env[name];
    await assert.rejects(sendContactAcknowledgment(leadId, submission), /not configured/);
    assert.equal(fetch.mock.callCount(), 0);
  });
}

for (const status of [429, 500, 503, 'network']) {
  test(`retries ${status} with an identical payload and key`, async () => {
    let attempts = 0;
    fetch.mock.mockImplementation(async () => {
      if (++attempts > 1) return Response.json({ id: 'email-test' });
      if (status === 'network') throw new Error('private network details');
      return new Response(null, { status });
    });
    await sendContactAcknowledgment(leadId, submission);
    assert.equal(fetch.mock.callCount(), 2);
    const [first, second] = fetch.mock.calls.map(({ arguments: [, options] }) => options);
    assert.equal(first.body, second.body);
    assert.equal(first.headers['Idempotency-Key'], second.headers['Idempotency-Key']);
    assert.deepEqual(delay.mock.calls.map((c) => c.arguments), [[1000]]);
  });
}

test('stops after three attempts and discards provider error details', async () => {
  fetch.mock.mockImplementation(async () => new Response('private provider details', { status: 500 }));
  await assert.rejects(sendContactAcknowledgment(leadId, submission), { message: 'Contact acknowledgment could not be sent.' });
  assert.equal(fetch.mock.callCount(), 3);
  assert.deepEqual(delay.mock.calls.map((c) => c.arguments), [[1000], [2000]]);
});

for (const status of [400, 401, 403, 409, 422]) {
  test(`does not retry permanent HTTP ${status} failures`, async () => {
    fetch.mock.mockImplementation(async () => new Response('private provider details', { status }));
    await assert.rejects(sendContactAcknowledgment(leadId, submission), { message: 'Contact acknowledgment could not be sent.' });
    assert.equal(fetch.mock.callCount(), 1);
    assert.equal(delay.mock.callCount(), 0);
  });
}
