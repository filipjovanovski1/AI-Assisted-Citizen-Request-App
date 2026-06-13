FROM eclipse-temurin:21-jdk AS build
WORKDIR /app
COPY mvnw .
COPY .mvn .mvn
COPY ./pom.xml .
RUN ./mvnw dependency:go-offline -q
COPY src src
RUN ./mvnw package -DskipTests -q

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
ARG CORS_ALLOWED_ORIGINS
ENV CORS_ALLOWED_ORIGINS=${CORS_ALLOWED_ORIGINS}
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
