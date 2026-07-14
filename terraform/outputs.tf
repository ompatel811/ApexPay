output "vpc_id" {
  description = "The ID of the provisioned VPC"
  value       = aws_vpc.apexpay_vpc.id
}

output "eks_cluster_name" {
  description = "The EKS Cluster name"
  value       = aws_eks_cluster.eks.name
}

output "eks_cluster_endpoint" {
  description = "The EKS API Cluster endpoint URL"
  value       = aws_eks_cluster.eks.endpoint
}

output "rds_endpoint" {
  description = "PostgreSQL RDS connection endpoint"
  value       = aws_db_instance.postgres.endpoint
}

output "redis_endpoint" {
  description = "ElastiCache Redis primary configuration endpoint"
  value       = aws_elasticache_cluster.redis.cache_nodes[0].address
}

output "cloudfront_domain" {
  description = "CloudFront distribution Domain Name"
  value       = aws_cloudfront_distribution.cdn.domain_name
}
