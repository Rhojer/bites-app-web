module.exports = {
  apps: [
    {
      name: 'bites-app-web',
      script: 'npm',
      args: 'start',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        NEXT_BASE_PATH: '/bites-app-web',
        NEXT_PUBLIC_BASE_PATH: '/bites-app-web',
        NEXT_PUBLIC_SUPABASE_URL: 'https://uqvdopbegosjggkxamoo.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxdmRvcGJlZ29zamdna3hhbW9vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxNjE1MTksImV4cCI6MjEwMjczNzUxOX0.6QwwCBOp711RUakYcEHFofpwF9AFnNNHyEa8GGEJSHk',
      },
    },
  ],
}
