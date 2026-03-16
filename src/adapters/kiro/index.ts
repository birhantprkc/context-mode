/**
 * adapters/kiro — Kiro IDE/CLI platform adapter.
 *
 * Implements HookAdapter for Kiro's MCP-only paradigm (Phase 1).
 *
 * Kiro specifics:
 *   - MCP-only for Phase 1 (hooks to be added in Phase 2 for Kiro CLI)
 *   - Config: ~/.kiro/settings/mcp_config.json (JSON format)
 *   - MCP: full support via mcpServers in mcp_config.json
 *   - All capabilities are false — MCP is the only integration path
 *   - Session dir: ~/.kiro/context-mode/sessions/
 *   - Routing file: KIRO.md
 *
 * Sources:
 *   - MCP config: https://kiro.dev/docs/mcp/configuration/
 *   - clientInfo.name: https://github.com/kirodotdev/Kiro/issues/5205 ("Kiro CLI")
 *   - CLI hooks: https://kiro.dev/docs/cli/hooks/ (Phase 2)
 */

import { createHash } from "node:crypto";
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  copyFileSync,
  accessSync,
  constants,
} from "node:fs";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

import type {
  HookAdapter,
  HookParadigm,
  PlatformCapabilities,
  DiagnosticResult,
  PreToolUseEvent,
  PostToolUseEvent,
  PreCompactEvent,
  SessionStartEvent,
  PreToolUseResponse,
  PostToolUseResponse,
  PreCompactResponse,
  SessionStartResponse,
  HookRegistration,
  RoutingInstructionsConfig,
} from "../types.js";

// ─────────────────────────────────────────────────────────
// Adapter implementation
// ─────────────────────────────────────────────────────────

export class KiroAdapter implements HookAdapter {
  readonly name = "Kiro";
  readonly paradigm: HookParadigm = "mcp-only";

  readonly capabilities: PlatformCapabilities = {
    preToolUse: false,
    postToolUse: false,
    preCompact: false,
    sessionStart: false,
    canModifyArgs: false,
    canModifyOutput: false,
    canInjectSessionContext: false,
  };

  // ── Input parsing ──────────────────────────────────────
  // Kiro does not support hooks (yet). These methods exist to satisfy the
  // interface contract but will throw if called.

  parsePreToolUseInput(_raw: unknown): PreToolUseEvent {
    throw new Error("Kiro does not support hooks (yet)");
  }

  parsePostToolUseInput(_raw: unknown): PostToolUseEvent {
    throw new Error("Kiro does not support hooks (yet)");
  }

  parsePreCompactInput(_raw: unknown): PreCompactEvent {
    throw new Error("Kiro does not support hooks (yet)");
  }

  parseSessionStartInput(_raw: unknown): SessionStartEvent {
    throw new Error("Kiro does not support hooks (yet)");
  }

  // ── Response formatting ────────────────────────────────
  // Kiro does not support hooks. Return undefined for all responses.

  formatPreToolUseResponse(_response: PreToolUseResponse): unknown {
    return undefined;
  }

  formatPostToolUseResponse(_response: PostToolUseResponse): unknown {
    return undefined;
  }

  formatPreCompactResponse(_response: PreCompactResponse): unknown {
    return undefined;
  }

  formatSessionStartResponse(_response: SessionStartResponse): unknown {
    return undefined;
  }

  // ── Configuration ──────────────────────────────────────

  getSettingsPath(): string {
    return resolve(homedir(), ".kiro", "settings", "mcp_config.json");
  }

  getSessionDir(): string {
    const dir = join(homedir(), ".kiro", "context-mode", "sessions");
    mkdirSync(dir, { recursive: true });
    return dir;
  }

  getSessionDBPath(projectDir: string): string {
    const hash = createHash("sha256")
      .update(projectDir)
      .digest("hex")
      .slice(0, 16);
    return join(this.getSessionDir(), `${hash}.db`);
  }

  getSessionEventsPath(projectDir: string): string {
    const hash = createHash("sha256")
      .update(projectDir)
      .digest("hex")
      .slice(0, 16);
    return join(this.getSessionDir(), `${hash}-events.md`);
  }

