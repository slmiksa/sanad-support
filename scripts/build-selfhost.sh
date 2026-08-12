#!/usr/bin/env bash
# ==========================================================
#  نظام سند للدعم الفني — سكربت بناء النسخة الذاتية (Node.js)
#  الاستخدام:  bash scripts/build-selfhost.sh
#  الناتج:     مجلد dist/ جاهز للنسخ إلى السيرفر
#  ثم على السيرفر:  cp -r dist/* /home/xxxxx.com/public_html/
# ==========================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "==> 1/4 تثبيت الاعتماديات"
if command -v bun >/dev/null 2>&1; then
  bun install
else
  npm install
fi

echo "==> 2/4 بناء المشروع بهدف Node.js"
rm -rf .output dist
export NITRO_PRESET="node-server"
if command -v bun >/dev/null 2>&1; then
  bun run build
else
  npm run build
fi

if [ ! -f ".output/server/index.mjs" ]; then
  echo "!! فشل البناء: لم يتم إنشاء .output/server/index.mjs" >&2
  exit 1
fi

echo "==> 3/4 تجهيز مجلد dist"
mkdir -p dist
cp -r .output/server dist/server
cp -r .output/public dist/public

# ملف تشغيل الخادم
cat > dist/start.sh <<'EOS'
#!/usr/bin/env bash
# تشغيل نظام سند
set -euo pipefail
cd "$(dirname "$0")"
[ -f .env ] && set -a && . ./.env && set +a
export PORT="${PORT:-3000}"
export HOST="${HOST:-0.0.0.0}"
exec node server/index.mjs
EOS
chmod +x dist/start.sh

# نقطة دخول بديلة لبعض لوحات التحكم (cPanel Node.js App)
cat > dist/app.js <<'EOS'
// نقطة الدخول لتطبيق Node على cPanel / Passenger
import "./server/index.mjs";
EOS

cat > dist/package.json <<'EOS'
{
  "name": "sanad-helpdesk",
  "private": true,
  "type": "module",
  "main": "app.js",
  "scripts": { "start": "node server/index.mjs" }
}
EOS

# مثال متغيرات البيئة (املأها على السيرفر باسم .env)
cat > dist/.env.example <<'EOS'
# انسخ هذا الملف باسم .env على السيرفر واملأ القيم
PORT=3000
HOST=0.0.0.0
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
EOS

cat > dist/README-DEPLOY.txt <<'EOS'
نظام سند للدعم الفني — خطوات النشر على السيرفر (Node.js)
=========================================================
1) انسخ محتويات المجلد:
   cp -r dist/* /home/xxxxx.com/public_html/

2) ادخل مجلد الموقع وأنشئ ملف .env من المثال:
   cd /home/xxxxx.com/public_html
   cp .env.example .env  &&  nano .env
   (املأ SUPABASE_URL و SUPABASE_PUBLISHABLE_KEY و SUPABASE_SERVICE_ROLE_KEY)

3) التشغيل:
   - يدوياً:        bash start.sh
   - أو مع pm2:     pm2 start server/index.mjs --name sanad
   - أو cPanel:     Setup Node.js App
                    Application root = مجلد الموقع
                    Startup file     = app.js
                    ثم أضف متغيرات البيئة من واجهة cPanel

4) وجّه الدومين للمنفذ (إن لم تستخدم cPanel Node App) عبر Reverse Proxy:
   ProxyPass        /  http://127.0.0.1:3000/
   ProxyPassReverse /  http://127.0.0.1:3000/

ملاحظة: النظام يحتاج تشغيل Node لأن فيه دوال خادم
(إنشاء الشركات والعضويات وتصفير كلمات المرور) ولا يكفي رفع ملفات ثابتة.
EOS

echo "==> 4/4 تم"
du -sh dist 2>/dev/null || true
echo "الناتج جاهز في: $ROOT/dist"
