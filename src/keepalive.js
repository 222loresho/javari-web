export function startKeepAlive() {
  const url = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace("/api", "")
    : "https://javari-server.onrender.com";
  const ping = () => fetch(`${url}/api/products/`).catch(() => {});
  ping();
  setInterval(ping, 9 * 60 * 1000);
}