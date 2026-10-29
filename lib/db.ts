import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

export interface PendingAction {
  id: string;
  tool: string;
  args: Record<string, any>;
  summary: string;
  status: "pending" | "approved" | "rejected" | "failed";
  result?: any;
  createdAt: string;
}

const FILE = path.join(process.cwd(), "data", "pending.json");

function load(): PendingAction[] {
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8"));
  } catch {
    return [];
  }
}

function save(items: PendingAction[]) {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(items, null, 2));
}

export function createPending(tool: string, args: Record<string, any>, summary: string) {
  const items = load();
  const item: PendingAction = {
    id: randomUUID(),
    tool,
    args,
    summary,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  items.push(item);
  save(items);
  return item;
}

export function listPending() {
  return load().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getPending(id: string) {
  return load().find((i) => i.id === id);
}

export function updatePending(id: string, patch: Partial<PendingAction>) {
  const items = load();
  const idx = items.findIndex((i) => i.id === id);
  if (idx === -1) return undefined;
  items[idx] = { ...items[idx], ...patch };
  save(items);
  return items[idx];
}