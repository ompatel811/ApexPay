#!/bin/bash
# ApexPay PostgreSQL Automated Backup Script

# Exit immediately if a command exits with a non-zero status
set -e

# Configuration
BACKUP_DIR="/var/backups/apexpay"
DB_NAME="payment_platform"
DB_USER="postgres"
DB_HOST="payment-postgres"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_backup_${DATE}.sql.gz"

echo "=== Starting Database Backup ==="
echo "Time: $(date)"

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

# Run pg_dump and compress the output
echo "Dumping database '${DB_NAME}' from host '${DB_HOST}'..."
PGPASSWORD="${POSTGRES_PASSWORD:-postgres}" pg_dump -h "${DB_HOST}" -U "${DB_USER}" -d "${DB_NAME}" | gzip > "${BACKUP_FILE}"

echo "Backup completed successfully!"
echo "Saved to: ${BACKUP_FILE}"

# Cleanup old backups (older than 7 days)
echo "Cleaning up backups older than 7 days..."
find "${BACKUP_DIR}" -name "${DB_NAME}_backup_*.sql.gz" -mtime +7 -delete

echo "=== Backup Process Finished ==="
