# BrandBuilder Dashboard

تطوير واجهة لوفابيل (Lovable) كـ Prototype / Frontend Only (بدون ربط بقاعدة بيانات أو خلفية برمجية) هو خيار ممتاز لاستعراض التصميم، تجربة المستخدم (UX)، وعرض الفكرة على المستثمرين أو العملاء قبل البدء بالتطوير الفعلي.

فيما يلي الملخص الكامل للمشروع ومكونات التصميم الواجب إدراجها داخل Lovable:

💡 فكرة المشروع المخصصة للتصميم

نظام تذاكر SaaS موجه للشركات (White-Label) يتميز بـ:

تصميم عصري وديناميكي: يدعم Dark Mode بلمسة واحدة.

قابل للتخصيص الكامل (White-Labeling): واجهة تتيح معاينة ألوان وهويّة الشركة وشعارها فوراً في جميع الشاشات.

تجربة مستخدم سريعة (Stateless Prototype): استخدام الـ Local State أو بيانات تجريبية (Mock Data) لمحاكاة الحفظ والبحث دون الحاجة لرابط backend.

🎨 الهيكل البصري وشاشات النظام (UI Components Structure)

1️⃣ شاشة تقديم التذكرة (Submit Ticket Form)

تضم الحقول المطلوبة مع تنسيق متناسق ومستجيب (Responsive Design):

الأهمية (Priority Badge Selector):

🚨 عاجلة (أحمر/Danger Badge)

⚠️ متوسطة (أصفر/Warning Badge)

ℹ️ عادية (أزرق أو رمادي/Info Badge)

القائمة المنسدلة للفرع (Branch Select): اختيار الفرع من قائمة وهمية.

رقم الاتصال بالكمبيوتر (PC Connection/IP): حقل نصي.

التحويلة / رقم الجوال (Extension / Mobile): حقل أرقام.

وصف المشكلة (Problem Description): مربع نص واسع (Textarea).

إرفاق صورة (Attachment Dropzone): منطقة سحب وإسقاط (Drag & Drop) ملفتة بصرياً.

زر الإرسال (Submit Button): يظهر تنبيهاً شكلياً (Toast Notification) برقم تذكرة عشوائي مثل (TCK-8821).

2️⃣ شاشة ودجت متابعة الطلب (Quick Ticket Tracking)

مربع بحث سريع: في الهيدر أو الصفحة الرئيسية يضم input مدخلات زر "متابعة الطلب".

شاشة نتيجة المتابعة (Mock Status View): عند كتابة أي رقم والضغط على متابعة، يظهر كرت أنيق يعرض حالة التذكرة بخيارات تجريبية:

🟡 جاري المتابعة (In Progress)

🟢 تم الحل (Resolved)

⚪ مغلقة (Closed) مع خط زمني شكلي (Stepper Timeline) يوضح مراحل التذكرة.

3️⃣ لوحة التحكم واستعراض التذاكر (Admin & Agent Dashboard)

صفحة تحكم نموذجية تحتوي على:

بطاقات الإحصائيات (Stat Cards):

إجمالي التذاكر | المفتوحة | قيد المعالجة | المغلقة.

جدول التذاكر (Tickets Table): عرض التذاكر مع ألوان تمييز حسب درجة الأهمية، ورقم التذكرة، والفرع، مع زر لإدارة التذكرة.

4️⃣ لوحة تخصيص الهوية والتصميم (White-Labeling & Customization Panel)

هذه أهم شاشة في نموذج Lovable، حيث تمكّن المستخدم من تجربة تغيير أشكال النظام فورياً:

منتقي الألوان (Color Pickers):

اللون الرئيسي (Primary Color).

اللون الثانوي (Secondary Color).

مُبدل الثيم (Dark / Light Mode Toggle): زر تبديل سلس أعلى الصفحة.

رفع الشعار والنصوص (Logo & Text Settings):

رفع logo تجريبي لتحديث الهيدر فوراً.

حقل لتغيير اسم الشركة والعنوان الترحيبي.

🛠️ كيف تبني هذا التصميم في Lovable (التعليمات المباشرة للمُنشئ)

يمكنك نسخ وتوجيه هذا النص (Prompt) مباشرة إلى Lovable Prompt Engine لبناء الواجهة فوراً:

