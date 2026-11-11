const backend = process.env.BACKEND_URL || "http://localhost:8000";
module.exports = {
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${backend}/api/:path*` }];
  },
};
