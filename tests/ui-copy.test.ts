import { test } from "node:test";
import assert from "node:assert/strict";
import { translateLegacy, UI_VI_COPY } from "../src/lib/ui-copy";

test("the main LifeOS modules have stable Vietnamese and English UI labels",()=>{
  const labels=[
    ["Dashboard","Tổng quan"],["Quick Capture","Ghi nhanh"],
    ["Projects & Threads","Dự án và nhóm công việc"],
    ["Reviews & Reflections","Đánh giá và nhìn lại"],
    ["Master Calendar","Lịch tổng hợp"],
    ["Focus & Deep Work","Tập trung và làm việc sâu"],
    ["Scientific Insights","Phân tích khoa học"],
    ["PostgreSQL (Supabase cloud)","PostgreSQL (đám mây Supabase)"],
    ["Create new task","Tạo công việc mới"],
    ["Save","Lưu"],["Cancel","Hủy"],
    ["No data available","Chưa có dữ liệu"],
  ] as const;
  for(const [en,vi] of labels) {
    assert.equal(translateLegacy("vi",en),vi);
    assert.equal(translateLegacy("en",en),en);
  }
});
test("personal notes and unknown strings are never auto-translated or mutated",()=>{
  const note="My English course 2026";
  assert.equal(translateLegacy("vi",note),note);
  assert.equal(translateLegacy("en",note),note);
});
test("translation source is a nonempty keyed dictionary with no blank Vietnamese strings",()=>{
  assert.ok(Object.keys(UI_VI_COPY).length>450);
  for(const [english,vietnamese] of Object.entries(UI_VI_COPY)){
    assert.ok(english.trim().length>0);
    assert.ok(vietnamese.trim().length>0);
  }
});
