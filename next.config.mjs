/** @type {import('next').NextConfig} */
const isDocker = process.env.DOCKER_BUILD === "true";

const nextConfig = {
    ...(isDocker ? { output: "standalone" } : {}),
    allowedDevOrigins: ["127.0.0.1", "localhost"],
    async redirects() {
        return [
            { source: "/home", destination: "/", permanent: true },
            { source: "/marketing", destination: "/", permanent: true },
            { source: "/marketing/pricing", destination: "/pricing", permanent: true },
            { source: "/marketing/how-it-works", destination: "/how-it-works", permanent: true },
        ];
    },
    typescript: {
        ignoreBuildErrors: false,
    },
    eslint: {
        ignoreDuringBuilds: true,
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
