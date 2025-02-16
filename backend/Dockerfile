# Stage 1: Build the Go application
FROM golang:1.22-alpine AS builder

# Set working directory
WORKDIR /app

# Install git and other necessary tools
RUN apk add --no-cache git

# Copy go mod and sum files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy the source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main .

# Stage 2: Create a minimal runtime image
FROM alpine:latest

# Install necessary certificates
RUN apk --no-cache add ca-certificates

WORKDIR /root/

# Copy the pre-built binary file from the previous stage
COPY --from=builder /app/main .

# Copy .env file
COPY --from=builder /app/.env .env

# Expose port for the application
EXPOSE 8080

# Command to run the executable
CMD ["./main"]
