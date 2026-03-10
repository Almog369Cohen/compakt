FROM node:20-alpine AS base

# --- Dependencies ---
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# --- Builder ---
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time env vars — ARGs must also be set as ENV so Node.js
# process.env can read them during `npm run build`.
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET
ARG NEXT_PUBLIC_GIT_SHA
ARG CLERK_SECRET_KEY
ARG SUPABASE_SERVICE_ROLE_KEY

ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY \
    NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \
    NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=$NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET \
    NEXT_PUBLIC_GIT_SHA=$NEXT_PUBLIC_GIT_SHA \
    CLERK_SECRET_KEY=$CLERK_SECRET_KEY \
    SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY

# Write .env.production so Next.js can read all vars reliably
RUN node -e "\
    const fs = require('fs');\
    const keys = [\
    'NEXT_PUBLIC_APP_URL','NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',\
    'NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_ANON_KEY',\
    'NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET','NEXT_PUBLIC_GIT_SHA',\
    'CLERK_SECRET_KEY','SUPABASE_SERVICE_ROLE_KEY'\
    ];\
    const lines = keys.filter(k => process.env[k]).map(k => k+'='+process.env[k]);\
    fs.writeFileSync('.env.production', lines.join('\n'));\
    console.log('env.production:', lines.map(l => l.split('=')[0] + '=' + l.split('=').slice(1).join('=').length + ' chars').join(', '));\
    "

RUN npm run build

# --- Runner ---
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 8080
ENV PORT=8080
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
