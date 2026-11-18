import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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

test("core screens only use translated keys when calling uiText with literals",()=>{
  const paths=[
    "src/app/login/page.tsx",
    "src/components/life-os/views/dashboard-view.tsx",
    "src/components/life-os/views/insights-view.tsx",
    "src/components/life-os/views/scientific-view.tsx",
    "src/components/life-os/views/settings-view.tsx",
    "src/components/life-os/views/focus-view.tsx",
    "src/components/life-os/views/calendar-view.tsx",
    "src/components/life-os/views/agenda-view.tsx",
    "src/components/life-os/views/projects-view.tsx",
    "src/components/life-os/views/reviews-view.tsx",
    "src/components/life-os/views/inbox-view.tsx",
    "src/components/life-os/views/all-items-view.tsx",
    "src/components/life-os/views/domain-view.tsx",
    "src/components/life-os/views/graph-view.tsx",
    "src/components/life-os/views/sanctuary-view.tsx",
    "src/components/life-os/views/journal-editor-view.tsx",
    "src/components/life-os/analytics-dashboard-panel.tsx",
    "src/components/life-os/item-editor.tsx",
    "src/components/life-os/item-detail-sheet.tsx",
    "src/components/life-os/item-card.tsx",
    "src/components/life-os/quick-capture.tsx",
    "src/components/life-os/topbar.tsx",
    "src/components/life-os/sidebar.tsx",
    "src/components/life-os/shell.tsx",
  ];
  for(const path of paths){
    const file=readFileSync(path,"utf8");
    for(const m of file.matchAll(/uiText\("((?:[^"\\]|\\.)+)"\)/g)){
      const key=JSON.parse('"' + m[1] + '"');
      assert.ok(Object.prototype.hasOwnProperty.call(UI_VI_COPY,key),path+" missing Vietnamese copy for: "+key);
    }
  }
});
test("key dynamic messages and actions have localized text",()=>{
  const messages=[
    "Add task","Quick Capture","Switch to light theme","Switch to dark theme",
    "No results for","Settings saved","2FA enabled","2FA disabled",
    "Break over — back to focus!","Title is required",
    "Item processed","AI analyzed {count} inbox items",
    "Daily goal set to {count} words",
  ];
  for(const text of messages){
    assert.notEqual(translateLegacy("vi",text),text,"missing vi: "+text);
    assert.equal(translateLegacy("en",text),text);
  }
});