  generateHookConfig(_pluginRoot: string): HookRegistration {
    return {};
  }

  readSettings(): Record<string, unknown> | null {
    try {
      const raw = readFileSync(this.getSettingsPath(), "utf-8");
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  writeSettings(settings: Record<string, unknown>): void {
    const settingsPath = this.getSettingsPath();
    mkdirSync(dirname(settingsPath), { recursive: true });
    writeFileSync(settingsPath, JSON.stringify(settings, null, 2), "utf-8");
  }

  // ── Diagnostics (doctor) ─────────────────────────────────

  validateHooks(_pluginRoot: string): DiagnosticResult[] {
    return [
      {
        check: "Hook support",
        status: "warn",
        message:
          "Kiro does not support hooks (yet). " +
          "Only MCP integration is available.",
      },
    ];
  }

  checkPluginRegistration(): DiagnosticResult {
    try {
      const raw = readFileSync(this.getSettingsPath(), "utf-8");
      const config = JSON.parse(raw);
      const mcpServers = config?.mcpServers ?? {};

      if ("context-mode" in mcpServers) {
        return {
          check: "MCP registration",
          status: "pass",
          message: "context-mode found in mcpServers config",
        };
      }

      return {
        check: "MCP registration",
        status: "fail",
        message: "context-mode not found in mcpServers",
        fix: "Add context-mode to mcpServers in ~/.kiro/settings/mcp_config.json",
      };
    } catch {
      return {
        check: "MCP registration",
        status: "warn",
        message: "Could not read ~/.kiro/settings/mcp_config.json",
      };
    }
  }

  getInstalledVersion(): string {
    try {
      const pkgPath = resolve(
        homedir(),
        ".kiro",
        "extensions",
        "context-mode",
        "package.json",
      );
      const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
      return pkg.version ?? "unknown";
    } catch {
      return "not installed";
    }
  }

  // ── Upgrade ────────────────────────────────────────────

  configureAllHooks(_pluginRoot: string): string[] {
    return [];
  }

  backupSettings(): string | null {
    const settingsPath = this.getSettingsPath();
    try {
      accessSync(settingsPath, constants.R_OK);
      const backupPath = settingsPath + ".bak";
      copyFileSync(settingsPath, backupPath);
      return backupPath;
    } catch {
      return null;
    }
  }

  setHookPermissions(_pluginRoot: string): string[] {
    return [];
  }

  updatePluginRegistry(_pluginRoot: string, _version: string): void {
    // Kiro plugin registry is managed via mcp_config.json
  }

  // ── Routing Instructions (soft enforcement) ────────────

  getRoutingInstructionsConfig(): RoutingInstructionsConfig {
    return {
      fileName: "KIRO.md",
      globalPath: resolve(homedir(), ".kiro", "KIRO.md"),
      projectRelativePath: "KIRO.md",
    };
  }

  writeRoutingInstructions(projectDir: string, pluginRoot: string): string | null {
    const config = this.getRoutingInstructionsConfig();
    const targetPath = resolve(projectDir, config.projectRelativePath);
    const sourcePath = resolve(pluginRoot, "configs", "kiro", config.fileName);

    try {
      const content = readFileSync(sourcePath, "utf-8");

      try {
        const existing = readFileSync(targetPath, "utf-8");
        if (existing.includes("context-mode")) return null;
        writeFileSync(targetPath, existing.trimEnd() + "\n\n" + content, "utf-8");
        return targetPath;
      } catch {
        writeFileSync(targetPath, content, "utf-8");
        return targetPath;
      }
    } catch {
      return null;
    }
  }

  getRoutingInstructions(): string {
    const instructionsPath = resolve(
      dirname(fileURLToPath(import.meta.url)),
      "..",
      "..",
      "..",
      "configs",
      "kiro",
      "KIRO.md",
    );
    try {
      return readFileSync(instructionsPath, "utf-8");
    } catch {
      return "# context-mode\n\nUse context-mode MCP tools (execute, execute_file, batch_execute, fetch_and_index, search) instead of run_command/view_file for data-heavy operations.";
    }
  }
}
