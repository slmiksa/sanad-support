#!/usr/bin/env bash
# ==========================================================
#  نظام سند للدعم الفني — سكربت بناء النسخة الذاتية (Node.js)
#  الاستخدام على سيرفرك:  bash scripts/build-selfhost.sh
#  الناتج: مجلد dist/ جاهز للنسخ:
#          cp -r dist/* /home/xxxxx.com/public_html/
# ==========================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

PM="npm"
command -v bun >/dev/null 2>&1 && PM="bun"

echo "==> 1/4 تثبيت الاعتماديات ($PM)"
$PM install

echo "==> 2/4 البناء بهدف Node.js"
rm -rf dist
export NITRO_PRESET="node-server"
npx vite build --config vite.selfhost.config.ts

if [ ! -f "dist/server/index.mjs" ]; then
  echo "!! فشل البناء: لم يتم إنشاء dist/server/index.mjs" >&2
  exit 1
fi

echo "==> 3/4 تجهيز ملفات التشغيل"

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
EOS

cat > dist/README-DEPLOY.txt <<'EOS'
نظام سند للدعم الفني — النشر على سيرفر Node.js
================================================
1) النسخ:
   cp -r dist/* /home/xxxxx.com/public_html/

2) متغيرات البيئة:
   cd /home/xxxxx.com/public_html
   cp .env.example .env && nano .env
   (SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY / SUPABASE_SERVICE_ROLE_KEY)

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

ملاحظة: النظام يحتاج Node لأن فيه دوال خادم (إنشاء الشركات
والعضويات وتصفير كلمات المرور)؛ رفع ملفات ثابتة فقط لا يكفي.
EOS

echo "==> 4/4 تم"
du -sh dist 2>/dev/null || true
echo "الناتج جاهز في: $ROOT/dist"
