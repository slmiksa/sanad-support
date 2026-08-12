// إعدادات بناء النسخة الذاتية (Self-Host) على سيرفر Node.js
// الاستخدام: vite build --config vite.selfhost.config.ts
// الناتج: dist/server/index.mjs  +  dist/client (الملفات الثابتة)
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  nitro: {
    preset: "node-server",
    output: {
      dir: "dist",
      publicDir: "dist/client",
      serverDir: "dist/server",
    },
  },
});
