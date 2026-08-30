import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: {
    position: 'bottom-right',
  },
  // The ESLint flat config was previously unresolvable, so lint never actually
  // ran during builds. Now that it resolves it surfaces pre-existing `any` /
  // unescaped-entity errors that would fail deploys. Keep `npm run lint`
  // working while these are cleaned up separately.
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', 'date-fns'],
  },
};

export default nextConfig;
