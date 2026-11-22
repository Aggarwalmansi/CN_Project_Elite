# TLS certificate setup notes

The edge uses a **self-signed** certificate for the project domain.

| Field | Value |
|---|---|
| Subject / Issuer | `CN=app.team1.test` (self-signed: issuer = subject) |
| Subject Alternative Names | `DNS:app.team1.test`, `DNS:api.team1.test` |
| Valid | 3 Oct 2026 → 3 Oct 2027 |
| Files (Mac 2) | `/Users/tanisha/cn-project/certs/team1.crt`, `team1.key` |

The private key is **never committed** (`*.key` is in `.gitignore`).

## Regenerating (if ever needed)

```bash
openssl req -x509 -newkey rsa:2048 -nodes -days 365 \
  -keyout team1.key -out team1.crt \
  -subj "/CN=app.team1.test" \
  -addext "subjectAltName=DNS:app.team1.test,DNS:api.team1.test"
```

## Trusting it on a client Mac (no `curl -k`)

```bash
sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain team1.crt
```

## Inspecting it

```bash
openssl x509 -in team1.crt -noout -subject -issuer -dates -ext subjectAltName
openssl s_client -connect app.team1.test:8443 -servername app.team1.test </dev/null | grep -E 'subject=|issuer=|Verify return'
```

## Phase 2 — standby edge (Extension E)

The standby nginx on Mac 1 uses the **same** `team1.crt` / `team1.key`, copied by AirDrop.
The certificate is bound to the *name* `app.team1.test`, not to an IP, so it stays valid
when DNS moves the name from `10.7.19.91` to `10.7.2.116`.
