import { describe, it, expect, beforeEach } from "vitest";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { KiroAdapter } from "../../src/adapters/kiro/index.js";

describe("KiroAdapter", () => {
  let adapter: KiroAdapter;

  beforeEach(() => {
    adapter = new KiroAdapter();
  });

  // ── Identity ───────────────────────────────────────────

  describe("identity", () => {
    it("name is Kiro", () => {
      expect(adapter.name).toBe("Kiro");
    });

    it("paradigm is mcp-only", () => {
      expect(adapter.paradigm).toBe("mcp-only");
    });
  });

  // ── Capabilities ──────────────────────────────────────

  describe("capabilities", () => {
    it("all capabilities are false", () => {
      expect(adapter.capabilities.preToolUse).toBe(false);
      expect(adapter.capabilities.postToolUse).toBe(false);
      expect(adapter.capabilities.preCompact).toBe(false);
      expect(adapter.capabilities.sessionStart).toBe(false);
      expect(adapter.capabilities.canModifyArgs).toBe(false);
      expect(adapter.capabilities.canModifyOutput).toBe(false);
      expect(adapter.capabilities.canInjectSessionContext).toBe(false);
    });
  });

  // ── Parse methods (all throw) ─────────────────────────

  describe("parse methods", () => {
    it("parsePreToolUseInput throws", () => {
      expect(() => adapter.parsePreToolUseInput({})).toThrow(
        /Kiro does not support hooks \(yet\)/,
      );
    });

    it("parsePostToolUseInput throws", () => {
      expect(() => adapter.parsePostToolUseInput({})).toThrow(
        /Kiro does not support hooks \(yet\)/,
      );
    });

    it("parsePreCompactInput throws", () => {
      expect(() => adapter.parsePreCompactInput({})).toThrow(
        /Kiro does not support hooks \(yet\)/,
      );
    });

    it("parseSessionStartInput throws", () => {
      expect(() => adapter.parseSessionStartInput({})).toThrow(
        /Kiro does not support hooks \(yet\)/,
      );
    });
  });

  // ── Format methods (all return undefined) ─────────────

  describe("format methods", () => {
    it("formatPreToolUseResponse returns undefined", () => {
      const result = adapter.formatPreToolUseResponse({
        decision: "deny",
        reason: "test",
      });
      expect(result).toBeUndefined();
    });

    it("formatPostToolUseResponse returns undefined", () => {
      const result = adapter.formatPostToolUseResponse({
        additionalContext: "test",
      });
      expect(result).toBeUndefined();
    });

    it("formatPreCompactResponse returns undefined", () => {
      const result = adapter.formatPreCompactResponse({
        context: "test",
      });
      expect(result).toBeUndefined();
    });

    it("formatSessionStartResponse returns undefined", () => {
      const result = adapter.formatSessionStartResponse({
        context: "test",
      });
      expect(result).toBeUndefined();
    });
  });

  // ── Hook config (all empty) ───────────────────────────

  describe("hook config", () => {
    it("generateHookConfig returns empty object", () => {
      const config = adapter.generateHookConfig("/some/plugin/root");
      expect(config).toEqual({});
    });

    it("configureAllHooks returns empty array", () => {
      const changes = adapter.configureAllHooks("/some/plugin/root");
      expect(changes).toEqual([]);
    });

    it("setHookPermissions returns empty array", () => {
      const set = adapter.setHookPermissions("/some/plugin/root");
      expect(set).toEqual([]);
    });
  });

  // ── Config paths ──────────────────────────────────────

  describe("config paths", () => {
    it("settings path is ~/.kiro/settings/mcp_config.json", () => {
      expect(adapter.getSettingsPath()).toBe(
        resolve(homedir(), ".kiro", "settings", "mcp_config.json"),
      );
    });

    it("session dir is under ~/.kiro/context-mode/sessions/", () => {
      const sessionDir = adapter.getSessionDir();
      expect(sessionDir).toBe(
        join(homedir(), ".kiro", "context-mode", "sessions"),
      );
    });

    it("session DB path contains project hash", () => {
      const dbPath = adapter.getSessionDBPath("/test/project");
      expect(dbPath).toMatch(/[a-f0-9]{16}\.db$/);
      expect(dbPath).toContain(".kiro");
    });

    it("session events path contains project hash with -events.md suffix", () => {
      const eventsPath = adapter.getSessionEventsPath("/test/project");
      expect(eventsPath).toMatch(/[a-f0-9]{16}-events\.md$/);
      expect(eventsPath).toContain(".kiro");
    });
  });

  // ── Routing Instructions ──────────────────────────────

  describe("routing instructions", () => {
    it("fileName is KIRO.md", () => {
      const config = adapter.getRoutingInstructionsConfig();
      expect(config.fileName).toBe("KIRO.md");
    });

    it("globalPath is ~/.kiro/KIRO.md", () => {
      const config = adapter.getRoutingInstructionsConfig();
      expect(config.globalPath).toBe(
        resolve(homedir(), ".kiro", "KIRO.md"),
      );
    });

    it("projectRelativePath is KIRO.md", () => {
      const config = adapter.getRoutingInstructionsConfig();
      expect(config.projectRelativePath).toBe("KIRO.md");
    });
  });
});
