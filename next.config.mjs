/** @type {import('next').NextConfig} */
const isDocker = process.env.DOCKER_BUILD === "true";

const nextConfig = {
    ...(isDocker ? { output: "standalone" } : {}),
    allowedDevOrigins: ["127.0.0.1", "localhost"],
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
