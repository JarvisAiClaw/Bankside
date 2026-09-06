#!/bin/sh
set -eu
echo "[bankside] applying migrations..."
npx prisma migrate deploy
echo "[bankside] starting: $*"
exec "$@"
