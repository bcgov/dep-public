# Dagster libraries to run both dagit and the dagster-daemon. Does not
# need to have access to any pipeline code.

FROM python:3.12.2-bullseye

ARG DAGSTER_LIBRARIES_VERSION=0.29.18

RUN pip install \
    dagit==1.13.1 \
    dagster-docker==${DAGSTER_LIBRARIES_VERSION} \
    dagster-graphql==1.13.1 \
    dagster-postgres==${DAGSTER_LIBRARIES_VERSION} \
    dagster==1.13.1

# Set $DAGSTER_HOME and copy dagster instance and workspace YAML there
ENV DAGSTER_HOME=/opt/dagster/dagster_home/

RUN mkdir -p $DAGSTER_HOME

COPY dagster.yaml workspace.yaml $DAGSTER_HOME

WORKDIR $DAGSTER_HOME