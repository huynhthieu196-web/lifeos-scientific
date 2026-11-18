import { test } from "node:test"; import assert from "node:assert/strict"; import { t, isLocale, DEFAULT_LOCALE } from "../src/lib/i18n";
test("Vietnamese default, English labels and supported locale validation",()=>{
assert.equal(DEFAULT_LOCALE,"vi"); assert.equal(t("vi","eisenhower"),"Ma trận Eisenhower"); assert.equal(t("en","eisenhower"),"Eisenhower Matrix");
assert.equal(isLocale("vi"),true);assert.equal(isLocale("en"),true);assert.equal(isLocale("fr"),false);
});
