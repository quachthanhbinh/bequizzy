/**
 * Cloudflare Worker — api.revlooper.com reverse proxy
 *
 * Rewrites the Host header so Cloud Run accepts the request.
 * All paths, methods, headers, and bodies are forwarded unchanged.
 */
export default {
  async fetch(request, env) {
    const origin = env.ORIGIN || "https://api-gateway-smlhx7kntq-as.a.run.app";
    const url = new URL(request.url);
    url.hostname = new URL(origin).hostname;
    url.protocol = "https:";
    url.port = "";

    // Forward everything except the Host header (browser sets it to api.revlooper.com;
    // we need Cloud Run to see its own hostname so it accepts the request).
    const proxyRequest = new Request(url.toString(), {
      method: request.method,
      headers: request.headers,
      body: ["GET", "HEAD"].includes(request.method) ? undefined : request.body,
      redirect: "follow",
    });

    return fetch(proxyRequest);
  },
};
