/** @type {import('next').NextConfig} */
const nextConfig = {
    output: "standalone",
    typescript: {
        ignoreBuildErrors: true,
    },
    images: {
        remotePatterns: [
            { protocol: "https", hostname: "i.scdn.co" },
            { protocol: "https", hostname: "mosaic.scdn.co" },
            { protocol: "https", hostname: "img.youtube.com" },
            { protocol: "https", hostname: "**.googleusercontent.com" },
        ],
    },
};

export default nextConfig;
