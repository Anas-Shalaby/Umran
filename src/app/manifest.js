export default function manifest() {
  return {
    name: "منصة عُمران لبناء التركيز",
    short_name: "عُمران",
    description:
      "منصة تبسيطية مبرمجة سلوكياً لمساعدتك على دك التشتت وإدارة ثغور يومك.",
    start_url: "/dashboard", // التطبيق يفتح مباشرة على الداشبورد لما يضغطوا على الأيقونة
    display: "standalone", // يفتح شاشة كاملة كأنه أبلكيشن حقيقي بدون شريط المتصفح
    background_color: "#ffffff", // للـ Light mode، سيتغير حسب ثيم الجهاز
    theme_color: "#09090b", // لون شريط الحالة العلوي في الموبايل (zinc-950)
    dir: "rtl",
    lang: "ar",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
