# "build-stage", based on Node.js, to build and compile the frontend
# pull official base image
FROM node:20-alpine AS build-stage

# Accept build arguments for version information to pass to runtime
ARG REACT_APP_BUILD_COMMIT_HASH=dev
ARG REACT_APP_BUILD_DATE=unknown
ARG REACT_APP_BUILD_BRANCH=unknown
ARG REACT_APP_GITHUB_REPO=https://github.com/bcgov/dep-public

# Set as environment variables for runtime access
ENV REACT_APP_BUILD_COMMIT_HASH=${REACT_APP_BUILD_COMMIT_HASH}
ENV REACT_APP_BUILD_DATE=${REACT_APP_BUILD_DATE}
ENV REACT_APP_BUILD_BRANCH=${REACT_APP_BUILD_BRANCH}
ENV REACT_APP_GITHUB_REPO=${REACT_APP_GITHUB_REPO}

# set working directory to preserve the repo-relative local dependency path
WORKDIR /app/web

# add the web app binaries to $PATH
ENV PATH=/app/web/node_modules/.bin:$PATH

# install app dependencies using BuildKit secrets for Artifactory credentials
COPY package.json ./
COPY package-lock.json ./
COPY .npmrc ./
COPY --from=common_hosted_form_service /components /app/common-hosted-form-service/components

RUN --mount=type=secret,id=artifactory_password \
    --mount=type=secret,id=artifactory_username \
    apk --no-cache add g++ make py3-pip \
    && export ARTIFACTORY_USERNAME=$(cat /run/secrets/artifactory_username) \
    && export ARTIFACTORY_PASSWORD=$(cat /run/secrets/artifactory_password) \
    && npm install --legacy-peer-deps --silent

# create and set user permissions to app folder
RUN mkdir -p node_modules/.cache && chmod -R 777 node_modules/.cache

# add app files
COPY . ./

RUN npm run build

# Stage 1, based on Nginx, to have only the compiled app, ready for production with Nginx
FROM nginx:1.17 AS production-stage

RUN mkdir /app

# RUN  touch /var/run/nginx.pid && \
#     chown -R nginx:nginx /var/cache/nginx /var/run/nginx.pid

ARG user=nginx
RUN usermod -a -G root $user

COPY --from=build-stage /app/web/build /usr/share/nginx/html
COPY /nginx/*.conf /etc/nginx/
COPY /nginx/docker-entrypoint.sh /
COPY /nginx/config.js.template /usr/share/nginx/html/config.js.template

# Set ownership and permissions
# Set scripts as executable (make files and python files do not have to be marked)
# Make /etc/passwd writable for the root group so an entry can be created for an OpenShift assigned user account.
RUN chown -R "$user:root" /etc/nginx/ \
    && chmod -R ug+rw /etc/nginx/ \
    && chmod ug+x docker-entrypoint.sh \
    && chmod g+rw /etc/passwd \
    && chown -R "$user:root" /usr/share/nginx/html/ \
    && chmod g+rw /usr/share/nginx/html/ \
    && chown -R "$user:root" /usr/share/nginx/html/config.js.template \
    && chmod g+rw /usr/share/nginx/html/config.js.template 

USER $user

ENTRYPOINT ["sh", "/docker-entrypoint.sh"]