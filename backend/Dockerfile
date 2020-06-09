# By Staffan Olsson https://github.com/solsson

# An adoptopenjdk/ubuntu alternative to https://github.com/quarkusio/quarkus/blob/1.3.0.Final/docs/src/main/asciidoc/building-native-image.adoc
# with an attempt to speed up repeated builds by caching maven deps
# and support for jvm build in the same file, see ./hooks/build

FROM solsson/kafka:2.4.1-graalvm@sha256:2d1f65c34357813539acd1345cab267f8552b264ce62e040e4860d8106daac0d \
  as dev

WORKDIR /workspace
COPY pom.xml .

# -- depdendency caching hacks
RUN set -e; \
  export QUARKUS_VERSION=$(cat pom.xml | grep '<quarkus.platform.version>' | sed 's/.*>\(.*\)<.*/\1/'); \
  echo "Quarkus version: $QUARKUS_VERSION"; \
  mv pom.xml pom.tmp; \
  mvn io.quarkus:quarkus-maven-plugin:$QUARKUS_VERSION:create \
    -DprojectGroupId=org.example.temp \
    -DprojectArtifactId=kafka-quickstart \
    -Dextensions="kafka"; \
  mv pom.tmp kafka-quickstart/pom.xml; \
  cd kafka-quickstart; \
  mkdir -p src/test/java/org && echo 'package org; public class T { @org.junit.jupiter.api.Test public void t() { } }' > src/test/java/org/T.java; \
  printf "\nquarkus.native.additional-build-args=--dry-run\n" >> src/main/resources/application.properties; \
  mvn package -Pnative || echo "... Build error is expected. Caching dependencies."; \
  cd ..; \
  rm -r kafka-quickstart;
# end dependency caching

COPY . .

ENTRYPOINT [ "mvn", "quarkus:dev" ]
CMD [ "-Dquarkus.http.host=0.0.0.0", "-Dquarkus.http.port=8080" ]

# The jar and the lib folder is required for the jvm target even when the native target is the end result
RUN mvn package -Dmaven.test.skip=true

# For a regular JRE image run: docker build --build-arg build="package" --target=jvm
ARG build="package -Pnative"

RUN test "$build" = "package" && mvn --batch-mode test || mvn --batch-mode $build

FROM solsson/kafka:jre-latest@sha256:4f880765690d7240f4b792ae16d858512cea89ee3d2a472b89cb22c9b5d5bd66 \
  as jvm

WORKDIR /app
COPY --from=dev /workspace/target/lib ./lib
COPY --from=dev /workspace/target/*-runner.jar ./app.jar

EXPOSE 8090
ENTRYPOINT [ "java", \
  "-Dquarkus.http.host=0.0.0.0", \
  "-Dquarkus.http.port=8080", \
  "-Djava.util.logging.manager=org.jboss.logmanager.LogManager", \
  "-cp", "./lib/*", \
  "-jar", "./app.jar" ]

FROM gcr.io/distroless/base-debian10:nonroot@sha256:56da492c4800196c29f3e9fac3c0e66af146bfd31694f29f0958d6d568139dd9

COPY --from=dev \
  /lib/x86_64-linux-gnu/libz.so.* \
  /lib/x86_64-linux-gnu/

COPY --from=dev \
  /usr/lib/x86_64-linux-gnu/libzstd.so.* \
  /usr/lib/x86_64-linux-gnu/libsnappy.so.* \
  /usr/lib/x86_64-linux-gnu/liblz4.so.* \
  /usr/lib/x86_64-linux-gnu/

COPY --from=dev /workspace/target/*-runner /usr/local/bin/app

EXPOSE 8080
ENTRYPOINT ["app", "-Djava.util.logging.manager=org.jboss.logmanager.LogManager"]
CMD ["-Dquarkus.http.host=0.0.0.0", "-Dquarkus.http.port=8080"]