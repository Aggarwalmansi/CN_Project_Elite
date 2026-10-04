# Computer Networking — Phase 1

## Team Members

- **Mansi Agarwal** - 2401010264
- **Tanisha Dhiman** - 2401010475

## Project Overview

This project implements a two-machine networking setup using two physical Macs.

The system demonstrates:

- Private DNS resolution using `dnsmasq`
- Domain-based access using `app.team1.test`
- HTTPS/TLS termination at an `nginx` edge server
- Load balancing across two backend servers
- DNS packet capture with Wireshark
- TCP three-way handshake capture
- TLS handshake and certificate inspection
- HTTP caching using `Cache-Control`, `ETag`, and `304 Not Modified`
- Backend failure and recovery

## Machine Roles

| Machine | IP Address | Role |
|---|---|---|
| Mac 1 — Mansi | `10.7.21.182` | Private DNS + Backend A + Test Client |
| Mac 2 — Tanisha | `10.7.21.206` | nginx Edge + Backend B + DNS Client |

The active Wi-Fi interface on both Macs is `en0`.

## Architecture

```text
                         Wi-Fi Network
                              |
                +-------------+-------------+
                |                           |
        Mac 1: 10.7.21.182          Mac 2: 10.7.21.206
                |                           |
        +-------+-------+           +-------+--------+
        |               |           |                |
     dnsmasq        Backend A     nginx Edge      Backend B
      :53             :3001         :8443            :3002
        |               |             |
        +---------------+-------------+
                        |
                 app.team1.test
```

### DNS

Mac 1 runs `dnsmasq` and contains these mappings:

```text
listen-address=127.0.0.1,10.7.21.182
address=/app.team1.test/10.7.21.206
address=/api.team1.test/10.7.21.206
```

`app.team1.test` resolves to the nginx edge IP:

```text
10.7.21.206
```

### HTTPS / nginx

Mac 2 runs nginx on:

```text
https://app.team1.test:8443
```

nginx terminates TLS and forwards requests to the backend upstream group:

```nginx
upstream backend_servers {
    server 10.7.21.182:3001;
    server 127.0.0.1:3002;
}
```

Backend A is on Mac 1 and Backend B is local to Mac 2.

## Running Backend A — Mac 1

Backend A is located at:

```text
~/cn-project
```

Start it with:

```bash
cd ~/cn-project
npm install
npm run build
npm start
```

Backend A listens on:

```text
http://0.0.0.0:3001
```

Useful test:

```bash
curl -i http://127.0.0.1:3001/api/status
```

## Running Backend B — Mac 2

Backend B is located at:

```text
~/cn-project/backend-b
```

Start it with:

```bash
cd ~/cn-project/backend-b
npm install
npm run build
npm start
```

Backend B listens on:

```text
http://127.0.0.1:3002
```

Useful test:

```bash
curl -i http://127.0.0.1:3002/api/status
```

## Running / Checking dnsmasq — Mac 1

Configuration:

```text
/opt/homebrew/etc/dnsmasq.conf
```

Check the relevant configuration:

```bash
grep -E '^(address=|listen-address=|interface=)' /opt/homebrew/etc/dnsmasq.conf
```

Test local DNS:

```bash
dig @127.0.0.1 app.team1.test
```

Expected answer:

```text
app.team1.test.    0    IN    A    10.7.21.206
```

## Running / Checking nginx — Mac 2

Configuration:

```text
/opt/homebrew/etc/nginx/nginx.conf
```

Test the configuration:

```bash
nginx -t -c /opt/homebrew/etc/nginx/nginx.conf
```

The project nginx configuration uses:

```text
HTTPS port: 8443
Server name: app.team1.test
```

Certificate files:

```text
/Users/tanisha/cn-project/certs/team1.crt
/Users/tanisha/cn-project/certs/team1.key
```

nginx logs:

```text
/tmp/team1-nginx-access.log
/tmp/team1-nginx-error.log
```

Start nginx if it is not already running:

```bash
nginx -c /opt/homebrew/etc/nginx/nginx.conf
```

## End-to-End Test

From Mac 1 or Mac 2, when DNS is configured for the test:

```bash
curl -v https://app.team1.test:8443/api/status
```

A successful response should contain:

```text
HTTP/1.1 200 OK
```

and an `X-Backend` header identifying the backend that handled the request.

## Load Balancing Test

Run:

```bash
for i in {1..6}; do
  curl -s -D - https://app.team1.test:8443/api/status -o /dev/null | grep -E 'HTTP/|X-Backend:'
done
```

With both backends healthy, responses should demonstrate requests being served by both:

```text
X-Backend: A
X-Backend: B
```

## Caching Test

The caching endpoint is:

```text
https://app.team1.test:8443/api/cache
```

Check the caching headers:

```bash
curl -sI https://app.team1.test:8443/api/cache
```

The response includes:

```text
Cache-Control: max-age=60
ETag: "cache-v1"
```

Test conditional caching:

```bash
curl -i -H 'If-None-Match: "cache-v1"' https://app.team1.test:8443/api/cache
```

An unchanged resource can return:

```text
HTTP/1.1 304 Not Modified
```

## Failure Demonstration

The Phase 1 failure demonstration uses **Option A — Stop one backend**.

### Before

Both Backend A and Backend B are running. Requests through nginx show both backend identities.

### Failure

Stop Backend A on Mac 1.

### After

Requests through nginx continue to return HTTP 200 responses through Backend B.

### Restoration

Restart Backend A:

```bash
cd ~/cn-project
npm start
```

After restoration, requests through nginx again show responses from both backends.

The failure demonstration evidence includes before, after, nginx error-log, restored-state, and video evidence.

## Wireshark Evidence

### C1 — DNS

DNS traffic is captured on Mac 1 using the loopback interface with:

```text
dns && dns.qry.name == "app.team1.test"
```

The capture shows the DNS query and response, with the response mapping:

```text
app.team1.test → 10.7.21.206
```

### C2 — TCP

TCP traffic is captured on Mac 2 with:

```text
tcp.port == 8443
```

The capture demonstrates:

```text
SYN
SYN-ACK
ACK
```

between Mac 1 and the nginx edge on Mac 2.

### C3 — TLS

TLS traffic is captured with:

```text
tls
```

For visible TLS 1.2 certificate evidence, the test can be generated with:

```bash
curl --tlsv1.2 --tls-max 1.2 -v https://app.team1.test:8443/api/status
```

The capture demonstrates the TLS handshake, including ClientHello, ServerHello, Certificate, and encrypted Application Data.

## Evidence Organization

Evidence is stored under:

```text
evidence/
├── A1-dns/
├── A2-domain-resolution/
├── A3-cross-machine-dns/
├── A4-public-dns/
├── A5-connectivity/
├── B1-https/
├── B2-load-balancing/
├── B3-nginx/
├── C1-dns-wireshark/
├── C2-tcp-tls/
├── C3-tls-details/
├── D1-caching/
└── D3-failure-recovery/
```

Additional project material is stored under:

```text
architecture/
config/
docs/
```

## Important Notes

- Use the domain name `app.team1.test` for final HTTPS demonstrations.
- Do not use `curl -k`; certificate verification should succeed normally.
- The HTTPS service uses port `8443` rather than the default port `443`.
- Backend A uses port `3001`.
- Backend B uses port `3002`.
- Private DNS uses port `53`.
- The university-managed firewall prevented Mac 2 from reaching Mac 1's `dnsmasq` service on port 53 during the cross-machine DNS test. Local Mac 1 DNS resolution was verified successfully, and the limitation is documented in the A3 evidence.