Plaintext

Build a modern White-Label SaaS IT Helpdesk & Ticket Management System (Frontend Only, no backend or database) in React with Tailwind CSS and Dark Mode support.

Key Features & UI Structure:

1. Dynamic Branding Customizer (White-Label Settings Sidepanel):
- Color pickers for Primary and Secondary theme colors that instantly update CSS variables across the whole interface.
- Theme Switcher (Dark/Light Mode).
- Company Name & Logo Uploader mockup that live-updates the Navigation Header.

2. Submit Ticket Page:
- Clean card layout with inputs for:
  * Priority (Urgent [Red], Medium [Yellow], Normal [Blue])
  * Branch selection
  * Computer Connection IP / PC Number
  * Phone extension / Mobile number
  * Problem Description (Textarea)
  * File/Image Upload Box
- On Submit click, simulate a response popup (Toast) showing a generated tracking ID (e.g., TCK-9941).

3. Fast Ticket Tracker Component:
- Search box accepting a Ticket ID.
- Displays a status timeline card with mock statuses (In Progress, Resolved, Closed) and details.

4. Admin Dashboard View:
- Top metrics cards (Total Tickets, Open, Resolved).
- Interactive mock data table listing submitted tickets with filtering capabilities by Priority and Status.

Design Style: Clean corporate SaaS look, smooth transitions, high contrast dark mode, fully localized in Arabic (RTL layout).


📊 كود تجريبي لوحدة تحكم التخصيص والألوان (React / Tailwind)

هذا الكود يوضح كفاءة تطبيق خيار White-Labeling محلياً عبر state دون نود أو قاعدة بيانات:

JavaScript

import React, { useState } from 'react';

export default function WhiteLabelDemo() {
  const [primaryColor, setPrimaryColor] = useState('#2563eb'); // الأزرق الافتراضي
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [companyName, setCompanyName] = useState('شركتي للتكنولوجيا');

  return (
    <div className={isDarkMode ? 'dark bg-gray-900 text-white' : 'bg-gray-50 text-gray-800'} style={{ dir: 'rtl' }}>
      
      {/* Navbar with Dynamic Styles */}
      <nav className="p-4 shadow-md flex justify-between items-center border-b dark:border-gray-800">
        <h1 className="text-xl font-bold" style={{ color: primaryColor }}>
          {companyName}
        </h1>
        
        <button 
          onClick={() => setIsDarkMode(!isDarkMode)} 
          className="p-2 border rounded-lg dark:bg-gray-800">
          {isDarkMode ? '☀️ الوضع النهاري' : '🌙 الوضع الليلي'}
        </button>
      </nav>

      {/* Main Container */}
      <div className="p-8 max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* White-Label Control Panel */}
        <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow border dark:border-gray-700">
          <h2 className="font-bold mb-4">تخصيص الهوية (White-Label)</h2>
          
          <label className="block text-sm mb-1">اسم الشركة:</label>
          <input 
            type="text" 
            value={companyName} 
            onChange={(e) => setCompanyName(e.target.value)}
            className="w-full mb-3 p-2 border rounded dark:bg-gray-700 dark:text-white"
          />

          <label className="block text-sm mb-1">اللون الرئيسي:</label>
          <input 
            type="color" 
            value={primaryColor} 
            onChange={(e) => setPrimaryColor(e.target.value)}
            className="w-full h-10 mb-3 cursor-pointer rounded"
          />
        </div>

        {/* Live Preview Card */}
        <div className="md:col-span-2 p-6 bg-white dark:bg-gray-800 rounded-xl shadow border dark:border-gray-700">
          <h2 className="text-lg font-bold mb-2">معاينة النظام والتذاكر</h2>
          <p className="text-sm text-gray-500 mb-4 dark:text-gray-400">هكذا سيشاهد الموظفون الواجهة بناءً على ألوانك المختارة.</p>

          <button 
            style={{ backgroundColor: primaryColor }} 
            className="text-white px-6 py-2 rounded-lg font-bold shadow hover:opacity-90">
            إرسال تذكرة جديدة
          </button>
        </div>

      </div>
    </div>
  );
}

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/0ea35464-4366-4fbb-82c3-d3352d37ad72).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
