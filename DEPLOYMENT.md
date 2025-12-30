# 🚀 نشر مجرة الأفكار

## خيار 1: Vercel (موصى به - مجاني) ⭐

Vercel مصمم خصيصاً لـ Next.js وسهل جداً:

### الخطوات:

1. **إنشاء حساب Vercel**
   - اذهب إلى [vercel.com](https://vercel.com)
   - سجل دخول بحساب GitHub

2. **رفع المشروع على GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Galaxy of Thoughts"
   git branch -M main
   git remote add origin https://github.com/USERNAME/galaxy-of-thoughts.git
   git push -u origin main
   ```

3. **ربط المشروع بـ Vercel**
   - اذهب إلى [vercel.com/new](https://vercel.com/new)
   - اختر المشروع من GitHub
   - اضغط **Import**

4. **إضافة Environment Variables**
   في صفحة الإعدادات، أضف:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `OPENAI_API_KEY`
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

5. **Deploy!**
   - اضغط **Deploy**
   - انتظر 2-3 دقائق
   - المشروع جاهز! 🎉

---

## خيار 2: Netlify (بديل جيد)

1. اذهب إلى [netlify.com](https://netlify.com)
2. اربط مع GitHub
3. اختر المشروع
4. أضف Environment Variables
5. Deploy

---

## خيار 3: GitHub Pages (للعرض فقط - بدون قاعدة بيانات)

⚠️ **تحذير**: GitHub Pages لا يدعم API routes، لذا لن تعمل ميزة إضافة النجوم.

### إذا كنت تريد فقط عرض المجرة:

1. **تعديل next.config.mjs**:
   ```js
   /** @type {import('next').NextConfig} */
   const nextConfig = {
     output: 'export',
     images: {
       unoptimized: true,
     },
   };

   export default nextConfig;
   ```

2. **Build المشروع**:
   ```bash
   npm run build
   ```

3. **رفع على GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Static build"
   git branch -M main
   git remote add origin https://github.com/USERNAME/galaxy-of-thoughts.git
   git push -u origin main
   ```

4. **تفعيل GitHub Pages**:
   - اذهب إلى Settings > Pages
   - اختر branch: `main`
   - اختر folder: `/out`
   - Save

---

## 🌟 الخيار الموصى به

**استخدم Vercel** - مجاني، سريع، وبدون مشاكل!

الرابط سيكون: `https://galaxy-of-thoughts.vercel.app`

---

## بعد النشر

- شارك الرابط مع الأصدقاء 🌌
- راقب النجوم الجديدة في Supabase Dashboard
- استمتع! ✨
