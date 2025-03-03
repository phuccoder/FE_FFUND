import ContextProvider from "@/context/ContextProvider";
import "../../public/assets/vendors/animate.min.css";
import "../../public/assets/vendors/font-awesome.min.css";
import "../../public/assets/vendors/flaticon.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "node_modules/swiper/swiper-bundle.min.css";
import "react-modal-video/css/modal-video.css";

// extra css
import "@/styles/default.css";
import "@/styles/style.css";
import '@/styles/tailwind.css';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from "@/context/AuthContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { ToastContainer } from "react-toastify";
const MyApp = ({ Component, pageProps }) => {
  return (
    <ContextProvider>
      <AuthProvider>
        <NotificationProvider>
          <ToastContainer />
          <Component {...pageProps} />
        </NotificationProvider>
      </AuthProvider>
    </ContextProvider>
  );
};

export default MyApp;
