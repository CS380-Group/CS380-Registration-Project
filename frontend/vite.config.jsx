// vite.config.jsx

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    server: {
        proxy: {
            // Optional: with this, fetch('/api/...') will go to :5000 in dev
            "/api": "http://localhost:5000",
        },
    },
});
