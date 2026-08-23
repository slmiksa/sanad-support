#!/usr/bin/env bash
# نشر نظام سند على استضافة Apache عادية دون حفظ مفاتيح الخادم الحساسة فيها.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET="${SANAD_PUBLIC_HTML:-/home/sanad.lamhasec.com/public_html}"

cd "$ROOT"

if [ ! -d "$TARGET" ]; then
  echo "مجلد الموقع غير موجود: $TARGET" >&2
  exit 1
fi

echo "==> 1/3 تثبيت الاعتماديات"
npm install

echo "==> 2/3 بناء النسخة"
# البريد وOTP يعملان من خادم سند الآمن؛ لا تُحفظ مفاتيح Resend أو Supabase السرية هنا.
export VITE_OTP_API_BASE="https://project--0ea35464-4366-4fbb-82c3-d3352d37ad72-dev.lovable.app"
npm run build:static

if [ ! -f dist/index.html ]; then
  echo "فشل البناء: dist/index.html غير موجود" >&2
  exit 1
fi

echo "==> 3/3 تحديث ملفات الموقع"
mkdir -p "$TARGET"
rm -rf "$TARGET"/*
cp -a dist/. "$TARGET"/

echo "تم نشر نظام سند بنجاح في: $TARGET"
echo "المصادقة الثنائية والإشعارات تستخدم خادم سند الآمن تلقائياً."