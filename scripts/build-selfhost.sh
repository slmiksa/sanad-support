#!/usr/bin/env bash
# ==========================================================
#  نظام سند للدعم الفني — سكربت بناء النسخة الذاتية (Node.js)
#  الاستخدام على سيرفرك:  bash scripts/build-selfhost.sh
#  الناتج: مجلد dist/ جاهز للنسخ:
#          cp -a dist/. /home/xxxxx.com/public_html/
# ==========================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

PM="npm"
command -v bun >/dev/null 2>&1 && PM="bun"

echo "==> 1/4 تثبيت الاعتماديات ($PM)"
$PM install

echo "==> 2/4 البناء بهدف Node.js"
rm -rf dist .output
export NITRO_PRESET="node-server"
# نفصل البناء الذاتي عن متغيرات بيئة محرر Lovable حتى لا يفرض هدف Cloudflare.
env -u LOVABLE_SANDBOX -u DEV_SERVER__PROJECT_PATH npx vite build --config vite.config.ts

# Nitro ينشئ نسخة Node داخل .output؛ نوحّد الاسم إلى dist لتبسيط النشر.
if [ -f ".output/server/index.mjs" ]; then
  mv .output dist
fi

if [ ! -f "dist/server/index.mjs" ]; then
  echo "!! فشل البناء: لم يتم العثور على .output/server/index.mjs أو dist/server/index.mjs" >&2
  echo "!! تأكد أنك شغّلت npm run build:selfhost وليس npm run build أو build:static" >&2
  exit 1
fi

# لا يكفي وجود الملف: يجب أن يكون خادم Node فعلياً، لا Cloudflare Worker module.
if ! grep -q 'node-server' dist/nitro.json 2>/dev/null; then
  echo "!! فشل البناء: الناتج ليس بخادم Node.js (Nitro node-server)" >&2
  echo "!! لا ترفع هذا الناتج؛ نقاط OTP والإشعارات لن تعمل." >&2
  exit 1
fi

echo "==> 3/4 تجهيز ملفات التشغيل"

cat > dist/start.sh <<'EOS'
#!/usr/bin/env bash
# تشغيل نظام سند
set -euo pipefail
cd "$(dirname "$0")"
[ -f .env ] && set -a && . ./.env && set +a

missing=()
for name in SUPABASE_URL SUPABASE_SERVICE_ROLE_KEY RESEND_API_KEY; do
  [ -n "${!name:-}" ] || missing+=("$name")
done
if [ "${#missing[@]}" -gt 0 ]; then
  echo "متغيرات الخادم الناقصة: ${missing[*]}" >&2
  echo "انسخ .env.example إلى .env وأضف القيم ثم أعد التشغيل." >&2
  exit 1
fi

export PORT="${PORT:-3000}"
export HOST="${HOST:-0.0.0.0}"
exec node server/index.mjs
EOS
chmod +x dist/start.sh

# نقطة دخول بديلة للوحات التحكم (cPanel Node.js App / Passenger)
cat > dist/app.js <<'EOS'
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

cat > dist/.env.example <<'EOS'
# انسخه باسم .env على السيرفر واملأ القيم
PORT=3000
HOST=0.0.0.0
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
EOS

cat > dist/README-DEPLOY.txt <<'EOS'
نظام سند للدعم الفني — النشر على سيرفر Node.js
================================================
1) النسخ (يشمل الملفات المخفية):
   cp -a dist/. /home/xxxxx.com/public_html/

2) متغيرات البيئة:
   cd /home/xxxxx.com/public_html
   cp .env.example .env && nano .env
   (SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY / SUPABASE_SERVICE_ROLE_KEY / RESEND_API_KEY)

3) التشغيل — اختر طريقة:
   - يدوي:   bash start.sh
   - pm2:    pm2 start server/index.mjs --name sanad && pm2 save
   - cPanel: Setup Node.js App
             Application root = مجلد الموقع
             Startup file     = app.js
             ثم أضف المتغيرات من واجهة cPanel واضغط Restart

4) إن شغّلته يدوياً أو عبر pm2، وجّه الدومين للمنفذ:
   ProxyPass        /  http://127.0.0.1:3000/
   ProxyPassReverse /  http://127.0.0.1:3000/

مهم: شغّل نسخة Node هذه، وليس npm run build:static. النسخة الثابتة لا تحتوي
على نقاط API، ولذلك لن تعمل المصادقة الثنائية أو إشعارات البريد منها محلياً.
EOS

echo "==> 4/4 تم"
du -sh dist 2>/dev/null || true
echo "الناتج جاهز في: $ROOT/dist"
