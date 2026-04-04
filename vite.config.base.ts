import { UserConfig } from "vite";
import dts from "vite-plugin-dts";
import { resolve } from "path";

export const getBaseConfig = (pkgDir: string, libName: string): UserConfig => {
  const isInternal = pkgDir.includes("internal");
  const isPro = /virtualizer/i.test(libName);

  let banner = "";
  const uiLibraryName = `Missing JS`;
  const myName = `AJK-Essential`;
  const copyrightYear = 2026;

  if (isInternal) {
    banner = `/** ${uiLibraryName} - Internal Module: ${libName} (Proprietary) */`;
  } else if (isPro) {
    banner = `/**
 * ${uiLibraryName} - ${libName} (Pro)
 * @license PolyForm Noncommercial 1.0.0
 * Copyright (c) ${copyrightYear} ${uiLibraryName} / ${myName}.
 * ---------------------------------------------------------
 * This version is for non-commercial use only.
 * Commercial license required for for-profit entities.
 * Sunset Clause: Automatically transitions to MIT after Jan 1, 2029.
 * Licensing: Purchase link will be updated soon
 */`;
  } else {
    banner = `/**
 * ${uiLibraryName} - ${libName}
 * @license MIT
 * Copyright (c) ${copyrightYear} ${uiLibraryName} / ${myName}.
 * ---------------------------------------------------------
 * Licensed under the MIT License.
 * Free for personal and commercial use.
 */`;
  }

  return {
    // 1. Tell esbuild to keep the header during minification
    esbuild: {
      legalComments: "inline",
    },
    build: {
      lib: {
        entry: resolve(pkgDir, "src/index.ts"),
        name: libName,
        fileName: "index",
        formats: ["es"],
      },
      rollupOptions: {
        output: {
          banner: banner,
          preserveModules: false,
        },
        external: [/^lit/, /^@missing-js/],
      },
      minify: "esbuild",
      sourcemap: true,
    },
    plugins: [
      {
        name: "force-banner",
        renderChunk(code) {
          return `${banner}\n${code}`;
        },
      },
      dts({
        root: pkgDir,
        entryRoot: resolve(pkgDir, "src"),
        outDir: resolve(pkgDir, "dist"),
        // FIX: 'banner' doesn't exist here. Use 'afterBuild' if needed,
        // but usually we just want the header in the bundled .d.ts
        rollupTypes: false,
        include: [resolve(pkgDir, "src/**/*.ts")],
        // This is the correct way to add a banner to .d.ts files in some versions,
        // but if it fails, simply remove this specific line.
        compilerOptions: {
          declaration: true,
        },
      }),
    ],
  };
};
