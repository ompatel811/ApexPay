# System Architecture Diagram

This diagram displays the high-level server architecture and runtime components of the ApexPay platform, depicting how user traffic flows from HTTPS client browsers, through the Nginx reverse proxy, to the scaled Spring Boot backend instances, and down to the persistent database and memory storage layers.

```mermaid
graph TD
    %% Clients
    User([Web Client Browser]) -->|HTTPS: Port 443| Nginx[Nginx Reverse Proxy]
    
    %% Nginx Routing
    subgraph K8S_Cluster [Kubernetes EKS Cluster Namespace]
        Nginx -->|Proxy: Port 3000| Frontend[Next.js Frontend Pods]
        Nginx -->|Proxy: Port 8080| Backend[Spring Boot Backend Pods]
        
        %% Backend Dependencies
        Backend -->|Write/Read| Postgres[(PostgreSQL DB Pod)]
        Backend -->|Cache/PubSub| Redis[(Redis Cache Pod)]
        
        %% Observability & Metrics
        Actuator[Spring Boot Actuator] --- Backend
        Prometheus[Prometheus Server] -->|Scrape: /actuator/prometheus| Actuator
        Grafana[Grafana Dashboards] -->|Visualize Metrics| Prometheus
        
        %% Centralized Logging
        Logstash[Logstash Collector] -->|Index Logs| ES[(Elasticsearch)]
        ES --- Kibana[Kibana Log UI]
        Backend -->|Forward Logs: TCP 5044| Logstash
    end
    
    %% External Integrations
    Backend -->|Push Notifications| Firebase[External Firebase API]
    Backend -->|UPI Core Simulation| NPCI[Simulated Bank UPI Core]
```
