# Terraform configuration for AWS Cloud Architecture hosting ApexPay
terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# 1. VPC Configuration
resource "aws_vpc" "apexpay_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  tags = {
    Name = "apexpay-production-vpc"
  }
}

# Subnets
resource "aws_subnet" "public_subnet_a" {
  vpc_id            = aws_vpc.apexpay_vpc.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "${var.aws_region}a"
  map_public_ip_on_launch = true
  tags = {
    Name = "apexpay-public-subnet-a"
  }
}

resource "aws_subnet" "public_subnet_b" {
  vpc_id            = aws_vpc.apexpay_vpc.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "${var.aws_region}b"
  map_public_ip_on_launch = true
  tags = {
    Name = "apexpay-public-subnet-b"
  }
}

resource "aws_subnet" "private_subnet_a" {
  vpc_id            = aws_vpc.apexpay_vpc.id
  cidr_block        = "10.0.10.0/24"
  availability_zone = "${var.aws_region}a"
  tags = {
    Name = "apexpay-private-subnet-a"
  }
}

resource "aws_subnet" "private_subnet_b" {
  vpc_id            = aws_vpc.apexpay_vpc.id
  cidr_block        = "10.0.11.0/24"
  availability_zone = "${var.aws_region}b"
  tags = {
    Name = "apexpay-private-subnet-b"
  }
}

# Internet Gateway & Route Tables
resource "aws_internet_gateway" "gw" {
  vpc_id = aws_vpc.apexpay_vpc.id
}

resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.apexpay_vpc.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.gw.id
  }
}

resource "aws_route_table_association" "public_a" {
  subnet_id      = aws_subnet.public_subnet_a.id
  route_table_id = aws_route_table.public_rt.id
}

resource "aws_route_table_association" "public_b" {
  subnet_id      = aws_subnet.public_subnet_b.id
  route_table_id = aws_route_table.public_rt.id
}

# 2. RDS PostgreSQL Instance
resource "aws_db_subnet_group" "db_subnet" {
  name       = "apexpay-db-subnet-group"
  subnet_ids = [aws_subnet.private_subnet_a.id, aws_subnet.private_subnet_b.id]
}

resource "aws_security_group" "rds_sg" {
  name        = "apexpay-rds-security-group"
  vpc_id      = aws_vpc.apexpay_vpc.id
  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
  }
}

resource "aws_db_instance" "postgres" {
  allocated_storage      = 20
  db_name                = "payment_platform"
  engine                 = "postgres"
  engine_version         = "16"
  instance_class         = "db.t4g.micro"
  username               = "postgres"
  password               = var.db_password
  db_subnet_group_name   = aws_db_subnet_group.db_subnet.name
  vpc_security_group_ids = [aws_security_group.rds_sg.id]
  skip_final_snapshot    = true
}

# 3. ElastiCache Redis Cluster
resource "aws_elasticache_subnet_group" "redis_subnet" {
  name       = "apexpay-redis-subnet-group"
  subnet_ids = [aws_subnet.private_subnet_a.id, aws_subnet.private_subnet_b.id]
}

resource "aws_security_group" "redis_sg" {
  name   = "apexpay-redis-security-group"
  vpc_id = aws_vpc.apexpay_vpc.id
  ingress {
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
  }
}

resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "apexpay-redis"
  engine               = "redis"
  node_type            = "cache.t4g.micro"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  port                 = 6379
  subnet_group_name    = aws_elasticache_subnet_group.redis_subnet.name
  security_group_ids   = [aws_security_group.redis_sg.id]
}

# 4. Amazon EKS Cluster
resource "aws_iam_role" "eks_role" {
  name = "apexpay-eks-cluster-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "eks.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "eks_cluster" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
  role       = aws_iam_role.eks_role.name
}

resource "aws_eks_cluster" "eks" {
  name     = "apexpay-eks-cluster"
  role_arn = aws_iam_role.eks_role.arn
  vpc_config {
    subnet_ids = [aws_subnet.public_subnet_a.id, aws_subnet.public_subnet_b.id, aws_subnet.private_subnet_a.id, aws_subnet.private_subnet_b.id]
  }
  depends_on = [aws_iam_role_policy_attachment.eks_cluster]
}

# 5. S3 Static Media & CloudFront CDN
resource "aws_s3_bucket" "media_bucket" {
  bucket        = "apexpay-production-media-assets"
  force_destroy = true
}

resource "aws_cloudfront_origin_access_control" "oac" {
  name                              = "apexpay-s3-oac"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "cdn" {
  origin {
    domain_name              = aws_s3_bucket.media_bucket.bucket_regional_domain_name
    origin_id                = "S3-ApexPayMedia"
    origin_access_control_id = aws_cloudfront_origin_access_control.oac.id
  }

  enabled             = true
  is_ipv6_enabled     = true
  comment             = "ApexPay CDN Static Asset Distribution"
  default_root_object = "index.html"

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-ApexPayMedia"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }
}
