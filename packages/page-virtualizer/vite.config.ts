import { defineConfig } from "vite";
import { getBaseConfig } from "../../vite.config.base";
import { resolve } from "path";

export default defineConfig(async () => {
  const baseConfig = getBaseConfig(__dirname, "missing-page-virtualizer");

  return {
    ...baseConfig,
    build: {
      ...baseConfig.build,
      rollupOptions: {
        // We ONLY externalize lit.
        external: [/^lit/],
      },
    },
  };
});
