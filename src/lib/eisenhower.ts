export type EisenhowerQuadrant = "do" | "schedule" | "delegate" | "eliminate";
export type EisenhowerTag = { important: boolean; urgent: boolean };
export const QUADRANTS: { key: EisenhowerQuadrant; title: string; description: string; action: string }[] = [
  { key: "do", title: "I · Quan trọng & khẩn cấp", description: "Cần xử lý sớm, tác động lớn hoặc sát hạn", action: "Làm ngay" },
  { key: "schedule", title: "II · Quan trọng & không khẩn cấp", description: "Phát triển dài hạn, cần lên lịch rõ ràng", action: "Lên lịch" },
  { key: "delegate", title: "III · Không quan trọng & khẩn cấp", description: "Kiểm tra có thể giao bớt hoặc xử lý nhanh", action: "Ủy quyền" },
  { key: "eliminate", title: "IV · Không quan trọng & không khẩn cấp", description: "Cân nhắc loại bỏ hoặc hạn chế", action: "Loại bỏ" },
];

export function eisenhowerFromQuadrant(quadrant: EisenhowerQuadrant): EisenhowerTag {
  return {
    important: quadrant === "do" || quadrant === "schedule",
    urgent: quadrant === "do" || quadrant === "delegate",
  };
}

export function quadrantFromEisenhower(metadata: unknown): EisenhowerQuadrant | null {
  if (!metadata || typeof metadata !== "object") return null;
  const v = (metadata as Record<string, unknown>).eisenhower;
  if (!v || typeof v !== "object") return null;
  const tag = v as Record<string, unknown>;
  if (typeof tag.important !== "boolean" || typeof tag.urgent !== "boolean") return null;
  if (tag.important) return tag.urgent ? "do" : "schedule";
  return tag.urgent ? "delegate" : "eliminate";
}

export function eisenhowerMetadata(metadata: unknown, quadrant: EisenhowerQuadrant | null): Record<string, unknown> {
  const base = metadata && typeof metadata === "object" && !Array.isArray(metadata) ? { ...(metadata as Record<string, unknown>) } : {};
  if (quadrant) base.eisenhower = eisenhowerFromQuadrant(quadrant);
  else delete base.eisenhower;
  return base;
}
