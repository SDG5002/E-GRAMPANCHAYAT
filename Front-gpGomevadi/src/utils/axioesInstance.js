import axios from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    "gp-name": import.meta.env.VITE_GP_NAME,
  },
});

export default axiosInstance;
