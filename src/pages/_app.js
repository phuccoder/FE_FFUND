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
const MyApp = ({ Component, pageProps }) => {
  return (
    <ContextProvider>
      <AuthProvider>
      <Component {...pageProps} />
      </AuthProvider>
    </ContextProvider>
  );
};

export default MyApp;
