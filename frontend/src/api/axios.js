import axios from "axios";
import { store } from "../app/store";
import { setCredentials, logout } from "../features/auth/authSlice";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// ─── 1. Request Interceptor (لازم يتسجل الأول) ────────────────────────────
api.interceptors.request.use(
  (config) => {
    try {
      const token = store.getState()?.auth?.accessToken;
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.log(e);
      // ignore — store may not be ready
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── 2. Response Interceptor ───────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    // لو مفيش config أو response، مش هنعمل حاجة
    if (!originalRequest || !error.response) {
      return Promise.reject(error);
    }

    // منع الـ loop على endpoint الـ refresh نفسه
    if (originalRequest.url?.includes("/auth/refresh")) {
      store.dispatch(logout());
      return Promise.reject(error);
    }

    // بس نتعامل مع 401، وبس لو مجربناش نعمل retry قبل كده
    if (error.response.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // ─── لو في refresh شغال، نضيف الـ request للـ queue ───────────────────
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      });
    }

    // ─── ابدأ الـ refresh ─────────────────────────────────────────────────
    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = store.getState()?.auth?.refreshToken;

      const res = await api.post("/auth/refresh", { refreshToken });

      const newAccessToken = res.data?.accessToken;

      if (!newAccessToken) {
        throw new Error("No access token in refresh response");
      }

      // حدّث الـ store
      store.dispatch(
        setCredentials({
          user: res.data.user ?? store.getState().auth.user,
          accessToken: newAccessToken,
          refreshToken: res.data.refreshToken ?? store.getState().auth.refreshToken,
        })
      );

      // حل كل الـ requests اللي كانت واقفة
      processQueue(null, newAccessToken);

      // أعد إرسال الـ request الأصلي بالـ token الجديد
      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return api(originalRequest);

    } catch (err) {
      processQueue(err, null);
      store.dispatch(logout());
      return Promise.reject(err);

    } finally {
      isRefreshing = false;
    }
  }
);

export default api;