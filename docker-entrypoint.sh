#!/bin/sh
set -eu

if [ -z "${DATABASE_URL:-}" ]; then
  db_user="${POSTGRES_USER:-postgres}"
  db_password="${POSTGRES_PASSWORD:-}"
  db_name="${POSTGRES_DB:-limoncello_business}"
  db_host="${DATABASE_HOST:-postgres}"
  db_port="${DATABASE_PORT:-5432}"

  if [ -z "$db_password" ]; then
    echo "DATABASE_URL ontbreekt en POSTGRES_PASSWORD is niet gezet."
    exit 1
  fi

  export DATABASE_URL="postgresql://${db_user}:${db_password}@${db_host}:${db_port}/${db_name}"
fi

attempts=0
until node scripts/apply-schema.mjs
do
  attempts=$((attempts + 1))

  if [ "$attempts" -ge 20 ]; then
    echo "Schema initialisatie mislukt na ${attempts} pogingen."
    exit 1
  fi

  echo "Database nog niet klaar, nieuwe poging over 2s..."
  sleep 2
done

exec node server.js
