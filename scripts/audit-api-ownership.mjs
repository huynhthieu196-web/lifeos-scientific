/**
 * Conservative static API ownership gate.
 * Not a proof of authorization: it intentionally rejects all database-touching
 * non-auth route modules that do not import the shared per-user verifier.
 */
import fs from "node:fs";
import path from "node:path";

const root = path.join(process.cwd(), "src", "app", "api");
const routeFiles = [];
function walk(folder) {
  for (const e of fs.readdirSync(folder, {withFileTypes:true})) {
    const full = path.join(folder,e.name);
    if (e.isDirectory()) walk(full);
    else if (e.isFile() && /^route\.[jt]s$/.test(e.name)) routeFiles.push(full);
  }
}
walk(root);
const exceptions = new Set([
  "/api/domains", // intentionally public, shared static taxonomy only
  "/api/public-prefs", // public static disabled feature bit
  "/api/seed", // explicitly disabled mutation endpoint
]);
const failures=[];
const reviewed=[];
for (const file of routeFiles) {
  const rel = "/api/" + path.relative(root,path.dirname(file)).replaceAll(path.sep,"/");
  const text = fs.readFileSync(file,"utf8");
  if (!/\bdb\./.test(text)) continue;
  if (rel.startsWith("/api/auth/")) {
    reviewed.push(rel + " (auth special-case: manually review)");
    continue;
  }
  if (exceptions.has(rel)) continue;
  if (!/\bcurrentUserId\s*\(/.test(text)) {
    failures.push(rel + " has DB access but lacks currentUserId(req)");
  }
}
console.log("Scanned",routeFiles.length,"API routes");
console.log("Auth special-case routes:",reviewed.join(", ") || "none");
if (failures.length) {
  console.error("UNSCOPED DATABASE ENDPOINTS:\n" + failures.map(x=>" - "+x).join("\n"));
  process.exitCode=1;
} else {
  console.log("No unguarded non-auth database route modules detected.");
}
