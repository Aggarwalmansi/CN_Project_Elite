# A1 — Machine addresses and interface

`image.png`: `networksetup -listallhardwareports` on Mac 1 — the Wi-Fi hardware port is `en0`.

| Machine | Phase 1 IP | Phase 2 IP | Mask | Gateway | MAC (private Wi-Fi) | Hardware MAC | Interface |
|---|---|---|---|---|---|---|---|
| Mac 1 (Mansi) | 10.7.21.182 | 10.7.2.116 | 255.255.224.0 | 10.7.0.1 | d6:78:48:9d:69:80 | 34:66:91:ef:34:fd | en0 |
| Mac 2 (Tanisha) | 10.7.21.206 | 10.7.19.91 | 255.255.224.0 | 10.7.0.1 | 4e:af:e1:b4:1c:dc | 10:9f:41:b8:3c:b5 | en0 |

Source for the Phase 2 values: the Wi-Fi menu with the Option key held, on each Mac (save those
screenshots in this folder), plus `ipconfig getoption en0 subnet_mask`.
