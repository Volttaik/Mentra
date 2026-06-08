import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";
import { transformToMt, parseTextContent, MtObject } from "./mt-transform";

export interface EncryptedMtPacket {
  version: "MT1";
  encryptedData: string;
  iv: string;
  authTag: string;
}

function deriveKey(stackId: string): Buffer {
  const secret =
    process.env.MT_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "mt-engine-dev-fallback-key-32char";
  return scryptSync(secret, `mt:${stackId}`, 32) as Buffer;
}

export function encryptMtContent(
  mtObject: MtObject,
  stackId: string
): EncryptedMtPacket {
  const key = deriveKey(stackId);
  const iv = randomBytes(16);
  const plaintext = JSON.stringify(mtObject);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return {
    version: "MT1",
    encryptedData: encrypted.toString("base64"),
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
  };
}

export function decryptMtContent(
  packet: EncryptedMtPacket,
  stackId: string
): MtObject {
  const key = deriveKey(stackId);
  const decipher = createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(packet.iv, "base64")
  );
  decipher.setAuthTag(Buffer.from(packet.authTag, "base64"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(packet.encryptedData, "base64")),
    decipher.final(),
  ]);
  return JSON.parse(decrypted.toString("utf8")) as MtObject;
}

export function buildAndEncryptMt(
  rawText: string,
  stackId: string,
  fileName?: string,
  fileType?: string
): { mt: MtObject; packet: EncryptedMtPacket } {
  const normalized = parseTextContent(rawText);
  const mt = transformToMt(normalized, fileName, fileType);
  const packet = encryptMtContent(mt, stackId);
  return { mt, packet };
}
