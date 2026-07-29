import { describe, expect, it } from "vitest";
import { normalizePemPrivateKey } from "./pem";

const BODY_LINES = [
  "MIIEowIBAAKCAQEA0Z3VS5JJcds3xfn/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
  "BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB",
  "CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC",
  "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
  "EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE",
];

function pemFromLines(lines: string[]): string {
  return `-----BEGIN RSA PRIVATE KEY-----\n${lines.join("\n")}\n-----END RSA PRIVATE KEY-----\n`;
}

describe("normalizePemPrivateKey", () => {
  it("expands literal \\n escapes", () => {
    const escaped = pemFromLines(BODY_LINES).replace(/\n/g, "\\n");
    expect(normalizePemPrivateKey(escaped)).toBe(pemFromLines(BODY_LINES));
  });

  it("repairs /n mistaken for \\n between PEM lines", () => {
    const broken = `-----BEGIN RSA PRIVATE KEY-----/n${BODY_LINES.join("/n")}/n-----END RSA PRIVATE KEY-----`;
    expect(normalizePemPrivateKey(broken)).toBe(pemFromLines(BODY_LINES));
  });

  it("wraps a mashed single-line PEM", () => {
    const mashed = `-----BEGIN RSA PRIVATE KEY-----${BODY_LINES.join("")}-----END RSA PRIVATE KEY-----`;
    expect(normalizePemPrivateKey(mashed)).toBe(pemFromLines(BODY_LINES));
  });

  it("leaves an already-valid multi-line PEM intact", () => {
    const valid = pemFromLines(BODY_LINES);
    expect(normalizePemPrivateKey(valid)).toBe(valid);
  });
});
