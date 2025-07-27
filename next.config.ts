const nextConfig = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  webpack(config: any, { isServer }: { isServer: boolean }) {
    if (isServer) {
      config.externals = config.externals || [];
      if (Array.isArray(config.externals)) {
        config.externals.push('pdf-parse');
      } else if (typeof config.externals === 'function') {
        const originalExternals = config.externals;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        config.externals = async (context: any, request: any, callback: any) => {
          if (request === 'pdf-parse') {
            return callback(null, 'commonjs pdf-parse');
          }
          return originalExternals(context, request, callback);
        };
      }
    }
    return config;
  },
};

module.exports = nextConfig;