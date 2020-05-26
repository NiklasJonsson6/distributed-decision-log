# Maven
FROM maven:3.6.3-jdk-8-slim@sha256:d8e01825867d1e4ddbb96e40b5f08183e2a7d7ff40521c49cd8e76e36d75d340 \
  as maven

# JDK
FROM openjdk:8-jdk-slim@sha256:71592a5c3eecf243b624f0a718402bb54d9ccb282b3ae3aa108f62b5cd5539d1 \
  as dev

# Multi-stage build
COPY --from=maven /usr/share/maven /usr/share/maven

# symlink mvn
RUN ln -s /usr/share/maven/bin/mvn /usr/bin/mvn
ENV MAVEN_HOME=/usr/share/maven
ENV MAVEN_CONFIG=/root/.m2

# Create a sample project
WORKDIR /workspace
RUN mvn io.quarkus:quarkus-maven-plugin:1.2.1.Final:create \
  -DprojectGroupId=org.example.temp \
  -DprojectArtifactId=kafka-quickstart \
  -Dextensions="kafka" && \
  cd kafka-quickstart && \
  mkdir -p src/test/java/org && echo 'package org; public class T { @org.junit.jupiter.api.Test public void t() { } }' > src/test/java/org/T.java

# Add our pom file and build from that
COPY pom.xml kafka-quickstart/
RUN set -e; \
  mvn -f kafka-quickstart/pom.xml package; \
  rm -r kafka-quickstart
COPY . .

# Run
ENTRYPOINT [ "mvn", "compile", "quarkus:dev" ]
CMD [ "-Dquarkus.http.host=0.0.0.0", "-Dquarkus.http.port=8080" ]

FROM openjdk:8-jdk-slim@sha256:71592a5c3eecf243b624f0a718402bb54d9ccb282b3ae3aa108f62b5cd5539d1 \
  as maven-build

# Copy maven, set symlink and envs
COPY --from=maven /usr/share/maven /usr/share/maven
RUN ln -s /usr/share/maven/bin/mvn /usr/bin/mvn
ENV MAVEN_HOME=/usr/share/maven
ENV MAVEN_CONFIG=/root/.m2
COPY --from=dev ${MAVEN_HOME} ${MAVEN_HOME}
COPY --from=dev ${MAVEN_CONFIG} ${MAVEN_CONFIG}

# Copy files
WORKDIR /workspace
COPY . .

# Build the actual project
RUN set -e; \
  mvn -o -DskipTests package;

# Runtime environment
FROM fabric8/java-alpine-openjdk8-jre@sha256:a5d31f17d618032812ae85d12426b112279f02951fa92a7ff8a9d69a6d3411b1 \
  as runtime-jre

ARG SOURCE_COMMIT
ARG SOURCE_BRANCH
ARG IMAGE_NAME

# Copy build
WORKDIR /app
COPY --from=maven-build /workspace/target/lib ./lib
COPY --from=maven-build /workspace/target/*-runner.jar ./quarkus-kafka.jar

# Run (-cp )
EXPOSE 8080
ENTRYPOINT [ "java", \
  "-Dquarkus.http.host=0.0.0.0", \
  "-Dquarkus.http.port=8080", \
  "-Djava.util.logging.manager=org.jboss.logmanager.LogManager", \
  "-cp", "./lib/*", \
  "-jar", "./quarkus-kafka.jar" ]

ENV SOURCE_COMMIT=${SOURCE_COMMIT} SOURCE_BRANCH=${SOURCE_BRANCH} IMAGE_NAME=${IMAGE_NAME}