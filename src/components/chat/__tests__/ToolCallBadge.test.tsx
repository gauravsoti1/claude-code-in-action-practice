import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolCallBadge } from "../ToolCallBadge";
import type { ToolInvocation } from "ai";

afterEach(() => {
  cleanup();
});

function makeInvocation(
  toolName: string,
  args: Record<string, unknown>,
  state: "call" | "result" = "result"
): ToolInvocation {
  if (state === "result") {
    return { toolCallId: "1", toolName, args, state, result: "OK" } as ToolInvocation;
  }
  return { toolCallId: "1", toolName, args, state } as ToolInvocation;
}

// str_replace_editor labels
test("shows 'Creating <filename>' for str_replace_editor create", () => {
  render(
    <ToolCallBadge
      toolInvocation={makeInvocation("str_replace_editor", {
        command: "create",
        path: "/App.jsx",
      })}
    />
  );
  expect(screen.getByText("Creating App.jsx")).toBeDefined();
});

test("shows 'Editing <filename>' for str_replace_editor str_replace", () => {
  render(
    <ToolCallBadge
      toolInvocation={makeInvocation("str_replace_editor", {
        command: "str_replace",
        path: "/components/Button.tsx",
      })}
    />
  );
  expect(screen.getByText("Editing Button.tsx")).toBeDefined();
});

test("shows 'Editing <filename>' for str_replace_editor insert", () => {
  render(
    <ToolCallBadge
      toolInvocation={makeInvocation("str_replace_editor", {
        command: "insert",
        path: "/utils/helpers.ts",
      })}
    />
  );
  expect(screen.getByText("Editing helpers.ts")).toBeDefined();
});

test("shows 'Reading <filename>' for str_replace_editor view", () => {
  render(
    <ToolCallBadge
      toolInvocation={makeInvocation("str_replace_editor", {
        command: "view",
        path: "/index.tsx",
      })}
    />
  );
  expect(screen.getByText("Reading index.tsx")).toBeDefined();
});

test("shows 'Undoing edit in <filename>' for str_replace_editor undo_edit", () => {
  render(
    <ToolCallBadge
      toolInvocation={makeInvocation("str_replace_editor", {
        command: "undo_edit",
        path: "/App.jsx",
      })}
    />
  );
  expect(screen.getByText("Undoing edit in App.jsx")).toBeDefined();
});

// file_manager labels
test("shows 'Deleting <filename>' for file_manager delete", () => {
  render(
    <ToolCallBadge
      toolInvocation={makeInvocation("file_manager", {
        command: "delete",
        path: "/old-component.jsx",
      })}
    />
  );
  expect(screen.getByText("Deleting old-component.jsx")).toBeDefined();
});

test("shows 'Renaming <filename>' for file_manager rename", () => {
  render(
    <ToolCallBadge
      toolInvocation={makeInvocation("file_manager", {
        command: "rename",
        path: "/Button.jsx",
        new_path: "/Button.tsx",
      })}
    />
  );
  expect(screen.getByText("Renaming Button.jsx")).toBeDefined();
});

// Fallback behavior
test("falls back to tool name for unknown tool", () => {
  render(
    <ToolCallBadge
      toolInvocation={makeInvocation("some_unknown_tool", { command: "do_thing" })}
    />
  );
  expect(screen.getByText("some_unknown_tool")).toBeDefined();
});

test("shows generic label when path is missing", () => {
  render(
    <ToolCallBadge
      toolInvocation={makeInvocation("str_replace_editor", { command: "create" })}
    />
  );
  expect(screen.getByText("Creating file")).toBeDefined();
});

test("falls back to tool name when command is unknown", () => {
  render(
    <ToolCallBadge
      toolInvocation={makeInvocation("str_replace_editor", {
        command: "unknown_command",
        path: "/App.jsx",
      })}
    />
  );
  expect(screen.getByText("str_replace_editor")).toBeDefined();
});

// State indicators
test("shows green dot when state is result with a result value", () => {
  const { container } = render(
    <ToolCallBadge
      toolInvocation={makeInvocation(
        "str_replace_editor",
        { command: "create", path: "/App.jsx" },
        "result"
      )}
    />
  );
  expect(container.querySelector(".bg-emerald-500")).toBeDefined();
  expect(container.querySelector(".animate-spin")).toBeNull();
});

test("shows spinner when state is call", () => {
  const { container } = render(
    <ToolCallBadge
      toolInvocation={makeInvocation(
        "str_replace_editor",
        { command: "create", path: "/App.jsx" },
        "call"
      )}
    />
  );
  expect(container.querySelector(".animate-spin")).toBeDefined();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

// Uses filename from nested path
test("extracts filename from deeply nested path", () => {
  render(
    <ToolCallBadge
      toolInvocation={makeInvocation("str_replace_editor", {
        command: "str_replace",
        path: "/src/components/ui/Card.tsx",
      })}
    />
  );
  expect(screen.getByText("Editing Card.tsx")).toBeDefined();
});
