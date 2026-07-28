/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@zod-ai/shared-types", "@zod-ai/db", "@zod-ai/github"],
  eslint: {
    dirs: ["app", "lib", "components"],
  },
  webpack: (config, { dev }) => {
    // `next dev`'s Watchpack file watcher can hit EMFILE on machines/sandboxes
    // with a large monorepo tree and a low open-file-descriptor limit, which
    // has been observed to silently break App Router route discovery (a
    // request to `/` falls through to Next's bare default 404 instead of the
    // marketing route). Excluding directories that never contain source we
    // care about reduces the number of watched descriptors. If this alone
    // isn't enough on a given machine, raise the shell's `ulimit -n` (see
    // SETUP.md).
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: ["**/node_modules/**", "**/.git/**", "**/.next/**"],
      };
    }
    return config;
  },
};

export default nextConfig;
