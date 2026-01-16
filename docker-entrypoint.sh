#!/bin/sh
set -e

echo "Waiting for database..."
sleep 5

if [ "$(id -u)" = "0" ]; then
  echo "Running as root, setting up uploads directory..."
  mkdir -p /app/public/uploads
  chown -R nextjs:nodejs /app/public/uploads
  chmod -R 755 /app/public/uploads
  echo "Switching to nextjs user and starting application..."
  exec gosu nextjs node server.js
else
  echo "Running as $(whoami), starting application..."
  exec node server.js
fi
