import {createHash, createHmac} from 'node:crypto';
import {isIP} from 'node:net';

const BACKEND_ORIGIN = 'https://gignology-solutions.mejia1604.chatgpt.site';
const PUBLIC_ROUTES = Object.freeze({
  '/api/inquiries': 'POST',
  '/api/bookings': 'POST',
  '/api/case-studies': 'GET',
  '/api/public/config': 'GET',
});
const BODY_LIMIT = 40_000;
const RESPONSE_LIMIT = 1_000_000;
const UPSTREAM_TIMEOUT = 12_000;

class RelayError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...extraHeaders,
    },
  });
}

async function boundedBytes(stream, limit, status, message) {
  if (!stream) return new Uint8Array();
  const reader = stream.getReader();
  const chunks = [];
  let length = 0;
  try {
    while (true) {
      const {done, value} = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > limit) {
        await reader.cancel().catch(() => {});
        throw new RelayError(status, message);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

function configuration(env) {
  const origin = env.SITES_BACKEND_ORIGIN?.trim();
  const token = env.SITES_BACKEND_TOKEN?.trim();
  const secret = env.GIGNOLOGY_RELAY_SECRET;
  // A fixed origin prevents a misconfigured relay from sending credentials elsewhere.
  if (origin !== BACKEND_ORIGIN || !token || /[\r\n]/.test(token) || typeof secret !== 'string' || secret.length < 32) {
    throw new RelayError(503, 'This service is being prepared. Please email contact@gignologysolutions.com.');
  }
  return {origin, token, secret};
}

function clientAddress(request) {
  // Vercel supplies these headers itself. Never accept a client-authored custom IP header.
  const address = (request.headers.get('x-vercel-forwarded-for') || request.headers.get('x-forwarded-for') || '').trim();
  if (!isIP(address)) {
    throw new RelayError(503, 'We could not verify this connection. Please try again.');
  }
  return address;
}

/** Relay one hardcoded public route; dependencies are injectable for isolated tests. */
export async function relayPublic(request, pathname, {env = process.env, fetchImpl = fetch, now = Date.now} = {}) {
  try {
    const method = PUBLIC_ROUTES[pathname];
    if (!method || new URL(request.url).pathname !== pathname) {
      return json({error: 'This endpoint was not found.'}, 404);
    }
    if (request.method !== method) {
      return json({error: 'This method is not supported.'}, 405, {Allow: method});
    }

    let bytes = new Uint8Array();
    if (method === 'POST') {
      const contentType = request.headers.get('content-type')?.split(';')[0].trim().toLowerCase();
      if (contentType !== 'application/json') throw new RelayError(415, 'Send this request as JSON.');
      if (request.headers.get('origin') !== new URL(request.url).origin || request.headers.get('sec-fetch-site') === 'cross-site') {
        throw new RelayError(403, 'Please submit this form from the Gignology website.');
      }
      if (Number(request.headers.get('content-length') || 0) > BODY_LIMIT) {
        throw new RelayError(413, 'This request is too large.');
      }
      bytes = await boundedBytes(request.body, BODY_LIMIT, 413, 'This request is too large.');
      if (!bytes.length) throw new RelayError(400, 'This request is empty.');
    }

    const {origin, token, secret} = configuration(env);
    const clientIp = clientAddress(request);
    const timestamp = String(Math.floor(now() / 1000));
    const bodyHash = createHash('sha256').update(bytes).digest('hex');
    const canonical = `${timestamp}\n${method}\n${pathname}\n${clientIp}\n${bodyHash}`;
    const signature = createHmac('sha256', secret).update(canonical).digest('hex');
    // Construct a new header set. Cookies and Sites owner identity must never cross this relay.
    const headers = {
      Accept: 'application/json',
      'OAI-Sites-Authorization': `Bearer ${token}`,
      'X-Gignology-Relay-Time': timestamp,
      'X-Gignology-Relay-IP': clientIp,
      'X-Gignology-Relay-Signature': signature,
    };
    if (method === 'POST') {
      headers['Content-Type'] = 'application/json';
      headers.Origin = origin;
    }

    const upstream = await fetchImpl(`${origin}${pathname}`, {
      method,
      headers,
      ...(method === 'POST' ? {body: bytes} : {}),
      redirect: 'manual',
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT),
      cache: 'no-store',
    });
    if ((upstream.status >= 300 && upstream.status < 400) || upstream.status < 200 || !upstream.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
      await upstream.body?.cancel().catch(() => {});
      throw new RelayError(502, 'We could not connect to the Gignology service. Please try again.');
    }
    const responseBytes = await boundedBytes(upstream.body, RESPONSE_LIMIT, 502, 'The service returned an unexpected response. Please try again.');
    let data;
    try {
      data = JSON.parse(new TextDecoder('utf-8', {fatal: true}).decode(responseBytes));
      if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Invalid response');
    } catch {
      throw new RelayError(502, 'The service returned an unexpected response. Please try again.');
    }
    const retryAfter = upstream.headers.get('retry-after');
    return json(data, upstream.status, retryAfter && /^\d{1,6}$/.test(retryAfter) ? {'Retry-After': retryAfter} : {});
  } catch (error) {
    if (error instanceof RelayError) return json({error: error.message}, error.status);
    // Do not log request bodies, visitor details, service credentials, or upstream error text.
    console.error('Gignology public relay could not complete an upstream request.');
    return json({error: 'We could not connect to the Gignology service. Please try again.'}, error?.name === 'TimeoutError' ? 504 : 502);
  }
}
