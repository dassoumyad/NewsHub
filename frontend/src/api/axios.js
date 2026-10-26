import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
  headers: { "Content-Type": "application/json" },
});

export const imageUrl = (image) => {
  if (!image) return "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=85";
  if (/^https?:\/\//i.test(image)) return image;
  return `${api.defaults.baseURL}/uploads/${image}`;
};

export const getErrorMessage = (error) => error.response?.data?.errors?.[0]?.msg || error.response?.data?.message || "Something went wrong. Please try again.";
export default api;
