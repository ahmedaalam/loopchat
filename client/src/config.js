// Dynamic API endpoint configuration
// Reads from Vite environment variable in production, fallback to localhost in dev
export const ENDPOINT = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_ENDPOINT ||
  "http://localhost:5000"
).replace(/\/+$/, "");

export const getFullFileUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
    return url;
  }
  return `${ENDPOINT}${url.startsWith("/") ? "" : "/"}${url}`;
};
