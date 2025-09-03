import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
        },
    },
});

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <BrowserRouter>
            <QueryClientProvider client={queryClient}>
                <App />
            </QueryClientProvider>
        </BrowserRouter>
        <Toaster
            position="top-center"
            toastOptions={{
                className: "app-toast", // ensure we can target to override mobile styles
                duration: 4000,
                style: {
                    background: "#ffffff",
                    color: "#111827",
                    boxShadow: "0 6px 24px rgba(0,0,0,0.12)",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "0.5rem",
                    fontSize: "0.95rem",
                },
                success: {
                    style: { background: "#ecfdf5", color: "#065f46" },
                },
                error: {
                    style: { background: "#fff1f2", color: "#7f1d1d" },
                },
            }}
        />
    </StrictMode>
);
