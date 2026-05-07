# Build SPA into backend/src/main/resources/static (see webapp/vite.config.ts)
FROM node:22-alpine AS web
WORKDIR /repo
COPY webapp/package.json webapp/package-lock.json ./webapp/
RUN cd webapp && npm ci
COPY webapp ./webapp
COPY backend ./backend
WORKDIR /repo/webapp
RUN npm run build

# Package executable JAR (skip npm: static already produced in /web stage)
FROM maven:3.9.9-eclipse-temurin-21-alpine AS build
WORKDIR /repo
COPY --from=web /repo/backend ./backend
WORKDIR /repo/backend
RUN mvn -B -DskipTests -Dskip.npm=true package

FROM eclipse-temurin:21-jre-alpine AS runtime
WORKDIR /app
COPY --from=build /repo/backend/target/app.jar ./app.jar
EXPOSE 8080
USER nobody
CMD ["java", "-jar", "/app/app.jar"]
