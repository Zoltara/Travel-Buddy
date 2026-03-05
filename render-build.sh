#!/bin/bash
set -e
cd /opt/render/project/src
corepack enable
pnpm install --frozen-lockfile
pnpm --filter @travel-buddy/types build
pnpm --filter @travel-buddy/scoring build
pnpm --filter @travel-buddy/api build
