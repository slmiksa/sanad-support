نظام سند للدعم الفني — النشر على استضافة عادية (بدون Node)
==========================================================

النسخة الثابتة (Static SPA) تعمل على أي استضافة تدعم Apache/Nginx فقط،
كل المنطق يتم في المتصفح مباشرة مع Supabase.

1) المتطلبات
------------
- Node.js على جهازك أو على السيرفر (للبناء فقط، ليس للتشغيل)
- ملف .env في جذر المشروع يحتوي:

  VITE_SUPABASE_URL=https://xxxx.supabase.co
  VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx

2) البناء
---------
  npm install
  npm run build:static

الناتج: مجلد dist/ يحتوي index.html + assets + .htaccess

3) الرفع
--------
  cp -r dist/* /home/your-domain.com/public_html/

تأكد أن ملف .htaccess انتقل أيضاً (ملف مخفي):
  cp dist/.htaccess /home/your-domain.com/public_html/

4) ملاحظات
----------
- ملف .htaccess ضروري ليعمل التوجيه الداخلي (مسارات مثل /c/company/admin).
- إن كنت على Nginx استخدم بدلاً منه:
    location / { try_files $uri $uri/ /index.html; }
- إعادة تعيين كلمة مرور الأعضاء تتم عبر رابط يُرسل لبريد العضو.
- تأكد من إضافة رابط موقعك في Supabase > Authentication > URL Configuration
  ضمن Site URL و Redirect URLs.
