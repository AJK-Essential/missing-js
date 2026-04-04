import { defineConfig } from "vite";
import { getBaseConfig } from "../../vite.config.base";

export default defineConfig(
  // Pass __dirname so Vite knows where this package lives,
  // and the global name for the UMD bundle.
  getBaseConfig(__dirname, "missing-dimension-reporter"),
);
