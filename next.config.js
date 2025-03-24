/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['cdn.shopify.com', 'res.cloudinary.com'],
    unoptimized: true,
    disableStaticImages: true  // Add this line
  },
  webpack: (config) => {
    config.resolve.fallback = { fs: false };
    
    // Add this configuration for handling static assets
    config.module.rules.push({
      test: /\.(png|jpe?g|gif|svg|webp)$/i,
      use: [
        {
          loader: 'file-loader',
          options: {
            publicPath: '/_next/static/images',
            outputPath: 'static/images',
          },
        },
      ],
    });
    
    return config;
  },
}

module.exports = nextConfig