import { NextResponse } from "next/server";
import JSZip from "jszip";

const INDEX_JS = `const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const { Boom } = require("@hapi/boom");
const fetch = require("node-fetch");
const pino = require("pino");
const path = require("path");
const fs = require("fs");

const MENTRA_URL = process.env.MENTRA_URL;
const GATEWAY_SECRET = process.env.GATEWAY_SECRET;

if (!MENTRA_URL || !GATEWAY_SECRET) {
  console.error("Missing MENTRA_URL or GATEWAY_SECRET env vars");
  process.exit(1);
}

async function pingMentra() {
  try {
    await fetch(\`\${MENTRA_URL}/api/gateway/webhook\`, {
      method: "PUT",
      headers: { "x-gateway-secret": GATEWAY_SECRET, "content-type": "application/json" },
      body: JSON.stringify({ ping: true }),
    });
    console.log("Pinged Mentra — gateway marked as active");
  } catch (e) {
    console.error("Failed to ping Mentra:", e.message);
  }
}

async function sendToMentra(from, message, sessionApiKey) {
  const res = await fetch(\`\${MENTRA_URL}/api/gateway/webhook\`, {
    method: "POST",
    headers: { "x-gateway-secret": GATEWAY_SECRET, "content-type": "application/json" },
    body: JSON.stringify({ from, message, sessionApiKey }),
  });
  const data = await res.json();
  return data.reply ?? "Sorry, I could not process that.";
}

const waSessions = new Map();

async function connectToWhatsApp() {
  const authDir = path.join(__dirname, "auth_info");
  if (!fs.existsSync(authDir)) fs.mkdirSync(authDir);

  const { state, saveCreds } = await useMultiFileAuthState(authDir);

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
    logger: pino({ level: "silent" }),
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
      if (reason !== DisconnectReason.loggedOut) {
        console.log("Reconnecting...");
        connectToWhatsApp();
      } else {
        console.log("Logged out. Delete auth_info/ and restart.");
      }
    } else if (connection === "open") {
      console.log("WhatsApp connected!");
      await pingMentra();
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    for (const msg of messages) {
      if (msg.key.fromMe || !msg.message) continue;

      const from = msg.key.remoteJid;
      const text =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        "";

      if (!text.trim()) continue;

      console.log(\`[WA] \${from}: \${text}\`);

      const sessionKey = waSessions.get(from) ?? null;

      let apiKey = null;
      if (!sessionKey && text.trim().length > 20 && !text.toLowerCase().includes(" ")) {
        apiKey = text.trim();
        waSessions.set(from, apiKey);
      }

      try {
        const reply = await sendToMentra(from, text, sessionKey || apiKey);
        await sock.sendMessage(from, { text: reply });
      } catch (e) {
        console.error("Error:", e.message);
        await sock.sendMessage(from, { text: "Something went wrong. Please try again." });
      }
    }
  });
}

connectToWhatsApp();
`;

const PACKAGE_JSON = JSON.stringify({
  name: "mentra-gateway",
  version: "1.0.0",
  description: "Mentra WhatsApp Gateway — connects a WhatsApp number to the Mentra AI agent",
  main: "index.js",
  scripts: { start: "node index.js" },
  dependencies: {
    "@hapi/boom": "^10.0.1",
    "@whiskeysockets/baileys": "^6.7.16",
    "node-fetch": "^2.7.0",
    "pino": "^8.21.0",
  },
}, null, 2);

const README_MD = `# Mentra WhatsApp Gateway

This is a standalone Node.js service that connects a WhatsApp number to the Mentra AI agent via Baileys.

## Setup

### 1. Install dependencies
\`\`\`bash
npm install
\`\`\`

### 2. Set environment variables
Create a \`.env\` file or set them in your deployment:
\`\`\`
MENTRA_URL=https://your-mentra-domain.com
GATEWAY_SECRET=your-shared-secret
\`\`\`

The \`GATEWAY_SECRET\` must match what you entered in the Mentra Connector page.

### 3. Run the gateway
\`\`\`bash
node index.js
\`\`\`

On first run, a QR code will appear in the terminal — scan it with WhatsApp.

### 4. Deploy on Railway
1. Create a new Railway project
2. Upload this folder (or connect a GitHub repo)
3. Set env vars: \`MENTRA_URL\` and \`GATEWAY_SECRET\`
4. Deploy. The QR code will appear in Railway logs — scan it once.

## How it works
1. User sends a message to the WhatsApp number
2. Gateway forwards the message to \`POST /api/gateway/webhook\` on Mentra
3. Mentra processes it through the AI agent and returns a reply
4. Gateway sends the reply back via WhatsApp

The gateway auto-pings Mentra on startup to mark itself as connected.
`;

const GITIGNORE = `node_modules/
auth_info/
.env
`;

export async function GET() {
  try {
    const zip = new JSZip();
    zip.file("index.js", INDEX_JS);
    zip.file("package.json", PACKAGE_JSON);
    zip.file("README.md", README_MD);
    zip.file(".gitignore", GITIGNORE);

    const buffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="mentra-gateway.zip"',
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: "Failed to generate ZIP", detail: e?.message }, { status: 500 });
  }
}
