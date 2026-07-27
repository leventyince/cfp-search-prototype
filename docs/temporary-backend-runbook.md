# Temporary backend runbook

This prototype currently uses:

GitHub Pages → Cloudflare Worker → Quick Tunnel → self-hosted SearXNG

The Quick Tunnel is temporary and receives a new hostname when restarted.

## Start

1. Start the `searxng-prototype` Hyper-V virtual machine.
2. Confirm that the VM is reachable at `192.168.0.33`.
3. From the repository root on the MacBook, run:

   ```bash
   npm run backend:start