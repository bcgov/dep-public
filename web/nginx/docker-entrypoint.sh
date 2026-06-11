#!/usr/bin/env bash

CONFIG_FILE=/etc/nginx/nginx.conf
MOUNTED_CONFIG_FILE=/nginx.conf

if [ -f "$MOUNTED_CONFIG_FILE" ]; then
    echo "Using root configuration file $MOUNTED_CONFIG_FILE."
    cp $MOUNTED_CONFIG_FILE $CONFIG_FILE
else 
    ENV_FILE=/etc/nginx/nginx.$ENV.conf
    if [ -f "$ENV_FILE" ]; then
        echo "Root configuration file not found, using environment template $ENV_FILE."
        cp $ENV_FILE $CONFIG_FILE
    else 
        echo "Root configuration file not found and environment template not found, using default."
    fi
fi

# Generate the config.js file from the environment variables
REACT_APP_VARS_JS=$(
    # For each environment variable
    env |
    # that starts with REACT_APP_,
    grep -E '^REACT_APP_' |
    # Create a string of the form "globalThis._env_.REACT_APP_VAR_NAME' = 'REACT_APP_VAR_VALUE';"
    sed -E "s/^(REACT_APP_[^=]+)=(.*)/globalThis._env_.\1 = '\2';/" |
    # Join the lines with a newline character,
    awk '{printf "%s\n", $0}' |
    # then remove the last newline character
    sed 's/\n$//'
)
export REACT_APP_VARS_JS

# Create the config.js file from the template
# This file will be served by Nginx and will be used by the React app to
# set the environment variables at runtime.
envsubst < /usr/share/nginx/html/config.js.template > /usr/share/nginx/html/config.js

nginx -g 'daemon off;'