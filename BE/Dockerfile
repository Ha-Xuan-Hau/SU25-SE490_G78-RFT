# Multi-stage build
FROM maven:3.9-eclipse-temurin-21-alpine AS build
WORKDIR /app

# Copy pom.xml và download dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code
COPY src ./src

# Build application
RUN mvn clean package -Dmaven.test.skip=true

# Runtime stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copy JAR from build stage
COPY --from=build /app/target/*.jar app.jar

# Render will auto-assign PORT
EXPOSE ${PORT:-8080}

# Run application with optimized memory for free tier
ENTRYPOINT ["sh", "-c", "java -Xmx400m -XX:+UseSerialGC -Dserver.port=${PORT:-8080} -jar app.jar"]
