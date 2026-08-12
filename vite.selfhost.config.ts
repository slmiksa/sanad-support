// إعدادات بناء نسخة ثابتة (Static SPA) لرفعها على أي استضافة عادية (Apache/Nginx)
// الاستخدام: npm run build:static
// الناتج: مجلد dist/ يحتوي index.html + assets + .htaccess
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  // لا نحتاج Nitro لأن المخرجات ملفات ثابتة فقط
  nitro: false,
  tanstackStart: {
    server: { entry: "server" },
    spa: {
      enabled: true,
      maskPath: "/",
      prerender: { outputPath: "/index" },
    },
  },
});
