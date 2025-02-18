# Use the official PostgreSQL image from the Docker Hub
FROM postgres:latest

# Use an argument for the database name
ARG DB_NAME=NoteSense

# Set environment variables using build arguments
ENV POSTGRES_DB=${DB_NAME}
ENV POSTGRES_USER=root
ENV POSTGRES_PASSWORD=root
ENV POSTGRES_DB=${DB_NAME}  

# Expose the PostgreSQL port
EXPOSE 5432