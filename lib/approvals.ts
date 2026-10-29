import { getPending, updatePending } from "./db";
import { executeApproved } from "./tools";

export async function decide(id: string, decision: "approve" | "reject") {
  const item = getPending(id);
  if (!item) throw new Error("Action not found");
  if (item.status !== "pending") throw new Error(`Already ${item.status}`);

  if (decision === "reject") return updatePending(id, { status: "rejected" });

  try {
    const result = await executeApproved(item.tool, item.args);
    return updatePending(id, { status: "approved", result });
  } catch (err: any) {
    return updatePending(id, { status: "failed", result: { error: String(err.message ?? err) } });
  }
}