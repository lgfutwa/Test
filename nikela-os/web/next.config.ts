import type { NextConfig } from 'next'

/**
 * Nikela-OS front end configuration.
 *
 * The audience is Android-heavy and data-constrained, so builds stay lean:
 * no image optimisation service dependency, and strict React checks in dev.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  agentRules: false,
  images: {
    unoptimized: true,
  },
}

export default nextConfig
