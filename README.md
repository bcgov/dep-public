# The Digital Engagement Platform (DEP)

[![Lifecycle:Experimental](https://img.shields.io/badge/Lifecycle-Experimental-339999)](https://github.com/bcgov/repomountie/blob/master/doc/lifecycle-badges.md)

[![codecov](https://codecov.io/gh/bcgov/dep-public/branch/main/graph/badge.svg?token=E1JXYU701O)](https://codecov.io/gh/bcgov/dep-public)

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=bcgov_dep-public&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=bcgov_dep-public)

The purpose of this project is to develop engagement tools that address shortfalls identified in the Province’s existing public engagement processes.

## Objectives

**The goal of this project is** to transform B.C.’s public engagement processes and enable the public to provide more value and influence decision-making while generating useful data insights, an enhanced post commenting experience for the user, and minimize rejected comments. The product will be cost effective, leverage investments and successes to date, explore best in class strategies, and be maintainable and continuously improved by government staff. It will be privacy enhancing, and support DRIPA/ GBA+ implementation and analysis, and continuously delivered and tested with users.

## Recursively Cloning the Repository

Due to the inclusion of submodules, the repository must be cloned using the `--recurse-submodules` flag:

```bash
git clone --recurse-submodules https://github.com/bcgov/dep-public.git
```

## Directory Structure

    .github/                   - PR, CI action workflows and Issue templates
    /docs                      - Miscellaneous documentations
    common-hosted-form-service - (Submodule) Common Form Service for all DEP applications
    web/                       - DEP Web application root
    ├── src/                   - React.js application
    └── tests/                 - Application tests
        └── unit/              - Jest unit tests
    api/                       - DEP API Application Root
    ├── src/                   - Python flask application
    │   └── api/               - Models, Resources and Services
    ├── migrations             - Database migration scripts
    └── tests/                 - API application tests
        └── unit/              - Python unit tests
    notify-api/                - Notification API Application Root
    ├── src/                   - Python flask application
    │   └── notify_api/        - Models, Resources and Services
    └── tests/                 - API application tests
    cron/                      - Job Scheduler Application Root
    ├── src/                   - Python application
    │   └── cron/              - Models, Resources and Services
    └── tests/                 - Job Scheduler tests
    openshift/                 - OpenShift templates and documentation
    snowplow/                  - Snowplow custom schemas
    CODE-OF-CONDUCT.md         - Code of Conduct
    COMPLIANCE.yaml            - BCGov PIA/STRA compliance status
    CONTRIBUTING.md            - Contributing Guidelines
    LICENSE                    - License

## Documentation

- [Web Application Readme](web/README.md)
- [API Application Readme](api/README.md)
- [Notification API Application Readme](notify-api/README.md)
- [Job Scheduler Application Readme](cron/README.md)
- [Openshift Readme](openshift/README.md)

## Auxiliary Repositories

- [Formio Custom Components - bcgov/met-formio](https://github.com/bcgov/met-formio)
- [Custom Redash - bcgov/redash](https://github.com/bcgov/redash)

## Getting Help or Reporting an Issue

To report bugs/issues/features requests, please file an [issue](https://github.com/bcgov/dep-public/issues).

## How to Contribute

If you would like to contribute, please see our [contributing](CONTRIBUTING.md) guidelines.

Please note that this project is released with a [Contributor Code of Conduct](CODE-OF-CONDUCT.md). By participating in this project you agree to abide by its terms.

## License

    Copyright 2022 Province of British Columbia

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
