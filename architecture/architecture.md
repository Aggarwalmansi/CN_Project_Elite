# Architecture — Team 1

## Machines

| Machine | Owner | IP (Wi-Fi `en0`) | Phase 1 role | Phase 2 additions |
|---|---|---|---|---|
| Mac 1 | Mansi | `10.7.21.182` | Primary DNS (dnsmasq :53), Backend A (:3001), test client | Standby nginx edge (:8443), pf rule for 3001 |
| Mac 2 | Tanisha | `10.7.21.206` | nginx edge (:8443, TLS), Backend B (:3002), DNS client | Backup DNS (dnsmasq :53), pf rule for 3002 |

Subnet mask, gateway and MAC addresses: fill from
`ipconfig getoption en0 subnet_mask`, `route -n get default | grep gateway`, `ifconfig en0 | grep ether`.
IPs are DHCP-assigned — re-check before every demo.

## Topology

```text
                         Wi-Fi LAN (en0)
          +-------------------+-------------------+
          |                                       |
  Mac 1  10.7.21.182                      Mac 2  10.7.21.206
  ├─ dnsmasq  :53   (primary DNS)         ├─ nginx    :8443 (primary edge, TLS)
  ├─ Backend A :3001                      ├─ Backend B :3002
  ├─ nginx    :8443 (standby edge, P2)    ├─ dnsmasq  :53   (backup DNS, P2)
  └─ test client (dig, curl, Wireshark)   └─ DNS client
```

## Request flow and protocol layers

| Step | Layer (TCP/IP) | Protocol / port | What happens |
|---|---|---|---|
| 1 | Application over UDP | DNS, UDP 53 | Client asks for `app.team1.test` → `A 10.7.21.206` (TTL 30 s in Phase 2) |
| 2 | Transport | TCP, ephemeral → 8443 | SYN, SYN-ACK, ACK to the edge |
| 3 | Session security | TLS 1.3 (SNI `app.team1.test`) | ClientHello → ServerHello → Certificate → Finished; HTTP is then encrypted |
| 4 | Application | HTTP/1.1 or HTTP/2 | nginx terminates TLS, `proxy_pass` to the upstream |
| 5 | Transport | TCP → 3001 / 3002 (plain HTTP) | nginx picks Backend A or B (round robin, passive health checks) |
| 6 | Application | HTTP response | Backend adds `X-Backend`, nginx adds `X-Edge`, response returns over TLS |
| — | Network / Link | IPv4 / 802.11 Wi-Fi | Carries every step above |

## Cloud equivalents

| Local component | Cloud equivalent |
|---|---|
| dnsmasq primary + backup | Route 53 (multiple name servers) |
| nginx edge | AWS ALB / GCP Load Balancer / CDN edge |
| Backend A / B | EC2 instances in a target group |
| pf rules on 3001/3002 | Security groups allowing only the load balancer |
| DNS cutover to standby edge | Route 53 failover / weighted records with short TTL |

## Known limitation: port 53 on Mac 1

The managed firewall on Mac 1 blocks **inbound** port 53, so other machines cannot query Mac 1's
dnsmasq. Mac 1's **outbound** DNS works. Phase 2 therefore puts the backup DNS on Mac 2 and runs the
failover demo from Mac 1 (primary 127.0.0.1 → backup 10.7.21.206).

## Single point of failure

The edge nginx on Mac 2. Removing it needs a second active edge plus a shared virtual IP
(keepalived/VRRP), multiple DNS A records, or a managed cloud load balancer. Extension E shows
a manual, DNS-based version of this.
