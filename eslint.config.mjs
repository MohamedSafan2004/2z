import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // قرار متعمد: مش مستخدمين next/image في المشروع ده عشان كل الصور بتيجي من
      // Cloudinary بـ f_auto,q_auto مضافة في الرابط نفسه — يعني Cloudinary بيعمل الـ
      // optimization (تحويل صيغة، ضغط ذكي) قبل ما الصورة توصل للمتصفح أصلاً.
      // next/image فوق كده هيعمل double-compression من غير فائدة حقيقية في
      // الجودة، وممكن يستهلك Vercel Image Optimization quota زيادة من غير داعي.
      // القرار ده موثق في الـ memory بتاع المشروع — مش ناقص لم يتعملش معه.
      "@next/next/no-img-element": "off",
    },
  },
]);

export default eslintConfig;
