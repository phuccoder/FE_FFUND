import axios from "axios";

const checkAuth = async () => {
    const accessToken = localStorage.getItem("accessToken");
    const refreshToken = localStorage.getItem("refreshToken");
    const userRole = localStorage.getItem("role");

    const PUBLIC_ROUTES = ["login", "forgot-password", "auth/reset-password", "register", "documentation"];
    const isPublicPage = PUBLIC_ROUTES.some(r => window.location.href.includes(r));

    if (!accessToken && !isPublicPage) {
        window.location.href = "/login";
        return;
    }

    // ✅ Kiểm tra role, nếu không phải ADMIN thì chuyển hướng về login
    if (userRole !== "ADMIN" && !isPublicPage) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("role");
        window.location.href = "/login";
        return;
    }

    // ✅ Thiết lập Bearer Token cho tất cả request
    axios.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;

    // ✅ Thêm Interceptor để tự động làm mới Token khi hết hạn
    axios.interceptors.response.use(
        (response) => {
            document.body.classList.remove("loading-indicator");
            return response;
        },
        async (error) => {
            document.body.classList.remove("loading-indicator");

            if (error.response && error.response.status === 401) {
                console.warn("Access Token expired! Attempting to refresh...");

                if (!refreshToken) {
                    console.error("No refresh token found. Redirecting to login.");
                    window.location.href = "/login";
                    return Promise.reject(error);
                }

                try {
                    // 🛠 Gửi request làm mới token
                    const refreshResponse = await axios.post("http://localhost:8080/api/v1/auth/refresh", {
                        refreshToken: refreshToken
                    });

                    const newAccessToken = refreshResponse.data.accessToken;
                    localStorage.setItem("accessToken", newAccessToken);
                    axios.defaults.headers.common["Authorization"] = `Bearer ${newAccessToken}`;

                    // Gửi lại request gốc sau khi làm mới token
                    error.config.headers["Authorization"] = `Bearer ${newAccessToken}`;
                    return axios(error.config);
                } catch (refreshError) {
                    console.error("Refresh Token failed. Redirecting to login.");
                    localStorage.removeItem("accessToken");
                    localStorage.removeItem("refreshToken");
                    localStorage.removeItem("role");
                    window.location.href = "/login";
                    return Promise.reject(refreshError);
                }
            }

            return Promise.reject(error);
        }
    );

    return accessToken;
};

export default checkAuth;
