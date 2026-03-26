# Build stage
FROM golang:1.22-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /pageforge ./cmd/pageforge

# Runtime stage
FROM alpine:3.20

RUN apk add --no-cache ca-certificates

COPY --from=builder /pageforge /usr/local/bin/pageforge

EXPOSE 8080

ENTRYPOINT ["pageforge"]
