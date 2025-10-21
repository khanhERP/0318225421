// src/utils/fetcher.js
export async function defaultFetcher({ queryKey }) {
  const [url] = queryKey;
  const token = localStorage.getItem("authToken");

  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
  });

  if (res.status === 401) {
    console.warn("Token hết hạn hoặc không hợp lệ");
    localStorage.removeItem("authToken");
    window.location.href = "/";
    return;
  }

  if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);

  return res.json();
}
