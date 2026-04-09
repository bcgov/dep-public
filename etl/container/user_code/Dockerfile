FROM python:3.12.2-slim-bullseye

ARG DAGSTER_LIBRARIES_VERSION=0.26.16

RUN pip install --upgrade pip
# Dagster + celery + k8s dependencies
RUN \
    pip install \
    dagster==1.10.16 \
    dagster-postgres==${DAGSTER_LIBRARIES_VERSION} \
    dagster-celery[flower,redis,kubernetes]==${DAGSTER_LIBRARIES_VERSION} \
    dagster-aws==${DAGSTER_LIBRARIES_VERSION} \
    dagster-k8s==${DAGSTER_LIBRARIES_VERSION} \
    dagster-celery-k8s==${DAGSTER_LIBRARIES_VERSION}

WORKDIR /opt/dagster/app

# Install project requirements from repository root
COPY requirements.txt ./requirements.txt
RUN apt-get update && apt-get install -y git \
    && rm -rf /var/lib/apt/lists/*
RUN pip install --no-cache-dir -r requirements.txt

# Copy the full ETL project so imports like `etl_project.*` resolve
COPY src/etl_project/ /opt/dagster/app/etl_project/
# Ensure legacy path `/etl_project` exists for Dagster CLI defaults
RUN ln -s /opt/dagster/app/etl_project /etl_project
# PYTHONPATH must include the parent of the package (and the legacy path) so imports always resolve
ENV PYTHONPATH=/opt/dagster/app:/etl_project

WORKDIR /opt/dagster/app/etl_project

# Copy and set up entrypoint script that sources Vault secrets
COPY container/user_code/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Run dagster gRPC server on the service port used by the deployment
EXPOSE 3030
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["dagster", "api", "grpc", \
    "-h", "0.0.0.0", "-p", "3030", \
    "-d", "/opt/dagster/app/etl_project", \
    "-f", "/opt/dagster/app/etl_project/services/repo.py"]