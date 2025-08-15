module.exports = {
  apps: [
    {
      name: "risk-management-app",
      script: "npx",
      args: "tsx server/index.ts",
      env: {
        NODE_ENV: "development",
        PORT: 5000,
        // DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/riskmanagement",
        OPENAI_API_KEY: "sk-proj-example-key-replace-with-valid-key",
        GOOGLE_CLIENT_ID: "your-google-client-id",
        GOOGLE_CLIENT_SECRET: "your-google-client-secret",
        SESSION_SECRET: "your-super-secret-session-key-change-this-in-production"
      },
      watch: ["server", "client", "shared"],
      watch_delay: 1000,
      ignore_watch: ["node_modules", "dist", ".git"],
      max_restarts: 5,
      min_uptime: "10s",
      kill_timeout: 5000,
      log_type: "json"
    }
  ]
};