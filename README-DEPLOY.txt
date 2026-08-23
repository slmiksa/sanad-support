نظام سند للدعم الفني — النشر الكامل مع البريد والمصادقة الثنائية
===============================================================

المصادقة الثنائية وإشعارات التذاكر تعمل من نقاط API خادمية. لذلك النسخة
الكاملة تحتاج استضافة Node.js؛ رفع ملفات HTML الثابتة وحدها لا يشغّل البريد.

1) المتطلبات
------------
- Node.js 20 أو أحدث على السيرفر
- ملف .env في جذر المشروع وقت البناء يحتوي قيم VITE التالية:

  VITE_SUPABASE_URL=https://xxxx.supabase.co
  VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx

2) بناء النسخة الكاملة
----------------------
  npm install
  npm run build:selfhost

الناتج: مجلد dist/ يحتوي خادم Node وواجهة الموقع.

إذا انتهى الأمر بعبارة Generated .output/nitro.json فقط، فهذا ناتج البناء
الخام. سكربت build:selfhost ينقل .output تلقائياً إلى dist ويضيف ملفات التشغيل.
يجب أن ترى في النهاية: "الناتج جاهز في: .../dist".
ويتحقق السكربت تلقائياً أن الناتج خادم Node حقيقي؛ إذا ظهر أن الناتج ليس
Nitro node-server فلا ترفع الملفات لأن نقاط البريد لن تعمل.

3) الرفع
--------
  cp -a dist/. /home/your-domain.com/public_html/

أنشئ ملف التشغيل من القالب وأدخل مفاتيح الخادم:
  cd /home/your-domain.com/public_html
  cp .env.example .env
  nano .env

القيم المطلوبة داخل .env:
  SUPABASE_URL=https://xxxx.supabase.co
  SUPABASE_PUBLISHABLE_KEY=...
  SUPABASE_SERVICE_ROLE_KEY=...
  RESEND_API_KEY=...

لا تضع هذه القيم في ملفات الواجهة أو داخل VITE_.

شغّل التطبيق:
  bash start.sh

أو عبر PM2:
  pm2 start server/index.mjs --name sanad
  pm2 save

4) ملاحظات
----------
- وجّه الدومين عبر Reverse Proxy إلى المنفذ 3000.
- في cPanel اختر Setup Node.js App واجعل Startup file = app.js.
- إعادة تعيين كلمة مرور الأعضاء تتم عبر رابط يُرسل لبريد العضو.
- تأكد من إضافة رابط موقعك في Supabase > Authentication > URL Configuration
  ضمن Site URL و Redirect URLs.

تنبيه حول build:static
----------------------
الأمر npm run build:static مخصص للعرض الثابت فقط ولا يحتوي خادم API. عند
استخدامه ستُرسل طلبات البريد تلقائياً إلى خادم المشروع الدائم في Lovable،
ولذلك تعمل المصادقة الثنائية والإشعارات حتى مع استضافة Apache عادية. ويمكن
تغيير عنوان خادم البريد وقت البناء عبر VITE_OTP_API_BASE. للنظام المستقل
بالكامل استخدم دائماً npm run build:selfhost.
