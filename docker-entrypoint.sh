#!/bin/sh
set -eu

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
