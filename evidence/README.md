# Evidence Index — Team 1

Mac 1 = Mansi (`10.7.2.116`, primary DNS, Backend A, standby edge, test client)
Mac 2 = Tanisha (`10.7.19.91`, nginx edge, Backend B, backup DNS)
Phase 1 folders use the Phase 1 IPs (`10.7.21.182` / `10.7.21.206`).

## Phase 1

| Folder | Requirement | Shows |
|---|---|---|
| `A1-dns/` | Task A | Wi-Fi interface `en0`; IP / mask / gateway / MAC table in `readme.md` |
| `A2-domain-resolution/` | Task B | dnsmasq records |
| `A3-cross-machine-dns/` | Task B | Phase 1 limitation (port 53 on Mac 1); **resolved in Phase 2**, see `P2-A-backup-dns/` |
| `A4-public-dns/` | Task B | `dig @8.8.8.8` → NXDOMAIN |
| `A5-connectivity/` | Task A | ping both directions |
| `B1-https/` | Task E | HTTPS, certificate verified without `-k` |
| `B2-load-balancing/` | Task D | X-Backend A/B alternating |
| `B3-nginx/` | Task D | nginx upstream config |
| `C1-dns-wireshark/` | Task G | DNS query/response |
| `C2-tcp-tls/` | Task G | TCP three-way handshake |
| `C3-tls-details/` | Task G | TLS handshake, Certificate message |
| `D1-caching/` | Task F | Cache-Control, ETag, 304 |
| `D3-failure-recovery/` | §6.3 | One backend stopped and recovered |

## Phase 2

### `P2-A-backup-dns/` — Extension A: Backup DNS resolver
| File | Shows |
|---|---|
| `01-dns-failover-to-backup.png` | Mac 1 with no team DNS → `SERVER: 8.8.8.8`, no answer (also the §6.3 *wrong DNS server* case) · DNS set to `127.0.0.1, 10.7.19.91` · primary answers (TTL 30) · primary stopped → `connection refused` · **resolution continues via backup `10.7.19.91`** · site still `HTTP/2 200` · primary restored |
| `02-dns-failover-to-backup.mov` | Screen recording of the same sequence (4 min) |

### `P2-B-E-ttl-and-cutover/` — Extensions B (TTL) and E (DNS-based edge cutover)
| File | Shows |
|---|---|
| `01-standby-nginx-setup-and-test.png` | Standby nginx on Mac 1 (same cert): `nginx -t`, listening on 8443, `--resolve` test → `HTTP/2 200`, `x-edge: mac1-standby`, A/B balanced |
| `02-standby-nginx-setup.mov` | Recording of the standby setup |
| `03-cutover-ttl-window-and-flush.png` | Left: live monitor. Right: record changed to `10.7.2.116`. Client keeps hitting `mac2-primary` until **17:43:24** (cached answer, TTL 30 s), then `mac1-standby`. Record reverted + cache flushed → back to `mac2-primary` at **17:44:01** with no TTL wait |
| `04-cutover-final-and-reverted.png` | Full monitor run, then `dig` → `10.7.19.91` and primary `listen-address` check |
| `05-mac2-backup-record-change-and-revert.png` | Same record change and revert on the backup DNS (Mac 2), config check |

### `P2-C-firewall/` — Extension C: Service isolation (pf)
| File | Shows |
|---|---|
| `01-mac2-block-3002-counter-rollback.png` | Mac 2: pf enabled (token), rule `block ... port 3002` loaded in anchor `com.apple/team1`, **Packets: 3** dropped, rollback |
| `02-mac1-client-blocked-and-mac1-rules-loaded.png` | Mac 1: `nc` to `10.7.19.91:3002` **times out**; via edge still served; Mac 1 rules loaded (only `10.7.19.91` may reach 3001) |
| `03-mac1-edge-allowed-counters-rollback.png` | Edge still balances A/B; `pass` rule **30 packets** from the edge, `block` rule 0; rollback |
| `04-mac1-rollback-3002-reachable.png` | After rollback: `nc` to 3002 **succeeded** (original state restored) |

### `P2-D-failover/` — Extension D: HA failover
| File | Shows |
|---|---|
| `01-before-kill-backend-A-only-B.png` | Before: A/B alternating · Backend A located with `lsof` and killed · 8/8 requests `200` via B |
| `02-edge-error-log.png` | nginx error log: `connect() failed (61: Connection refused)` to `10.7.2.116:3001` — one error only (`max_fails=1 fail_timeout=10s`) |
| Recovery | Top of `P2-C-firewall/03-…png`: Backend A restarted → A/B alternating again |

### `P2-F-troubleshooting/` — Extension F practice
| File | Shows |
|---|---|
| `01-backup-dns-down-wrong-listen-address.png` | Fault: backup DNS `dig` times out. Diagnosis: dnsmasq not running → config had Mac 1's `listen-address` → fixed by restoring `config/dnsmasq/phase2-mac2-backup.conf` |

### `P1-failures/` — §6.3 failure scenarios
| File | Shows |
|---|---|
| `02-wrong-dns-record.png` | Record changed to `10.7.19.99` → `dig` returns the wrong IP, `curl` **times out** (no host there) · record reverted → `10.7.19.91`, connection succeeds |
| `03-both-backends-down-502.png` | Mac 1: Backend A up → `HTTP/2 200`; both backends stopped → **`HTTP/2 502`** from `mac2-primary` |
| `03b-edge-log-both-refused.png` | Mac 2 edge log: one request (`*317`), both upstreams `Connection refused` (A `10.7.2.116:3001`, B `127.0.0.1:3002`) → 502 |
| `04-wrong-port.png` | `ping` 10.7.19.91 OK (host up) · `curl :9443` → **Connection refused** (nothing listening) · `:8443` → `200` |

The wrong DNS server case is in `P2-A-backup-dns/01-…png` (`SERVER: 8.8.8.8`, no answer).

### `P2-config/` — Phase 2 configuration proof
| File | Shows |
|---|---|
| `01-mac1-cross-machine-dns-and-servers.png` | Mac 1 `dig @10.7.19.91 app.team1.test` → `NOERROR`, `aa`, `30 IN A 10.7.19.91`, `SERVER: 10.7.19.91#53` — **cross-machine DNS works (closes Phase 1 A3)**; Mac 1 DNS servers `127.0.0.1`, `10.7.19.91` |
| `02-mac2-resolver-dnsmasq-nginx-http2.png` | Mac 2: `/etc/resolver/team1.test` + `scutil` resolver #8 (primary, then local backup, timeout 2) · backup dnsmasq config (`listen-address=127.0.0.1,10.7.19.91`, `host-record … 30`, `no-hosts`) · nginx upstream (`max_fails=1 fail_timeout=10s`, `proxy_next_upstream_tries 2`, `http2 on`, `X-Edge`) · `curl -v`: TLS 1.3, ALPN `h2`, cert matched, `HTTP/2 200` |

### `P2-captures/` — Wireshark (Phase 2)
| File | Shows |
|---|---|
| `phase2-dns-tcp-tls.pcapng` | Mac 1 ↔ Mac 2 only: DNS `A app.team1.test` → `10.7.19.91`, TCP handshake to 8443, TLS 1.3 Client Hello (SNI `app.team1.test`, ALPN `h2`) / Server Hello |
| `01-dns.png` · `02-tcp-handshake.png` · `03-tls-client-hello.png` · `04-tls-server-hello.png` | Screenshots of the capture |
