export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: "https://sharebus-eg.netlify.app/sitemap.xml",
  };
}