FROM python:3.12.2-bookworm

USER root

# Create working directory
RUN mkdir /opt/app-root && chmod 755 /opt/app-root
WORKDIR /opt/app-root

# Accept build arguments for version information
ARG ENGAGEMENT_BUILD_COMMIT_HASH=unknown
ARG ENGAGEMENT_BUILD_DATE=unknown
ARG ENGAGEMENT_BUILD_BRANCH=unknown
ARG ENGAGEMENT_GITHUB_REPO=https://github.com/bcgov/ENGAGEMENT_public

# Set environment variables from build arguments
ENV ENGAGEMENT_BUILD_COMMIT_HASH=${ENGAGEMENT_BUILD_COMMIT_HASH}
ENV ENGAGEMENT_BUILD_DATE=${ENGAGEMENT_BUILD_DATE}
ENV ENGAGEMENT_BUILD_BRANCH=${ENGAGEMENT_BUILD_BRANCH}
ENV ENGAGEMENT_GITHUB_REPO=${ENGAGEMENT_GITHUB_REPO}

# Install the requirements
COPY ./requirements.txt .

RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN pip install .

USER 1001

# Set Python path
ENV PYTHONPATH=/opt/app-root/src

ENTRYPOINT ["bash", "docker-entrypoint.sh"]
