#!/bin/bash
# ApexPay PostgreSQL Backup Restoration Script

set -e

# Configuration
DB_NAME="payment_platform"
DB_USER="postgres"
DB_HOST="payment-postgres"

# Check arguments
if [ -z "$1" ]; then
    echo "Usage: $0 <path_to_backup_file.sql.gz>"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "${BACKUP_FILE}" ]; then
    echo "Error: Backup file '${BACKUP_FILE}' not found!"
    exit 1
fi

echo "=== Starting Database Restoration ==="
echo "Restoring from: ${BACKUP_FILE}"
echo "Target Database: ${DB_NAME} on ${DB_HOST}"

# Confirm with user
read -p "WARNING: This will overwrite the database. Are you sure? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Restoration cancelled."
    exit 0
fi

# Decompress and restore database
echo "Executing pg_restore/psql..."
gunzip -c "${BACKUP_FILE}" | PGPASSWORD="${POSTGRES_PASSWORD:-postgres}" psql -h "${DB_HOST}" -U "${DB_USER}" -d "${DB_NAME}"

echo "Database restoration completed successfully!"
echo "=== Restoration Process Finished ==="
