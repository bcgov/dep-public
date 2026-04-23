.PHONY: license
.PHONY: setup
.PHONY: ci cd
.PHONY: db run

MKFILE_PATH:=$(abspath $(lastword $(MAKEFILE_LIST)))
CURRENT_ABS_DIR:=$(patsubst %/,%,$(dir $(MKFILE_PATH)))

PROJECT_NAME:=notify_api
SERVICE_NAME:=notify-api
DOCKER_NAME:=notify-api

PYTHON ?= python3.12

#################################################################################
# COMMANDS -- license                                                           #
#################################################################################
license: ## Verify source code license headers.
	./scripts/verify_license_headers.sh $(CURRENT_ABS_DIR)/src $(CURRENT_ABS_DIR)/tests

#################################################################################
# COMMANDS -- Setup                                                             #
#################################################################################
setup: clean install install-dev ## Setup the project

clean: clean-build clean-pyc clean-test ## Clean the project
	rm -rf venv/

clean-build: ## Clean build files
	rm -fr build/
	rm -fr dist/
	rm -fr .eggs/
	find . -name '*.egg-info' -exec rm -fr {} +
	find . -name '*.egg' -exec rm -fr {} +

clean-pyc: ## Clean cache files
	find . -name '*.pyc' -exec rm -f {} +
	find . -name '*.pyo' -exec rm -f {} +
	find . -name '*~' -exec rm -f {} +
	find . -name '__pycache__' -exec rm -fr {} +

clean-test: ## clean test files
	find . -name '.pytest_cache' -exec rm -fr {} +
	rm -fr .tox/
	rm -f .coverage
	rm -fr htmlcov/

build-req: clean ## Upgrade requirements
	test -f venv/bin/activate || $(PYTHON) -m venv  $(CURRENT_ABS_DIR)/venv ;\
	. venv/bin/activate ;\
	pip install --upgrade pip ;\
	pip install -Ur requirements/prod.txt ;\
	pip freeze | sort > requirements.txt ;\
	cat requirements/repo-libraries.txt >> requirements.txt ;\
	pip install -Ur requirements/repo-libraries.txt

install: clean ## Install python virtual environment
	test -f venv/bin/activate || $(PYTHON) -m venv  $(CURRENT_ABS_DIR)/venv ;\
	. venv/bin/activate ;\
	pip install --upgrade pip ; \
	pip install -r requirements.txt

install-dev: ## Install local application
	. venv/bin/activate ; \
	pip install -r requirements/dev.txt; \
	pip install -e .

#################################################################################
# COMMANDS - CI                                                                 #
#################################################################################
ci: lint flake8 test ## CI flow

pylint: ## Linting with pylint
	. venv/bin/activate && pylint --rcfile=setup.cfg  src/$(PROJECT_NAME)

flake8: ## Linting with flake8
	. venv/bin/activate && flake8 src/$(PROJECT_NAME) tests

lintfix: ## Linting fix
	. venv/bin/activate && autopep8 -i -a src/$(PROJECT_NAME)/**/*.py

lint: pylint flake8 ## run all lint type scripts

test: ## Unit testing
	. venv/bin/activate && pytest

mac-cov: local-test ## Run the coverage report and display in a browser window (mac)
	open -a "Google Chrome" htmlcov/index.html

#################################################################################
# COMMANDS - CD
# expects the terminal to be openshift login
# expects export OPENSHIFT_DOCKER_REGISTRY=""
# expects export OPENSHIFT_SA_NAME="$(oc whoami)"
# expects export OPENSHIFT_SA_TOKEN="$(oc whoami -t)"
# expects export OPENSHIFT_REPOSITORY=""
# expects export TAG_NAME="dev/test/prod"
# expects export OPS_REPOSITORY=""                                                        #
#################################################################################
cd: ## CD flow
ifeq ($(TAG_NAME), test)
cd: update-env
	oc -n "$(OPENSHIFT_REPOSITORY)-tools" tag $(DOCKER_NAME):dev $(DOCKER_NAME):$(TAG_NAME)
