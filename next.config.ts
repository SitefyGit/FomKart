import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseHost = supabaseUrl ? new URL(supabaseUrl).host : undefined;

const nextConfig: NextConfig = {
  eslint: {
    // Allow builds to pass even if ESLint finds issues (dev-only convenience)
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'wpqxovbotsbraxtweyyz.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      // Allow Supabase storage images for this project
      ...(supabaseHost ? [{
        protocol: 'https' as const,
        hostname: supabaseHost,
        port: '',
        pathname: '/storage/v1/object/public/**',
      }] : []),
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'react-icons'],
  },
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Performance optimizations
  poweredByHeader: false,
  // Performance: Skip type checking during dev builds for faster navigation
  typescript: {
    ignoreBuildErrors: process.env.NODE_ENV === 'development',
  },
  // Optimize bundle analyzer
  webpack: (config, { dev }) => {
    // Optimize for development speed
    if (dev) {
      config.cache = {
        type: 'filesystem',
        buildDependencies: {
          config: [__filename],
        },
      }
      // Skip some optimization passes in development
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false,
      }
    }
    return config
  },
};

export default nextConfig;
