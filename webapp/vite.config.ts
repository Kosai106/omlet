import react from "@vitejs/plugin-react";
import Unfonts from "unplugin-fonts/vite";
import { defineConfig, loadEnv } from "vite";
import checker from "vite-plugin-checker";

const version = process.env.npm_package_version;

// https://vitejs.dev/config/
// eslint-disable-next-line import/no-default-export
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd());

    const fontConfig = {
        custom: {
            families: [{
                name: "Inter",
                local: "Inter",
                src: "./src/frontend/assets/font/Inter-*.woff2",
            }, {
                name: "SpaceMono",
                local: "SpaceMono",
                src: "./src/frontend/assets/font/SpaceMono-*.woff2",
            }],
            preload: false,
            prefetch: true,
            injectTo: "head-prepend" as const,
        },
    };

    const checkerConfig = {
        typescript: true,
        eslint: {
            lintCommand: "eslint ./src --ext .js,.jsx,.ts,.tsx",
        },
    };

    const plugins = [react(), Unfonts(fontConfig)];

    if (env.VITE_CHECKER_DISABLED !== "true") {
        plugins.push(checker(checkerConfig));
    }

    return {
        plugins,
        build: {
            outDir: "dist/frontend",
            sourcemap: true,
        },
        define: {
            "__APP_VERSION__": JSON.stringify(version),
        },
    };
});
