variable "aws_region" {
  description = "The target AWS Region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "db_password" {
  description = "Master password for PostgreSQL database instance"
  type        = string
  sensitive   = true
  default     = "Mahipatel2206"
}
