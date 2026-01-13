export const LOCALES = [
  { name: "en", prefix: "" },     // default English
  { name: "ar", prefix: "/ar" },  // Arabic via Langify
];

export function withLocale(prefix: string, path: string) {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${prefix}${cleanPath}`
    .replace(/\/{2,}/g, "/")
    .replace(/\/$/, "") || "/";
}
