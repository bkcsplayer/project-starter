FROM golang:1.22-alpine AS build
WORKDIR /src
COPY go.mod go.sum* ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o /bin/api-go ./main.go

FROM alpine:3.20
RUN apk add --no-cache wget
COPY --from=build /bin/api-go /bin/api
EXPOSE 8080
CMD ["/bin/api"]
