import { describe, it, expect } from "vitest";
import { routePreToolUse } from "../../hooks/core/routing.mjs";
import { ROUTING_BLOCK } from "../../hooks/routing-block.mjs";

describe("Routing: Subagents (Agent only — Task removed per #241)", () => {
  it("Agent tool injects routing block into prompt field", () => {
    const fields = ["prompt", "request", "objective", "question", "query", "task"];

    for (const field of fields) {
      const toolInput = { [field]: "hello" };
      const decision = routePreToolUse("Agent", toolInput, "/test");

      expect(decision.action).toBe("modify");
      expect(decision.updatedInput[field]).toBe("hello" + ROUTING_BLOCK);
    }
  });

  it("Agent falls back to 'prompt' field if no known field is present", () => {
    const toolInput = { unknown_field: "content" };
    const decision = routePreToolUse("Agent", toolInput, "/test");

    expect(decision.action).toBe("modify");
    expect(decision.updatedInput.prompt).toBe(ROUTING_BLOCK);
  });

  it("Agent converts subagent_type='Bash' to 'general-purpose'", () => {
    const toolInput = {
      prompt: "do something",
      subagent_type: "Bash"
    };
    const decision = routePreToolUse("Agent", toolInput, "/test");

    expect(decision.action).toBe("modify");
    expect(decision.updatedInput.prompt).toBe("do something" + ROUTING_BLOCK);
    expect(decision.updatedInput.subagent_type).toBe("general-purpose");
  });

  it("Agent preserves other fields when modifying", () => {
    const toolInput = {
      request: "analyze this",
      other_param: 123,
      nested: { a: 1 }
    };
    const decision = routePreToolUse("Agent", toolInput, "/test");

    expect(decision.action).toBe("modify");
    expect(decision.updatedInput.request).toBe("analyze this" + ROUTING_BLOCK);
    expect(decision.updatedInput.other_param).toBe(123);
    expect(decision.updatedInput.nested).toEqual({ a: 1 });
  });

  it("Task tool is NOT routed — returns null (passthrough) (#241)", () => {
    const toolInput = { prompt: "create a task" };
    const decision = routePreToolUse("Task", toolInput, "/test");

    // Task should not be intercepted — it matches TaskCreate/TaskUpdate via substring
    expect(decision).toBeNull();
  });

  it("TaskCreate is NOT routed — returns null (passthrough)", () => {
    const decision = routePreToolUse("TaskCreate", { title: "my task" }, "/test");
    expect(decision).toBeNull();
  });

  it("TaskUpdate is NOT routed — returns null (passthrough)", () => {
    const decision = routePreToolUse("TaskUpdate", { id: "123", status: "done" }, "/test");
    expect(decision).toBeNull();
  });
});
