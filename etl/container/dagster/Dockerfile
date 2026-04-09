# Dagster libraries to run both dagit and the dagster-daemon. Does not
# need to have access to any pipeline code.

FROM python:3.12.2-bullseye

ARG DAGSTER_LIBRARIES_VERSION=0.26.16

RUN pip install \
    dagit==1.10.16 \
    dagster-docker==${DAGSTER_LIBRARIES_VERSION} \
    dagster-graphql==1.10.16 \
    dagster-postgres==${DAGSTER_LIBRARIES_VERSION} \
    dagster==1.10.16

# Set $DAGSTER_HOME and copy dagster instance and workspace YAML there
ENV DAGSTER_HOME=/opt/dagster/dagster_home/

RUN mkdir -p $DAGSTER_HOME

COPY dagster.yaml workspace.yaml $DAGSTER_HOME

WORKDIR $DAGSTER_HOME