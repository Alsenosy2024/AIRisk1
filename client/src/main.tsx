import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

document.title = "RiskAI Pro - Risk Management Dashboard";

createRoot(document.getElementById("root")!).render(<App />);
