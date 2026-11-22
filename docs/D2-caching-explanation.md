# D2 — HTTP caching explanation

Endpoint: `GET https://app.team1.test:8443/api/cache` (implemented identically on Backend A and B).

| Header / status | Role |
|---|---|
| `Cache-Control: max-age=60` | The response is **fresh** for 60 s. During that time a client may reuse its stored copy without contacting the server. |
| `ETag: "cache-v1"` | Opaque validator identifying this version of the resource. |
| `If-None-Match: "cache-v1"` | Sent by the client after the copy goes stale: "has it changed?" |
| `304 Not Modified` | Server says the stored copy is still valid — headers only, no body. |

## Three kinds of request

1. **Fresh cache hit** — within `max-age`; no request leaves the client at all.
2. **Conditional request** — copy is stale; client sends `If-None-Match`; server replies `304` (no body).
3. **Full new request** — no cached copy (or the ETag changed); server replies `200` with the full body.

## Demonstration

```bash
curl -sI https://app.team1.test:8443/api/cache
curl -i -H 'If-None-Match: "cache-v1"' https://app.team1.test:8443/api/cache
```

The first returns `200` with `Cache-Control` and `ETag`; the second returns `304 Not Modified`.
Because both backends use the same ETag, revalidation works no matter which backend nginx picks
(in our evidence the 200 came from Backend A and the 304 from Backend B).

nginx itself does not cache responses here; caching is shown as client-side freshness plus
server-side validation.
