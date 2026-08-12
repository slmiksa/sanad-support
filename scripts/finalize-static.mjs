#!/usr/bin/env node
/**
 * بعد بناء النسخة الثابتة: ننقل محتويات dist/client إلى dist مباشرة
 * ونحذف مخرجات الخادم، حتى يصبح الأمر:  cp -r dist/* /path/public_html/
 */
import { existsSync, rmSync, renameSync, readdirSync, cpSync } from "node:fs";
import { join } from "node:path";

const dist = join(process.cwd(), "dist");
const client = join(dist, "client");

if (existsSync(client)) {
  for (const entry of readdirSync(client)) {
    const target = join(dist, entry);
    rmSync(target, { recursive: true, force: true });
    renameSync(join(client, entry), target);
  }
  rmSync(client, { recursive: true, force: true });
}

// حذف أي مخرجات خادم غير مطلوبة للاستضافة العادية
for (const dir of ["server", ".nitro", "_worker.js"]) {
  rmSync(join(dist, dir), { recursive: true, force: true });
}

// نسخة احتياطية من .htaccess في حال لم ينسخها vite
const htaccess = join(process.cwd(), "public", ".htaccess");
if (existsSync(htaccess) && !existsSync(join(dist, ".htaccess"))) {
  cpSync(htaccess, join(dist, ".htaccess"));
}

console.log("\n✅ جاهز: ارفع محتويات مجلد dist/ إلى public_html\n   cp -r dist/* /home/your-domain/public_html/\n");
