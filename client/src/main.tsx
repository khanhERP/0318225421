import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setupFetchInterceptor } from "./setupFetchInterceptor";

// 🔧 Cài middleware cho toàn app
setupFetchInterceptor();

createRoot(document.getElementById("root")!).render(<App />);