else ifeq ($(TAG_NAME), prod)
cd: update-env
	oc -n "$(OPENSHIFT_REPOSITORY)-tools" tag $(DOCKER_NAME):$(TAG_NAME) $(DOCKER_NAME):$(TAG_NAME)-$(shell date +%F)
	oc -n "$(OPENSHIFT_REPOSITORY)-tools" tag $(DOCKER_NAME):test $(DOCKER_NAME):$(TAG_NAME)
else
TAG_NAME=dev
cd: build update-env tag
endif

build: ## Build the docker container
	docker build . -t $(DOCKER_NAME) \
		--build-arg VCS_REF=$(shell git rev-parse --short HEAD) \
		--build-arg BUILD_DATE=$(shell date -u +"%Y-%m-%dT%H:%M:%SZ") \

build-nc: ## Build the docker container without caching
	docker build --no-cache -t $(DOCKER_NAME) .

REGISTRY_IMAGE=$(OPENSHIFT_DOCKER_REGISTRY)/$(OPENSHIFT_REPOSITORY)-tools/$(DOCKER_NAME)
push: #build ## Push the docker container to the registry & tag latest
	@echo "$(OPENSHIFT_SA_TOKEN)" | docker login $(OPENSHIFT_DOCKER_REGISTRY) -u $(OPENSHIFT_SA_NAME) --password-stdin ;\
    docker tag $(DOCKER_NAME) $(REGISTRY_IMAGE):latest ;\
    docker push $(REGISTRY_IMAGE):latest

VAULTS=`cat devops/vaults.json`
update-env: ## Update env from 1pass
	oc -n "$(OPS_REPOSITORY)-$(TAG_NAME)" exec "dc/vault-service-$(TAG_NAME)" -- ./scripts/1pass.sh \
		-m "secret" \
		-e "$(TAG_NAME)" \
		-a "$(DOCKER_NAME)-$(TAG_NAME)" \
		-n "$(OPENSHIFT_REPOSITORY)-$(TAG_NAME)" \
		-v "$(VAULTS)" \
		-r "true" \
		-f "false"

tag: push ## tag image
	oc -n "$(OPENSHIFT_REPOSITORY)-tools" tag $(DOCKER_NAME):latest $(DOCKER_NAME):$(TAG_NAME)

#################################################################################
# COMMANDS - Local                                                              #
#################################################################################
oc-setup:
	# Check if oc command is present
	if command -v oc &> /dev/null; then \
		oc_project=$(shell oc project -q); \
		echo "Current OpenShift project: $$oc_project"; \
		if [ -z "$$oc_project" ]; then \
			echo "You are not logged in to OpenShift. Please log in using 'oc login'."; \
			exit 1; \
		fi; \
		project_name=$$(echo "$$oc_project" | cut -d '-' -f 1); \
        tag_name=$$(echo "$$oc_project" | cut -d '-' -f 2); \
		if [ "$$tag_name" != "dev" ]; then \
			read -p "You are in project '$$oc_project'. Do you want to switch to 'dev' project? (y/n): " choice; \
			if [ "$$choice" = "y" ]; then \
				oc project "$$project_name-dev"; \
			else \
				echo "Staying in project '$$oc_project'. Please ensure you are in the correct project for local development."; \
			fi; \
		else \
			echo "You are already in the 'dev' project: $$oc_project"; \
		fi; \
	else \
		echo "oc command not found. Install OpenShift CLI to use related features."; \
	fi

port-forward: oc-setup ## Port forward the notify-api service
		if oc get svc $(SERVICE_NAME) &> /dev/null; then \
			oc_project="$(shell oc project -q)"; \
			echo "Notify API service exists in the current project: $$oc_project"; \
			echo "Port forwarding notify-api service on port 8081"; \
			echo "Press Ctrl+C to stop"; \
			oc port-forward svc/$(SERVICE_NAME) 8081:8080 -n "$$oc_project"; \
		fi;

run: ## Run the project in local
	. venv/bin/activate && python -m flask run -p 5002

#################################################################################
# Self Documenting Commands                                                     #
#################################################################################
.PHONY: help

.DEFAULT_GOAL := help

help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'
