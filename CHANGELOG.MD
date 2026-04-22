## April 20, 2026

- **Bugfix** Use EngagementStatus instead of SubmissionStatus [🎟️ DEP-259](https://citz-gdx.atlassian.net/browse/DEP-259)
  - Updated the AuthoringMore component to use the correct EngagementStatus enum values when filtering suggested engagements. This fixes a bug where engagements in the Upcoming status were not being suggested as possible related engagements.
  - Added a unit test to ensure this behavior is correct and to prevent regressions in the future.

## April 16, 2026

- **Feature** Always show InternalHeader when logged in, add admin/public view switcher [🎟️ DEP-257](https://citz-gdx.atlassian.net/browse/DEP-257)
  - Updated the InternalHeader component to always be visible when a user is logged in, regardless of whether they are on a public or admin page. This allows for a consistent navigation experience and provides access to the header's features across the entire application.
  - Added a new view switcher component to the InternalHeader that allows users to easily switch between the admin and public views of the application. This component is visible when a user is logged in and provides quick access to both views without needing to log out or manually navigate to different URLs.
  - Routes now define their own "equivalents" on the opposite side (public vs admin) to allow the view switcher to direct users to the corresponding page in the other view. For example, if a user is on the admin engagement details page, the view switcher will take them to the public engagement details page for the same engagement, and vice versa. This is achieved using `handle` from react-router route definitions to specify the equivalent route key for the opposite view.

## April 15, 2026

- **Feature** Merge routers, move authenticated routes to /manage and add AdminAuthGuard [🎟️ DEP-255](https://citz-gdx.atlassian.net/browse/DEP-255)
  - Merged the routers in App.tsx so all pages are now rendered within the same Router component, allowing for better route management and the ability view public pages as a logged in user without having to log out.
  - Moved all authenticated routes in the application to be nested under a new `/manage` base path. This includes all admin and authoring routes.
  - Implemented a new `AdminAuthGuard` component that wraps all routes under `/manage` to enforce authentication and authorization checks. This component will check if the user is logged in and has the appropriate permissions before allowing access to any admin routes.
  - Updated all links and redirects to point to the new `/manage` paths for authenticated sections of the app.

## April 13, 2026

- **Feature** Migrate all links to use getPath() [🎟️ DEP-256](https://citz-gdx.atlassian.net/browse/DEP-256)
  - Updated all hardcoded links in the codebase to use the new `getPath()` function from `routes/routes.ts`, which generates URLs based on a centralized ROUTES constant. This ensures that all links are consistent and automatically updated if route paths change in the future.
  - This includes links in components, API calls, navigation, and anywhere else URLs are generated or used in the application.
  - Also updated links to use RouterLinkRenderer where appropriate to take advantage of client-side routing and prevent full page reloads.
  - Leveraged new routing system to remove redundant routes in public view and restructure public engagement URLs to use the slug-based format
  - Fixed several bugs related to link construction

## April 13, 2026

- **Feature** Add constant ROUTES list in routes/routes.ts [🎟️ DEP-254](https://citz-gdx.atlassian.net/browse/DEP-254)
  - Created a new file `routes/routes.ts` that exports a constant `ROUTES` object containing all the route paths used in the application, organized by section (e.g. ENGAGEMENTS, SURVEYS, USERS, etc.).
  - Also created a type-safe `getRoute` function based on generatePath from react-router that takes a route key and optional parameters, and returns the corresponding route path with parameters interpolated. This centralizes route management and makes it easier to update routes in the future without having to search through the entire codebase.

## April 9, 2026

- **Chore** Track CORS config files in-repository and update docs [🎟️ DEP-220](https://citz-gdx.atlassian.net/browse/DEP-220)
  - Added the CORS configuration files for the S3 buckets used for uploads in the Digital Engagement Platform to the repository under `tools/s3/`.
  - Updated documentation in `tools/s3/README.md` to provide instructions on how to use these CORS configuration files when creating new buckets, including example commands for applying the CORS configuration using the `mc` CLI tool.

## April 8, 2026

- **Chore** Removed all references to CAC Forms [🎟️ DEP-232](https://citz-gdx.atlassian.net/browse/DEP-232)
  - Removed model, resource, and service from API
  - Added a migration for removing the table from the Postgres db
  - Removed any CAC-related constants
  - Removed any CAC-related values from enums but preserved positioning
  - Removed unneeded components from the front end, and references to the components
  - Removed translation strings
  - Removed any associated unit tests
  - Modified subscribe widget to remove CAC form option
- Fixed small styling issues with container width in Authoring: More Engagements component

- **Bugfix** Make sure user listing page only shows users from the current tenant, even for super admins [🎟️ DEP-246](https://citz-gdx.atlassian.net/browse/DEP-246)
  - Updated the API endpoint for listing users to filter results based on the current tenant, even for users with the SUPER_ADMIN role. This ensures that super admins only see users from their currently selected tenant, rather than all users across all tenants.
  - Updated unit tests to reflect this change and ensure that the user listing behaves as expected for super admins.

## April 7, 2026

- **Feature** Add "delete user" functionality to user management section [🎟️ DEP-239](https://citz-gdx.atlassian.net/browse/DEP-239)
  - Added a "Delete User" button to the user details page in the admin view, visible only to super admins.
  - Updated the API to include a DELETE endpoint for users, which checks for appropriate permissions and handles cascading deletions of related data (e.g. role assignments).
  - Added success and error messages to provide feedback on the deletion process.
  - Reworked the user details component to rearrange the existing layout and accommodate the new delete button, while ensuring a clear and intuitive user experience.

## April 1, 2026

- **Chore** Change trigger for environment detection [🎟️ DEP-242](https://citz-gdx.atlassian.net/browse/DEP-242)
  - Updated Helm templates to set a new environment variable `ENV` in the API deployment, which is then used by the API to determine the current environment (dev/test/prod).
  - The env variable is loaded in config.py and is available as current_app.config['ENVIRONMENT'] for use in the API codebase.
  - Also added REACT_APP_ENV variable to the web deployment and updated the web app to use this variable for environment detection on the frontend as well. This is curently used to determine whether to show the EnvironmentBanner that warns users that they are in a non-prod environment, but can be used for other environment-specific frontend logic as needed.

## March 31, 2026

- **Chore** OpenShift and Helm value changes from MET to DEP [🎟️ DEP-231](https://citz-gdx.atlassian.net/browse/DEP-231)
  - Updated Helm templates and values
    - Internal values use 'engagement'
    - External values use 'dep'
    - Some values just omit 'met'

## March 30, 2026

- **Chore** Update references to "MET" to refer to "DEP" or "engagement", or to be generic [🎟️ DEP-221](https://citz-gdx.atlassian.net/browse/DEP-221)
  - Renamed all remaining instances of "MET" in the codebase to "DEP" to reflect the rebranding of the project to the Digital Engagement Platform (DEP).
  - This includes renaming files, variables, functions, and any other references to "MET" across the entire codebase.
  - Updated documentation and comments to reflect the new naming convention.

## March 23, 2026

- **Chore** Remove & replace deprecated components [🎟️ DEP-250](https://citz-gdx.atlassian.net/browse/DEP-250)
  - Visited all instances of deprecated components in the codebase and removed them, replacing them with their new design system counterparts where necessary. Notable changes include:
    - Typography (BodyText, Header1, Header2, etc. instead of MetBodyTextOld, MetLabel, MetParagraphOld, MetHeader1Old, etc.)
    - Layout (MetPageGridContainer -> ResponsiveContainer)
    - Buttons (Universal Button component instead of MetPrimaryButtonOld, MetSecondaryButtonOld, etc.)
    - Grid -> Grid2 as Grid (deprecated by MUI in favor of a new implementation)
    - Replaced some custom components with plain MUI components, opting to style them at the theme level instead of creating new custom components for them (e.g. replaced MetPaper with MUI Paper component, and count on "elevation1" variant in `Theme.tsx` to handle styling)
  - Removed custom inline styling wherever updates made it redundant
  - Because the old components had "MET" in their names, removing them is in line with upcoming work for DEP-221 to remove all instances of "MET" from the codebase as part of the rebranding to the Digital Engagement Platform (DEP).

## March 17, 2026

- **Feature** Added More Engagements to authoring section [🎟️ DEP-228](https://citz-gdx.atlassian.net/browse/DEP-228)
  - Created SuggestedEngagement data type, as these are many to one with engagements
    - Added schema, model, and migration to the API
  - Updated engagement data type to store more engagements custom header string
  - Updated engagement API endpoints to include suggested engagement data and allow updating suggested engagements via the engagement details endpoint
  - Created More Engagements authoring component, updated authoring action/loader
  - Integrated data with existing preview window / public engagement More Engagements section
    - Added reload trigger when pressing on Preview button and preview window is already open
  - Modified suggestion section styling slightly to match hi-fi prototype

## March 16, 2026

- **Chore** Update user guide link to point to new location [🎟️ DEP-222](https://citz-gdx.atlassian.net/browse/DEP-222)
  - Updated the user guide link in the application to point to the new location of the user guide documentation, which has been moved from `bcgov.github.io/met-guide` to `bcgov.github.io/dep-guide` to reflect the rebranding of the project to the Digital Engagement Platform (DEP).

## March 12, 2026

- **Bugfix** Always let users with SUPER_ADMIN role list engagements, even if they don't have the VIEW_ENGAGEMENT permission. [🎟️ DEP-238](https://citz-gdx.atlassian.net/browse/DEP-238)
  - Updated the API endpoint for listing engagements to check for the SUPER_ADMIN role in addition to the VIEW_ENGAGEMENT permission and direct membership in the engagement. The role bypasses all other checks.
  - This ensures that users with the SUPER_ADMIN role can always list engagements, regardless of their specific permissions.

## March 11, 2026

- Implemented Subscribe section of engagement authoring area [🎟️ DEP-227](https://citz-gdx.atlassian.net/browse/DEP-227)
  - Added new fields to the API and database to support subscribe section data
  - Populated form components in AuthoringSubscribe.tsx to allow users to input data for the subscribe section
  - Modified AuthoringContext to include subscribe section data and actions for updating it

## March 8, 2026

- **Feature** Added delete functionality to engagement section [🎟️ DEP-175](https://citz-gdx.atlassian.net/browse/DEP-175)
  - All attempts to delete an engagement from the production environment will fail
  - Published engagements can not be deleted in any environment
  - Only super admins or users authorized to unpublish a specific engagement can delete
  - Surveys are not going to be erased when an engagement is deleted, for now

## March 3, 2026

- **Feature** Add engagement preview functionality [🎟️ DEP-73](https://citz-gdx.atlassian.net/browse/DEP-73)
  - The Preview button in the authoring view now opens a new window in split-screen (if possible) to show a live preview of the engagement as it would appear to the public.
    - Updated button icon to use the SVG provided by design
  - The preview page is a new route in the application that loads the engagement data and renders it using the public-facing components, allowing authors to see exactly how their content will appear to users.
  - Added preview components, including TextPlaceholder for uncompleted content, and PreviewSwitch and PreviewRender components to handle conditional rendering of preview vs live data.
  - Implemented a new context and loader for the preview data, which fetches the engagement data and provides it to the preview components.
  - Updated widget components to support tabbed display. Widgets, instead of being unique per-location, are now unique per combination of location and tab.
    - This allows authors to configure different widgets for the same location on different tabs, as per the new design.
  - Optimized widget card display by creating a centralized card component that handles the layout and styling for all widget types, reducing duplication and improving consistency across different implementations.

## February 26, 2026

- Added delete functionality to survey section [🎟️ DEP-174](https://citz-gdx.atlassian.net/browse/DEP-94)
  - Integrated with existing translation layer so that survey deletions also delete translations
  - Prevented surveys from being deleted if they are attached to a published engagement
  - Menu option only available to super admins or user role edit_all_surveys
  - Confirmation dialog on survey deletion
  - Success/failure messages, including a clear 'you can't delete a published engagement' message

## February 18, 2026

- Admin authoring - provide feedback section [🎟️ DEP-94](https://citz-gdx.atlassian.net/browse/DEP-94)
  - Modified existing "Provide Feedback" section to reflect needed controls (Autocomplete survey selector), as per Steve
  - Hooked up all form controls and created necessary columns in Engagement models/schemas to accomodate data
  - Got validation working and added navigate away message when form is dirty
  - Added a confirm modal if engagement is published and user is changing the survey
- Fixed the survey section
  - Got the survey creation wizard working
  - Added mandatory field to select connected engagement when creating a new survey
  - Fixed invalid calls for survey setting data before it exists
  - Modified the survey loader to deliver data instead of promises due to complexity of survey data needs
  - Fixed form validation that was misfiring
  - Replaced many deprecated components (not exhaustive)

## February 10, 2026

- **Chore** Move new look route from `/new-look` to base path `/` [🎟️ DEP-217](https://citz-gdx.atlassian.net/browse/DEP-217)
  - Updated the route for the new engagement view from `/new-look` to `/` to make it the default view for engagements.
  - Updated all links and redirects to point to the new base path.
  - Restructured UnauthenticatedRoutes.tsx to remove duplicated paths
  - Removed several components that were only used by the old engagement view, as they are no longer needed.
  - Refactored other components to separate them from the old view logic
  - Updated Engagement Tile component to point to the new base path for engagements, and to disable the link and show a not-allowed cursor when the engagement is loading.

- Updates to NPM config to remove outdated settings and document correct scope and registry settings for devs to install the Font Awesome Pro package

## February 2, 2026

- **Security** Implemented automatic sensitive data masking in API logs. [🎟️ DEP-161](https://citz-gdx.atlassian.net/browse/DEP-161)
  - Added logging filter to automatically mask passwords, tokens, API keys, and database credentials
  - Replaced print() statements with logger calls to ensure masking coverage
  - Added linting rules (pylint + flake8) to prevent print statements and enforce logging
  - Updated logging configuration to apply masking app-wide
  - See `met_api.utils.logging_masker` for implementation details

## January 28, 2026

- Added documentation for enabling and logging into the Sysdig monitoring platform for OpenShift projects. [🎟️ DEP-160](https://citz-gdx.atlassian.net/browse/DEP-160)
  - Created `docs/Sysdig_Login.md` with step-by-step instructions on logging in, finding your project, viewing and creating dashboards, and managing permissions.

## January 22, 2026

- Added Helm chart for Locust load testing tool [🎟️ DEP-152](https://citz-gdx.atlassian.net/browse/DEP-152)
  - Created a Helm chart for deploying Locust to OpenShift.
  - Configured Locust to use Vault for secret management.
  - Set up a Route for accessing the Locust web interface.
    - Set up protections so Route can only be accessed by VPN users or allowed dev IPs.
  - Documented deployment and usage instructions in `openshift/locust/README.md`.

## January 13, 2026

- Added keyboard navigation to the details tabs on the admin and public sides.
  - The following tickets are affected:
    - [🎟️ DESENG-672](https://citz-gdx.atlassian.net/browse/DESENG-672)
    - [🎟️ DESENG-710](https://citz-gdx.atlassian.net/browse/DESENG-710)

## January 8, 2026

- **Feature** Admin publishing tab in engagement details section. [🎟️ DESENG-709](https://citz-gdx.atlassian.net/browse/DESENG-709)
  - Adapted design from original publishing dialog
  - Added dynamic messages, update/cancel scheduled date functionality
- Resolved any remaining console errors
- Fixed broken authoring form submit by reconnecting it
- Fixed authoring bottom nav flickering (on route change)
  - Shifted language name to language slice instead of calculating on-the-fly
  - Shifted languages list to single engagement loader
- Added refresh/navigate away warning in authoring section for unsaved changes on a form
- Added better modal window for language selection change warning with unsaved changes

## December 22, 2025

- **Feature** Public authoring details page [🎟️ DESENG-710](https://citz-gdx.atlassian.net/browse/DESENG-710)
  - Made some small updates to the details tab translation model, resource, and service
  - Updated failing API pytest unit tests for details tab translation
  - Skipped some old Jest unit tests that rely on the old form
  - Removed outdated Jest user input tab test from old form

## December 18, 2025

- **Feature** Public authoring details page [🎟️ DESENG-710](https://citz-gdx.atlassian.net/browse/DESENG-710)
  - Remade authoring details public component with aria labels and new design
  - Modified RichTextArea component to include text clamping with custom line value
  - Removed all references to EngagementContent and EngagementContentTranslation in API and front end
  - Added a translation table and API functionality for details tab translations
  - Made minor improvements to admin forms
    - Navigate away modal on AuthoringBanner component
    - Improved default state on AuthoringDetails and AuthoringSummary components
    - Implemented scrolling and additional error for details tabs

## December 16, 2025

- **Feature** Capture Dagster deployment as Helm chart [🎟️ DESENG-926](https://citz-gdx.atlassian.net/browse/DESENG-926)
  - Created new Helm chart at `openshift/dagster/` to deploy Dagster ETL orchestration.
  - Allow VPN access to Dagster UI via OpenShift Route with IP whitelisting. Access is blocked for non-dev, non-VPN IPs.
  - Chart wraps official Dagster Helm chart (v1.4.4) as a dependency with OpenShift-specific customizations.
  - Includes template for a Job that syncs Vault secrets to a Kubernetes Secret prior to installation.
    - This was required because the official Dagster chart does not support Vault integration natively.
    - The secret will remain up-to-date with Vault data when the vault-sync Job is run on upgrade.
  - Supports environment-specific values files (dev/test/prod) for different deployment configurations.
  - Updated `openshift/README.md` with deployment instructions for the new Dagster chart.

## December 11, 2025

- **Feature** Capture Patroni cluster in Helm charts [🎟️ DESENG-925](https://citz-gdx.atlassian.net/browse/DESENG-925)
  - Updated Helm charts for `openshift/db` to include Patroni cluster configuration.
  - Patroni cluster state is now managed by Helm via Github Actions CI/CD pipeline.
  - Leverages https://github.com/bcgov/nr-patroni-chart/ as a subchart for Patroni deployment.
  - Renamed DB to `engagement-patroni` to reflect ongoing branding changes.
  - Updated backup and restore scripts to work with Patroni clusters.
  - Updated backup/restore documentation in `openshift/README.md`.
  - Confirmed app still runs correctly after DB reconfiguration.

## December 9, 2025

- **Feature** Add CI pipeline for ETL workflow [🎟️ DESENG-880](https://citz-gdx.atlassian.net/browse/DESENG-880)
  - Added a basic smoke test for the ETL Dagster pipeline to ensure that it can be linted and tested successfully.
  - Brought requirements.txt up to date, and added a dev requirements file for linting and testing dependencies.
  - Updated Dockerfiles to use consistent Dagster and related library versions.
  - Created a GitHub Actions workflow to lint and test the etl codebase on each pull request.
  - Added steps to install dependencies, run linting with flake8, and execute tests with pytest.

## December 8, 2025

- **Feature** Eject from create-react-app [🎟️ DESENG-903](https://citz-gdx.atlassian.net/browse/DESENG-903)
  - Ejected the MET Web application from create-react-app to gain more control over the build and development configuration.
  - Set up custom Webpack configuration for development and production builds.
  - Configured Babel to handle JSX, TypeScript, and modern JavaScript features.
  - Updated scripts in package.json to use the new Webpack configuration.
  - Tested the application to ensure it works correctly after ejection.

## December 5, 2025

- **Feature** Admin authoring details page [🎟️ DESENG-672](https://citz-gdx.atlassian.net/browse/DESENG-672)
  - Remade authoring details component with aria labels, form validation, navigate away modal, delete tab modal, and tab mode switch modal
  - Implemented service, types, and API endpoints for authoring details tabs in met-web
  - Created model, resource, schema, service, and db update for API
  - Optimized authoring form, loader, and action
  - Tested and updated existing authoring section pages to ensure continued functionality
    - Added form validation for Summary page

## December 2, 2025

- **Feature** Implement route rate limiting to prevent abuse [🎟️ DESENG-871](https://citz-gdx.atlassian.net/browse/DESENG-871)
  - Added `haproxy.router.openshift.io/rate-limit-connections` annotations to Route resources in Helm charts for public-facing services (met-api, met-web, met-analytics, analytics-api, and fider).
  - Configured rate limits to restrict the number of connections per IP address over a 3 second interval.
  - When rate limiting is triggered, the route will reply with empty responses until the rate limit period resets.
- **Feature** Enable S3 storage for PosgreSQL backups [🎟️ DESENG-844](https://citz-gdx.atlassian.net/browse/DESENG-844)
  - Updated backup scripts to support S3-compatible storage for PostgreSQL backups.
  - Added new buckets in S3 for storing backups.
  - Modified OpenShift deployment configuration to inject S3 backup credentials from Vault (also new).
  - Tested backup and restore processes to ensure compatibility with S3 storage.

## November 28, 2025

- **Feature** Implement code splitting for routes and large libraries [🎟️ DESENG-875](https://citz-gdx.atlassian.net/browse/DESENG-875)
  - Improved initial load times and application performance by reducing bundle size and loading only necessary code for each route.
  - Used React Router's lazy loading and Suspense to dynamically load route components as needed.
  - Configured Webpack to split code and CSS for large libraries (mui, formio, lodash, arcgis, maplibs, recharts, jspdf...) into separate chunks.
  - Added a new bundle analyzer script to visualize bundle composition and identify optimization opportunities.
  - Removed deprecated `defer` usage from route loaders and return promises directly, allowing React Router to handle loading states.

## November 25, 2025

- **Bugfix** Validate & Fix DB backup verification [🎟️ DESENG-843](https://citz-gdx.atlassian.net/browse/DESENG-843)
  - Added separate connection spec for verification step to avoid role errors during verification (workaround for met-patroni role management).
  - Updated `backup.conf` to schedule daily verification of backups using the new connection spec.
  - Added `emergency-restore.sh` script for emergency restores to fresh PostgreSQL instances without existing roles.
  - Updated documentation in `openshift/README.md` to reflect current backup and restore procedures.

## November 18, 2025

- **Feature** Implement route IP whitelisting for VPN and dev IPs [🎟️ DESENG-846](https://citz-gdx.atlassian.net/browse/DESENG-846)
  - Added `haproxy.router.openshift.io/ip_whitelist` annotation to Route resources in Helm charts for public-facing services (met-api, met-web, met-analytics, and analytics-api).
  - Configured whitelists to allow traffic only from known VPN and developer IP addresses.

## November 17, 2025

- **Feature** Increase Openshift security with NetworkPolicies [🎟️ DESENG-860](https://citz-gdx.atlassian.net/browse/DESENG-860)
  - Defined NetworkPolicies for all applications to control traffic flow. Traffic is only allowed between pods that need to communicate.

## November 14, 2025

- **Feature** Added app and API version info to footer [🎟️ DESENG-820](https://citz-gdx.atlassian.net/browse/DESENG-820)
  - Adjusted GitHub Actions workflow to embed version information into webapp and API at build time.
  - Version information displays in the footer of the admin view only, for now.

## August 25, 2025

- **Feature** Implement new CI/CD logic for Helm charts [🎟️ DESENG-849](https://citz-gdx.atlassian.net/browse/DESENG-849)
  - Remove old manual deployment scripts.
  - Introduced a new GitHub Actions workflow for CI/CD of Helm charts.
  - Added linting and testing steps for Helm charts.
  - Implemented deployment steps with OpenShift CLI.
- **Chore** Move Widgets out of old view folder [🎟️ DESENG-801](https://citz-gdx.atlassian.net/browse/DESENG-801)
  - Move the refreshed widget components from `components/engagement/old-view/` to `components/engagement/widgets/`, as they are being reused in the new engagement view.
- **Chore** Updated the versions of several packages to resolve additional [Dependabot vulnerabilities](https://github.com/bcgov/met-public/security/dependabot) (internal link).

## August 22, 2025

- **Chore** Resolve Dependabot vulnerability reports [🎟️ DESENG-845](https://citz-gdx.atlassian.net/browse/DESENG-845)
  - Update several packages to the latest version, resolving Dependabot PRs that are too old to be rebased.

- **Bugfix** Finish upgrading DeploymentConfigs -> Deployments cross-app [🎟️ DESENG-847](https://citz-gdx.atlassian.net/browse/DESENG-847)
  - Completed the replacement of all deprecated DeploymentConfigs with Deployments across the application.
  - Updated Helm charts and deployment scripts to reflect the changes.

## August 19, 2025

- **Feature** Restricted options for values in manual CD runs
  - Updated input type from `text` to `choice` in `met-cron-cd.yml`, `met-etl-cd.yml`,
    and `notify-api-cd.yml`
- **Bugfix/Feature** Switched Font Awesome hosting to private repository due to licensing
  [🎟️ DESENG-823](https://citz-gdx.atlassian.net/browse/DESENG-823)
  - Replaced the Font Awesome NPM registry with a private Artifactory repository.
  - Updated the `.npmrc` file to use the new repository and credentials.
  - Updated GitHub Actions workflows to use the new credentials for building and deploying the web app.
  - Updated Dockerfile to use build secrets instead of baking credentials into the image.

## Jul 22, 2025

- **Bugfix/Feature** Solutions for storage issues in dev [🎟️ DESENG-842](https://citz-gdx.atlassian.net/browse/DESENG-842)
  - Updated the Dagster configuration to add retention policies for the event log, schedule, and run logs.

## Jul 9, 2025

- **Feature** Add Dependabot alerts for Github Actions [🎟️ DESENG-812](https://citz-gdx.atlassian.net/browse/DESENG-812)
  - Added a Dependabot configuration file to automatically check for updates to Github Actions runner images and workflows.
    If any updates are found, a pull request will be created to update the versions referenced in the workflows.

## Jun 25, 2025

- **Task** DeploymentConfig -> Deployment conversion for previously undeployed DeploymentConfig yamls.
  [🎟️ DESENG-807](https://citz-gdx.atlassian.net/browse/DESENG-807)
  [🎟️ DESENG-808](https://citz-gdx.atlassian.net/browse/DESENG-808)
  [🎟️ DESENG-809](https://citz-gdx.atlassian.net/browse/DESENG-809)
  [🎟️ DESENG-810](https://citz-gdx.atlassian.net/browse/DESENG-810)
  - Took undocumented resources in Openshift that were previously DeploymentConfigs and converted them to Deployments in new Helm charts.
  - Changed Backup pod backup-container images to use the new URL. (hub.docker.com -> ghcr.io)

## Jun 16, 2025

- **Task** DeploymentConfig -> Deployment conversion for existing DeploymentConfig yamls.
  [🎟️ DESENG-802](https://citz-gdx.atlassian.net/browse/DESENG-802)
  [🎟️ DESENG-803](https://citz-gdx.atlassian.net/browse/DESENG-803)
  [🎟️ DESENG-804](https://citz-gdx.atlassian.net/browse/DESENG-804)
  [🎟️ DESENG-805](https://citz-gdx.atlassian.net/browse/DESENG-805)
  [🎟️ DESENG-806](https://citz-gdx.atlassian.net/browse/DESENG-806)
  - Converted all DeploymentConfig YAML files to Deployment YAML files.
  - If a DeploymentConfig was deployed by a Helm chart in the repository, it was converted to a Deployment and the Helm chart was updated accordingly.
- **Task** Update documentation for common components [🎟️ DESENG-816](https://citz-gdx.atlassian.net/browse/DESENG-816)
  - Added docblocks to the majority of common components
  - Updated CONTRIBUTING.md to link to each component's documentation, and provide a brief overview of the component and its usage
  - Updated PR template to remind developers to update documentation when adding new components or modifying existing ones

## Jun 10, 2025

- **Bugfix** Fix routing issue in engagement "old view" [🎟️ DESENG-837](https://citz-gdx.atlassian.net/browse/DESENG-837)
  - Add correct loaders to the engagement "old view" route
  - Update implementation of route loaders to use `useLoaderData` instead of `useRouteLoaderData`
  - Update permission checks on the API side to allow public users to access engagement metadata
    (accidentally broken in PR #2506 for DESENG-603)

## June 6, 2025

- **Task** Deprecate old components in MET Web [🎟️ DESENG-817](https://citz-gdx.atlassian.net/browse/DESENG-817)
  - Deprecated old components in MET Web to prepare for the new design system
  - Most components should now have suitable replacements in the new design system

## May 22, 2025

- **Bugfix** Fix survey ID access in MET ETL [🎟️ DESENG-677](https://citz-gdx.atlassian.net/browse/DESENG-677)
  - the load_survey function in the MET ETL pipeline now uses .scalar() instead of .first() to get the survey ID
  - Commit more often during processing to avoid deadlocks

## May 21, 2025

- **Bugfix** Update SQLAlchemy library in MET ETL to match MET API [🎟️ DESENG-677](https://citz-gdx.atlassian.net/browse/DESENG-677)
- **Bugfix** Add required dependencies for met-etl to requirements.txt [🎟️ DESENG-677](https://citz-gdx.atlassian.net/browse/DESENG-677)
  - pin flask_restx to 1.3.0
- **Feature** Create Helm chart for analytics-api [🎟️ DESENG-811](https://citz-gdx.atlassian.net/browse/DESENG-811)
  - Created a helm chart for the analytics-api deployment.
  - Migrated existing Service and ConfigMap to Helm templates.
  - Secrets now use HashiCorp Vault for sensitive data.
  - Removed "debug=True" from all flask apps, as this is not appropriate for production.
- **Feature** Update helm chart for MET Analytics (Redash) [🎟️ DESENG-811](https://citz-gdx.atlassian.net/browse/DESENG-811)
  - Updated the helm chart for MET Analytics (Redash) to use Vault secrets for sensitive data.
  - Removed Secrets file
  - Removed sentiment analysis from the repository, as it is no longer used.
  - Change from Ingress to Route for consistency with other applications.
  - Properly randomized the secret keys for redash and the database

## May 20, 2025

- **Bugfix** Remove potentially redundant Dagster libraries [🎟️ DESENG-677](https://citz-gdx.atlassian.net/browse/DESENG-677)
- Remove pip `-U` flag from installation commands to prevent version instabilities

## May 14, 2025

- **Feature** Create Helm chart for notify-api [🎟️ DESENG-811](https://citz-gdx.atlassian.net/browse/DESENG-811)
  - Created a helm chart for the notify-api deployment.
  - Migrated existing Service and ConfigMap to Helm templates.
  - Removed notify-api Route, as the notify-api does not need to be publicly accessible. Instead, it is called by the MET API & MET Cron jobs.
    - For local development, the notify-api can be accessed via port-forwarding. See DEVELOPMENT.md for more information.
  - Added new "global" Vault secret for all flask apps to use, which contains the `SECRET_KEY`.
  - Migrated the DeploymentConfig to a Helm template.
  - Created values files (dev, test, prod) for deployment settings; see `openshift/README.md`

## May 13, 2025

- **Bugfix** Align library versions with EPIC app [🎟️ DESENG-677](https://citz-gdx.atlassian.net/browse/DESENG-677)

## May 12, 2025

- **Feature** Add MET Cron job to OpenShift [🎟️ DESENG-811](https://citz-gdx.atlassian.net/browse/DESENG-811)
  - Added the met-cron deployment to the met-api helm chart.
  - Removed an unneeded Service, as the Cron does not serve any traffic.
  - Set up injection of HashiCorp Vault secrets to the Cron job
  - Merged met-cron ConfigMap into the met-api ConfigMap, as they differed very little.
  - Renamed config key "OFFSET_DAYS" to "CLOSING_SOON_EMAIL_ADVANCE_NOTICE_DAYS" to be more descriptive.
  - Removed the old met-cron deployment YAML files.

## May 7, 2025

- **Feature** Add Helm chart and templates for MET Web [🎟️ DESENG-811](https://citz-gdx.atlassian.net/browse/DESENG-811)
  - Created a helm chart for the MET Web deployment.
  - Migrated existing resources to Helm templates.
  - Removed several unused ConfigMap values
  - Removed JWT/OIDC related values in favor of requesting the data from the MET API (single source of truth).
    - Created an endpoint at `/api/oidc_config` to return the OIDC configuration for the MET API.
  - Modified the Docker entrypoint to generate a config script from REACT_APP\_\* environment variables at startup.
    - The config script is then served alongside the app at runtime.
- **Bugfix** Updated existing templates to set minReplicas and maxReplicas for the HPA (matching met-web) rather than trying to configure it on the Deployment, which has no effect.

## May 5, 2025

- **Feature** Add Helm chart and templates for MET API [🎟️ DESENG-811](https://citz-gdx.atlassian.net/browse/DESENG-811)
  - Created a helm chart for the MET API deployment.
  - Migrated existing HorizontalPodAutoscaler, Route, Service, and MET ConfigMap to Helm templates.
  - Removed Secrets in favor of using HashiCorp Vault for sensitive data.
    - Also removed several ConfigMap values that were either sensitive or were contextually linked to
      the secrets, and moved their data to the Vault.
    - Developers can now use `helm` to generate the Openshift YAML files without needing
      to seek out secrets and keep them within their values files.
  - Migrated the DeploymentConfig to a Helm template.
    - Modified heavily to use new Vault secrets. Secrets are now mounted as files in the
      container at /vault/secrets, and the application is expected to read them from the filesystem.
    - Bound the DeploymentConfig to the e903c2-vault service account, which has access to the
      secrets in the vault. Also granted the vault account image pull permissions from e903c2-tools.
  - Created environment-specific values files (dev, test, prod) for deployment settings.
    - See `openshift/README.md` for more information on how to deploy the API using the new Helm chart.
  - Removed YAML for the old Keycloak server, since we have migrated to using the shared SSO Keycloak
    server.

## May 1, 2025

- **Bugfix** Resolve conflicting versions for Dagster ETL pipeline [🎟️ DESENG-677](https://citz-gdx.atlassian.net/browse/DESENG-677)
  - Tweak dagster versions and python base image
- **Feature** Redesign event widget [🎟️ DESENG-698](https://citz-gdx.atlassian.net/browse/DESENG-698)
  - Modified api to accomodate additional field required in event widget design
  - Modified forms and cards on admin side to show new field
  - Implemented front-end design
    - Tested with multiple events on one page
  - Optimized for mobile and desktop viewports
  - Updated unit test data

## April 24, 2025

- **Bugfix** Update Dagster versions to attempt fix of Dagster ETL pipeline [🎟️ DESENG-677](https://citz-gdx.atlassian.net/browse/DESENG-677)
- **Bugfix** Add in required installation commands for openshift CLI [🎟️ DESENG-813](https://citz-gdx.atlassian.net/browse/DESENG-813)
  - Chose concrete version of Ubuntu to mitigate future issues

## April 22, 2025

- **Feature** Redesign poll widget [🎟️ DESENG-697](https://citz-gdx.atlassian.net/browse/DESENG-697)
  - Refactor PollWidget.tsx implementing Figma design
    - Improved layout, similar to DocumentWidget
  - Load data more efficiently
  - Added new skeleton while loading
  - Added new error handling for poll submission

## April 15, 2025

- **Feature** Redesign document widget [🎟️ DESENG-696](https://citz-gdx.atlassian.net/browse/DESENG-696)
  - Significant refactor to DocumentWidget.tsx implementing Figma design
  - Use recursive rendering to support theoretically infinite subfolders in future
  - Many accessibility/QoL improvements
  - Improved layout - minimizes layout shift by forcing the list widget to be at least as tall as the copy it appears beside.
  - Improved skeleton while loading

- **Chore** Update GitHub Actions workflows to use ubuntu-latest instead of ubuntu-20.04
  - This is to stay ahead of the deprecation of ubuntu-20.04 in GitHub Actions as of today's date

## _Interregnum break_: _October 2024 - March 2025_

- The project was on hold during this period, and no changes were made to the codebase. The team was directed to focus on other projects. Any technical debt or issues that were identified during this period will be addressed in future sprints.

## October 2, 2024

- **Feature** New Who is Listening widget front end [🎟️ DESENG-695](https://citz-gdx.atlassian.net/browse/DESENG-695)
  - Implemented Figma design
  - Added widget_listening table to db for widget instance data
  - Added option to enter widget description text (below title, above contacts)
  - Adjusted CSS to accomodate multiple viewports
  - Added ARIA labels for accessibility
  - Updated contact create/edit form
  - Updated Who is Listening widget form

- **Feature** New Video Widget front end [🎟️ DESENG-692](https://citz-gdx.atlassian.net/browse/DESENG-692)
  - Changed icon colour from yellow to white to accomodate company branding requests

- **Feature** New Map Widget front end [🎟️ DESENG-693](https://citz-gdx.atlassian.net/browse/DESENG-693)
  - Adjusted viewport settings of expand map link to accomodate breakpoints of engagement view page

## September 26, 2024

- **Feature** New Timeline Widget designs [🎟️ DESENG-694](https://citz-gdx.atlassian.net/browse/DESENG-694)
  - Implemented Figma design
  - Adjusted styling in Engagement views slightly to accommodate theme-aware widgets

## September 25, 2024

- **Feature** New Video Widget front end [🎟️ DESENG-692](https://citz-gdx.atlassian.net/browse/DESENG-692)
  - Removed unneeded tables from db
  - Updated all other met_api and met_web logic to accomodate this

- **Feature** New Map Widget front end [🎟️ DESENG-693](https://citz-gdx.atlassian.net/browse/DESENG-693)
  - Implemented Figma design
  - Fixed accessibility issue with map labels (white text on white background)

## September 23, 2024

- **Feature** New Hero Banner page in authoring section [🎟️ DESENG-670](https://citz-gdx.atlassian.net/browse/DESENG-670)
  - Hooks into existing AuthoringTemplate component for form submission
  - Added new fields for hero banner content
  - Added image upload functionality
  - Added layout components for engagement authoring form fields

## September 18, 2024

- **Feature** New Video Widget front end [🎟️ DESENG-692](https://citz-gdx.atlassian.net/browse/DESENG-692)
  - Implemented Figma design
  - Created custom layover bar for videos that shows video provider and has a custom logo
  - Transcripts will not be implemented at this time

- Summary page in authoring section [🎟️ DESENG-671](https://citz-gdx.atlassian.net/browse/DESENG-671)
  - Streamlined data loaders and actions to account for page changes
  - Updated data structure so that summary data is pulled from engagement table
    - Added 'description_title' column to engagement table

## September 12, 2024

- **Feature** New Summary page in authoring section [🎟️ DESENG-671](https://citz-gdx.atlassian.net/browse/DESENG-671)
  - Fetches values
  - Saves values to database
  - Returns success and error messages to user after form submission
  - Resets form dirty state after submission

## September 9, 2024

- **Feature** Add image widget [🎟️ DESENG-689](https://citz-gdx.atlassian.net/browse/DESENG-689)
  - Added a new "ImageWidget" widget type in the API
  - Image widgets can have a title, optional description, uploaded image, and optional alt text
  - Added image widget option to the engagement authoring wizard
  - Added image widget display for the engagement view page

## September 3, 2024

- **Feature** New authoring content section [🎟️ DESENG-668](https://citz-gdx.atlassian.net/browse/DESENG-668)
  - Implemented authoring side nav
  - Implemented authoring bottom nav
  - Implemented authoring section context
  - Added skeletons for the required sections

## August 28, 2024

- **Bugfix** Fix keyboard focus being trapped on buttons on authoring page [🎟️ DESENG-687](https://citz-gdx.atlassian.net/browse/DESENG-687)

## August 27, 2024

- **Task** Upgrade to Node v20 [🎟️ DESENG-682](https://citz-gdx.atlassian.net/browse/DESENG-682)
  - Upgraded deployment / CI configs to reference Node v20

## August 22, 2024

- **Task** Merge engagement summary content and custom content [🎟️ DESENG-676](https://citz-gdx.atlassian.net/browse/DESENG-676)
  - Combine the text and rich content fields from redundant types SummaryContent and CustomContent and store them in
    the existing EngagementContent table
  - Update the API to handle the new content structure
  - Todo: Update the frontend to properly leverage the new content structure and allow editing of the simplified content type

## August 21, 2024

- **Feature** Reusable widget component [🎟️ DESENG-675](https://citz-gdx.atlassian.net/browse/DESENG-675)

## August 15, 2024

- **Feature** Add engagement configuration summary [🎟️ DESENG-667](https://citz-gdx.atlassian.net/browse/DESENG-667)
  - Added a tabbed layout to the new engagement view page
  - Added a new "Configuration" tab to display the engagement's configuration details
    - The other tabs are blank for now, but will be filled in future tickets
  - The configuration tab allows navigating back to the engagement configuration page
  - Improvements to how engagements and related resources are fetched and saved

- **Feature** New engagement authoring view tab [🎟️ DESENG-674](https://citz-gdx.atlassian.net/browse/DESENG-674)

## August 13, 2024

- **Task** Fix dagster etl error in "dev" environment [🎟️ DESENG-677](https://citz-gdx.atlassian.net/browse/DESENG-677)

## August 8, 2024

- **Feature** New engagement details page [🎟️ DESENG-666](https://citz-gdx.atlassian.net/browse/DESENG-666)
- Old engagement details page still available under "old-view" route

- **Feature** Implement UX designs for engagement creation wizard [🎟️ DESENG-663](https://citz-gdx.atlassian.net/browse/DESENG-663)
  - Implemented the new design for the engagement creation wizard
  - Added a new "Step" component to handle the wizard's steps
  - Added a new "SystemMessage" component to display system messages
  - Made engagement configuration form reusable for an edit engagement flow
  - Added a new "EngagementWizard" component to handle the entire wizard

## August 6, 2024

- **Hotfix** Fix styling issues with the new admin header - 🎟️ HOTFIX
  - Fixed an issue where page widths above 100% were causing the header to become misaligned
  - Fixed a z-index issue with the tenant selector on mobile

## July 31, 2024

- **Feature** New footer (public and admin) [🎟️ DESENG-662](https://citz-gdx.atlassian.net/browse/DESENG-662)
  - Implemented new footer design for desktop and mobile viewports.
  - Addressed some issues with z-index between footer and side nav.

## July 30, 2024

- **Feature** New admin header [🎟️ DESENG-660](https://citz-gdx.atlassian.net/browse/DESENG-660)
  - Added a new API endpoint to fetch a list of a user's tenants, required for the new header
  - Redesigned the admin header to match the new design system
  - Added a new dropdown to the header to allow users to switch between tenants
  - Added a user menu, which for now only contains a logout button
  - Added a "drawer" view for the tenant switcher and user menu on mobile

- **Task** Update Contributing guide, pull request template [🎟️ DESENG-651](https://citz-gdx.atlassian.net/browse/DESENG-651)

## July 25, 2024

- **Feature** New admin navigation [🎟️ DESENG-661](https://citz-gdx.atlassian.net/browse/DESENG-661)
  - Implemented new admin navigation design for desktop and mobile viewports.
  - Implemented additional accessibility for admin navigation

## July 17, 2024

- **Feature** Admin authoring experience - language selector [🎟️ DESENG-657](https://citz-gdx.atlassian.net/browse/DESENG-657)
  - Created loader for engagement creation wizard
  - Created language selector field in engagement creation wizard

- **Hotfix** Fix MET-web CI build errors [🎟️ DESENG-665](https://citz-gdx.atlassian.net/browse/DESENG-665)
  - Update the `npm install` command in CI for the web app to use `--legacy-peer-deps`, resolving a dependency issue that was causing the build to fail

## July 16, 2024

- **Feature** Add user management to engagement authoring wizard [🎟️ DESENG-656](https://citz-gdx.atlassian.net/browse/DESENG-656)
  - Added new UI component to handle searching, selecting, and displaying users
  - Minor tweaks to existing wizard functionality
    - Minor backend change: don't throw error when setting an engagement's slug to its current value
- **Feature** Rerouted engagement components to use useRouteLoaderData instead of making direct calls to services. [🎟️ DESENG-643](https://citz-gdx.atlassian.net/browse/DESENG-643)
  - Authorized engagement listing page is now working, complete with filter, search, and pagination
  - Authorized view engagement is fully working with widgets
  - Authorized edit engagement is fully working (including custom data)
  - Authorized create engagement is mostly working, with the exception of edit updates
    - TODO: Users should be redirected to edit page once engagement is created
  - Unauthorized homepage is working with engagements

## July 11, 2024

- **Feature** Add the existing engagement form fields to the engagement authoring wizard [🎟️ DESENG-655](https://citz-gdx.atlassian.net/browse/DESENG-655)
  - Added fields for the existing data (engagement title, dates, internal/external, public slug)
  - Create button is now enabled when all required fields are filled
  - Users are redirected to the old form after creating a new engagement
    - (clicking "edit" on an existing engagement also brings you to the old form, as usual)
- Some extracurricular work:
  - Created a reusable component to warn users when they're about to navigate away from the page while editing content
  - Adjusted theming throughout the app to reduce the number of places where colors are defined
  - Updated to the latest version of @mui/x-date-pickers and adjust existing components where necessary

## July 10, 2024

- **Feature** Add a skeleton page for the new engagement authoring wizard [🎟️ DESENG-654](https://citz-gdx.atlassian.net/browse/DESENG-654)
  - Users are taken to the new page when pressing the "create engagement" button.
  - This route will be updated in future tickets to include the full authoring wizard, and will eventually replace the old authoring flow.

## July 9, 2024

- **Task** Add data router features to survey pages [DESENG-642](https://citz-gdx.atlassian.net/browse/DESENG-642)
  - Remove "ActionContext" files and fetches to survey service
  - Replace with SurveyLoader on the survey parent route that creates survey data promises
  - Restructure survey pages to use \<Suspense> / \<Await> for data loading
  - Add useBlocker() call to the survey authoring and survey submission pages to prevent users from navigating away from the page while in the middle of creating or submitting a survey

## June 28, 2024

- **Task** Improve screen reader support for home/engagement search page [DESENG-617](https://citz-gdx.atlassian.net/browse/DESENG-617)

## June 27, 2024

- **Bugfix** Fix tenant landing page [🎟️ DESENG-635](https://citz-gdx.atlassian.net/browse/DESENG-635)
  - Fixed an issue where the tenant's uploaded banner would appear in the position of the BC Logo instead of the banner
  - Renamed columns within the DB and app to more accurately describe their purpose

## June 26, 2024

- **Feature** Redesigned Engagement Cards & added Suggested Engagements to the engagement page [🎟️ DESENG-634](https://citz-gdx.atlassian.net/browse/DESENG-634)
  - Redesigned the engagement cards to match the new design system
  - Added a new section to the engagement page to display suggested engagements
  - Engagement cards now take you to the "new look" route
  - Tweaks to the engagement list page layout
  - Minor tweaks to the engagement view page layout

## June 24, 2024

- **Feature** Add a new survey block to the engagement page [🎟️ DESENG-633](https://citz-gdx.atlassian.net/browse/DESENG-633)
  - Added a survey block to the new engagement page matching the designs from UX
  - The survey block displays side-by-side with the second widget of the engagement
  - The survey block is not displayed if there is no survey and no second widget
  - Customized the rich text editor/display to render links and h2 elements using the correct components
  - Transitioned many new design system components to rely on Material theming for colors and typography,
    allowing for areas with dark backgrounds to have light text and vice versa
  - Moved useLoaderData() calls to within smaller components to reduce prop drilling, improve readability,
    make it easier to test components in isolation, and make it easier to create skeletons for loading states

## June 19, 2024

- **Feature** Add a new tabbed content view to the new engagement page [🎟️ DESENG-632](https://citz-gdx.atlassian.net/browse/DESENG-632)
  - Added a new tabbed content view to the new engagement page
  - Tabs are pulled from the engagement's summary and custom content sections (to be revisited when redoing authoring flow)

## June 18, 2024

- **Feature** Add language picker UI [🎟️ DESENG-623](https://citz-gdx.atlassian.net/browse/DESENG-623)

## June 17, 2024

- **Feature** Add engagement description to the engagement page [🎟️ DESENG-631](https://citz-gdx.atlassian.net/browse/DESENG-631)
  - Display engagement description on the new engagement page
  - Display first widget of the engagement beside the description
  - Limit text editor to remove disruptive formatting options

## June 11, 2024

- **Feature** Add new header to "new look" engagement page [🎟️ DESENG-630](https://citz-gdx.atlassian.net/browse/DESENG-630)
  - Added a new hero image to the new engagement page
  - Added a header overlaying the hero image
    - The header uses the sponsor name, CTA message, and CTA URL from DESENG-629, as well as the engagement title, dates, and status
  - Added new engagement status chips for use in the header
  - Added link from the old engagement page offering the option to preview the new engagement page
  - Added global width limit to the public view to avoid display issues on very wide screens
- **Task** De-duplicate link code and only use \<Link>s from the common/Navigation module

## June 10, 2024

- **Feature** Add new fields for use in "new look" design [🎟️ DESENG-629](https://citz-gdx.atlassian.net/browse/DESENG-629)
  - Added the fields `sponsor_name`, `cta_message`, and `cta_url` to the engagement model
  - Added Sponsor Name, Call To Action, and CTA URL to the engagement form
  - Added basic validation for the new fields

## June 6, 2024

- **Feature** Add a new engagement view page [🎟️ DESENG-636](https://citz-gdx.atlassian.net/browse/DESENG-636)
  - Added a new page to view engagements using the new look for MET
  - The page is available at `/gdx/new-look/[name]/[language]`
  - The page is a work in progress and will be updated in the future
- **Feature** Use createBrowserRouter insead of \<BrowserRouter> in the App component [🎟️ DESENG-627](https://citz-gdx.atlassian.net/browse/DESENG-627)
  - Updated the App component to use the more flexible createBrowserRouter function instead of the <BrowserRouter> component
  - This enables the use of [data router](https://reactrouter.com/en/6.23.0/routers/picking-a-router) functionality and other advanced features in the future, most notably the Blocker component
  - Added the AutoBreadcrumbs component to the common components library, which will be used to generate breadcrumbs based on the current route
  - Updated the Tenant Admin pages as a proof of concept
    - Tenant Admin pages now use the AutoBreadcrumbs component to generate breadcrumbs based on the current route
    - Tenant Admin pages use data loaders to fetch data from the API instead of relying on a state or context
    - Tenant Admin pages use useBlocker() to prompt for confirmation from users navigating away from the page when they're in the middle of editing a form

## June 3, 2024

- **Bugfix** Patch button styles (follow-up to [🎟️ DESENG-583](https://citz-gdx.atlassian.net/browse/DESENG-583))
  - Fixed button styles to match the design system
  - Removed state management overhead from the Link component

## May 30, 2024

- **Feature** Remove web components [🎟️ DESENG-616](https://citz-gdx.atlassian.net/browse/DESENG-616)
  - Removed web components and all code that references it
- **Feature** Remove EAO process widget [🎟️ DESENG-626](https://citz-gdx.atlassian.net/browse/DESENG-626)
  - Removed EAO process widget
  - Added migration file to remove EAO process widget attached to any existing engagement

## May 29, 2024

- **Bugfix** Null in the public URL [🎟️ DESENG-625](https://citz-gdx.atlassian.net/browse/DESENG-625)
  - Removed language from URLs other than engagement/survey links
  - Fixed the issue of null appearing in public URLs
- **Feature** MET split out tenant specific variables from locale files [🎟️ DESENG-612](https://citz-gdx.atlassian.net/browse/DESENG-612)
  - Replaced tenant based values with data from tenant detail API

## May 27, 2024

- **Feature** MET translation file keys used on pages needing translation [🎟️ DESENG-611](https://citz-gdx.atlassian.net/browse/DESENG-611)
  - Removed Tenant based translations from langauge files
  - Set TODO statements to replace tenant related values from backend
  - Splitting translations based on language files and added a common translation file for items common across all languages
- **Bugfix** Global Focus State (UXD) [🎟️ DESENG-583](https://citz-gdx.atlassian.net/browse/DESENG-583)
  - Worked on components to match the design system and support new colors
  - Implemented focus states across public pages and components

## May 23, 2024

- **Feature** Finish tenant management UX [🎟️ DESENG-605](https://citz-gdx.atlassian.net/browse/DESENG-605), [🎟️ DESENG-606](https://citz-gdx.atlassian.net/browse/DESENG-606)
  - Added a new tenant detail page
  - Added a form for filling out tenant details
  - Added a new tenant creation page
  - Added a new tenant edit page
- **Feature** Add design system components to common components
  - Added Table components, DetailsContainer, and Detail for layout
  - Reworked button components to match the design system and support new colors
  - Reworked modal components to match the design system
  - Reworked image upload component to match the design system
  - Added new form components that align with the design system
- **Bugfix** Security issue with email verification [🎟️ DESENG-618](https://citz-gdx.atlassian.net/browse/DESENG-618)
  - Removed verification token from the response object
  - Updated the test to reflect the change
- **Bugfix** Add try catch block around snowplow call [🎟️ DESENG-621](https://citz-gdx.atlassian.net/browse/DESENG-621)
  - Added a try catch block to all snowplow calls

## May 22, 2024

- **Feature** Add languages side nav link [🎟️ DESENG-622](https://citz-gdx.atlassian.net/browse/DESENG-622)

## May 21, 2024

- **Task** Clean up met-cron [🎟️ DESENG-602](https://citz-gdx.atlassian.net/browse/DESENG-602)

## May 16, 2024

- **Bugfix** Replace Material Icons with Font Awesome [🎟️ DESENG-608](https://citz-gdx.atlassian.net/browse/DESENG-608)
  - Replaced Material Icons with Font Awesome for all icons for which we had a mapping
  - Noted a few icons for which we did not have a mapping and those have been added to the ticket

## May 14, 2024

- **Bugfix** Add language code to email links [🎟️ DESENG-579](https://citz-gdx.atlassian.net/browse/DESENG-579)
  - Added a language code to email template links so that they point to a valid page again
  - The system tries to determine the language from the user's browser, but if it can't, it defaults to English
  - A future, larger refactor could allow us to remember the user's language preference and always use that

## May 13, 2024

- **Bugfix** Date shown on rejection email preview is incorrect [🎟️ DESENG-597](https://citz-gdx.atlassian.net/browse/DESENG-597)
  - Fixed the date formatting issue and using the end_date in the email preview
  - Updated unit tests
- **Feature** Create role for metadata management [🎟️ DESENG-603](https://citz-gdx.atlassian.net/browse/DESENG-603)
  - Implemented a new role named "manage_metadata" within the Admin group to restrci access for metadata management
  - Updated the frontend to restrict access to the "metadata management" link in the menu for users without the newly added role
  - Backend changes to incorporate the new role for access control purposes, ensuring only authorized users can perform metadata management actions

## May 10, 2024

- **Bugfix** Language picker should only appear on engagements with more than one language [🎟️ DESENG-575](https://citz-gdx.atlassian.net/browse/DESENG-575)
  - Allow for the web app to see if there are available translations by language
  - Disable language switching itself for now until design decisions are made

## May 9, 2024

- **Feature** [Engagement Filtering UXD] - Public | No Results Message [🎟️ DESENG-586](https://citz-gdx.atlassian.net/browse/DESENG-586)
  - Added a new no results page to display to users when their search term(s) and / or filter(s) returns no engagement results on landing page.
  - Contact information is developed but hidden currently as this was the approach requested in the ticket till the contact information is decided.
- **Feature** Added the initial version of the tenant listing page [🎟️ DESENG-592](https://citz-gdx.atlassian.net/browse/DESENG-592)
  - The page lists all tenants in the system
  - Functionality to view or create individual tenants is still under construction
  - Began work on adding new components from the MET component library, with high reusability in mind

## May 8, 2024

- **Feature** Add font awesome to MET web [🎟️ DESENG-543](https://citz-gdx.atlassian.net/browse/DESENG-543)
  - Added font awesome to MET web.
  - Created .npmrc file to set the registry for fontawesome
  - Updated github actions to pull fontawesome auth token from github secrets

## May 7, 2024

- **Feature** Ensure users can belong to more than one tenant [🎟️ DESENG-478](https://citz-gdx.atlassian.net/browse/DESENG-478)
  - Tested users can belong to more than one tenant.
  - Overide the default tenant filter for staff_user table to check with user_group_membership table.

## May 6, 2024

- **Feature** Auto-populate question descriptions [🎟️ DESENG-596](https://citz-gdx.atlassian.net/browse/DESENG-596)
  - Upgrading the version of met-formio to version 1.0.15-rc1. This version has the changes to have a default
    description for the form components. The changes were pushed to met-formio by the PR: https://github.com/bcgov/met-formio/pull/25.

## May 2, 2024

- **Feature** Added a new landing page for tenant management [🎟️ DESENG-591](https://citz-gdx.atlassian.net/browse/DESENG-591)
  - The page will be updated to list and manage tenants in upcoming tickets.

## April 30, 2024

- **Task** Dagster ETL error [DESENG-599](https://citz-gdx.atlassian.net/browse/DESENG-599)
  - Upgrading the version of python to 3.12 for dagster user code
  - Upgrading the dependencies to support the version of python.
  - Fixing a bug on survey etl service.
- **Feature** Add Super Admin role [🎟️ DESENG-557](https://citz-gdx.atlassian.net/browse/DESENG-557)
  - Added a new role, `SUPER_ADMIN`, to MET.
  - The `SUPER_ADMIN` role has the highest level of access in the MET application.
  - The `SUPER_ADMIN` role can perform all actions in MET, including actions in other tenants.
  - The role can be only be assigned through the single sign-on (SSO) service.
  - This overrides any other permissions set, e.g, a Viewer user who gets the super_admin role
    will have all the permissions of a normal super admin.
  - Change the React app's admin role to `SUPER_ADMIN` (previously `CREATE_TENANT`).
  - Force all UI elements to be enabled for the `SUPER_ADMIN` role.
  - Added unit tests for the new role, and updated an existing test related to cross-tenant access.

## April 29, 2024

- **Task** Upgrade python to 3.12 [DESENG-466](https://citz-gdx.atlassian.net/browse/DESENG-466)
  - Upgrading the version of python to 3.12
  - Upgrading the dependencies to support the version of python.
  - Modify code as needed if the newer version does not support the former.

## April 22, 2024

- **Task** Openshift - Update the buildconfig for the MET-cron job runner [🎟️ DESENG-559](https://citz-gdx.atlassian.net/browse/DESENG-559)
  - Versioning now uses the openshift.io namespace
- **Task** In-app role management [DESENG-574](https://citz-gdx.atlassian.net/browse/DESENG-574)
  - Introduced new database models to manage user roles and user-to-role mappings in the Met database.
  - Revamped the authentication validation process to rely on roles retrieved directly from the database,
    rather than relying solely on token-based roles.
  - Eliminated redundant or unused roles from the system.
  - Updated unit tests to to fetch roles directly from the database instead of relying on role generation from the factory and eliminated the Keycloak mock.
  - Renamed admin and viewer role.
  - Removed the usage of CSS API for role management.

## April 11, 2024

- **Task** Multi-language - Create engagement content translation tables & API routes [DESENG-544](https://citz-gdx.atlassian.net/browse/DESENG-544)
  - Created a new table for engagement content translations
  - Created API routes and services for engagement content translations
  - Created Unit tests for engagement content translations

## April 10, 2024

- **Task** Remove default taxa from GDX tenant [DESENG-578](https://citz-gdx.atlassian.net/browse/DESENG-578)
  - Removed the pre-populated taxon entries from the GDX tenant.
  - With the power of the editor interface, tenants are now expected to create their own taxon entries.
- **Task** Update contributing guide for developers [DESENG-475](https://citz-gdx.atlassian.net/browse/DESENG-475)

## April 09, 2024

- **Bugfix**: Stop Axios from trying to be a smarty pants and sending data in a format Flask doesn't understand [🎟️ DESENG-580](https://citz-gdx.atlassian.net/browse/DESENG-580)
  - This was preventing the filtering feature from working
  - Directly serialize any metadata filters before the request to avoid Axios's new nested object serialization
  - Deserialize it again on the Flask side
- **Task**: MET Web - Some URLs not taking users to correct locations/timing out [DESENG-542](https://citz-gdx.atlassian.net/browse/DESENG-542)
  - Created authentication provider to know the logged-in state before the App component is rendered.
  - Optimized tenant identification from the url.
  - Optimized path segments identification.
- **Task**: CSS Selector specificity [🎟️ DESENG-577](https://citz-gdx.atlassian.net/browse/DESENG-577)
  - Replace the `!important` flag with more specific CSS selectors, specifically within dropdowns,
    to ensure that the correct styles are applied, and that states we have not yet designed for
    (e.g, complex focus states) are still styled appropriately and in an accessible manner.
  - Soon, we will be doing a more in-depth revamp of dropdowns in the app to make them more
    accessible and user-friendly. This helps work towards that goal.
- **Bugfix**: MET Web - No save feedback unless main content tab is selected [🎟️ DESENG-541](https://citz-gdx.atlassian.net/browse/DESENG-541)
  - Implemented notifications for successful saves across all engagement tabs.
  - Resolved issue with saving engagement summary content during engagement creation.
  - Updated tooltip on engagement content to use MetTooltip for consistency.

## April 08, 2024

- **Bugfix**: Submission of rejected comments [🎟️ DESENG-527](https://citz-gdx.atlassian.net/browse/DESENG-527)
  - Fixed issue where resubmitted comments would not reappear in the queue for approval.
  - Added unit tests to ensure the issue does not reoccur.
- **Task**: MET - Clean up outstanding dependabot PRs [DESENG-535](https://citz-gdx.atlassian.net/browse/DESENG-535)
  - Bump axios from 0.26.1 to 0.28.0 in met-web. Dependabot suggested this upgrade, but it required a few minor code changes.
  - Updated the type definition of the 'error' parameter to include a generic type '{ message?: string }' to handle the AxiosError response properly.

## April 05, 2024

- **Task**: Allow for any gov.bc.ca email to receive emails in MET's dev & test environments [DESENG-533](https://citz-gdx.atlassian.net/browse/DESENG-533)
  - Enabled dev open shift to use GC_NOTIFY api key of test which allows all email.
  - Added new env var `SEND_EMAIL_INTERNAL_ONLY` to allow for internal emails such as govt emails only.

## April 04, 2024

- **Feature** Engagement filtering - Add filtering by taxon [🎟️DESENG-445](https://citz-gdx.atlassian.net/browse/DESENG-445)
  - Added properties to metadata taxa to allow them to be marked as filterable.
  - Added a new file `filter_types.py` where additional filters can be added as subquery factory functions.
  - Added a new endpoint to the API to retrieve filterable taxa.
  - Modified the search endpoint to allow filtering by metadata.
  - Added schemas, data validation and unit tests for the new functionality.
  - Updated the Metadata Management UI to allow taxa to be marked as filterable.
    - Currently, the only two filter types are `chips_any` and `chips_all`.
    - `chips_any`: Displays as a series of toggleable buttons ("chips"), uses the `list_match_any` subquery returning engagements with any of the selected values.
    - `chips_all`: Similar to chips_any; uses the `list_match_all` subquery to get only engagements with ALL of the selected values.
  - If multiple filterable taxa are selected, all the taxon filters must be met for an engagement to be returned.
  - Updated the public-facing engagement list to allow filtering by metadata taxa. This makes use of the new API endpoint to retrieve filterable taxa.
  - Added a new filter "drawer" to the listing page to hold these and any future filter types.
  - (Out of scope, but related to UX work for this ticket) Fixed a display issue with the public engagements page where engagements would not take up the full width of their grid cell.
- **Task**: Keycloak Unit Tests for New CSS API Integration [DESENG-508](https://citz-gdx.atlassian.net/browse/DESENG-508)
  - Updated Keycloak Unit Tests for New CSS API Integration.

## April 02, 2024

- **Task**: DEV clean up [DESENG-503](https://citz-gdx.atlassian.net/browse/DESENG-503)
  - Updated deployment configurations to add new configs.

## March 28, 2024

- **Bug Fix**: Feedback fixes [DESENG-524](https://citz-gdx.atlassian.net/browse/DESENG-524)
  - Fixed feedback path not updating issue.
  - Fixed feedback table grid styles.

## March 27, 2024

- **Bug Fix**: MET - Engagement tab does not revert the filtered out data [DESENG-525](https://citz-gdx.atlassian.net/browse/DESENG-525)
  - Resetting search filter values invoke the list to reload
- **Task**: Add missing unit tests for analytics api [DESENG-482](https://citz-gdx.atlassian.net/browse/DESENG-482)
  - Added unit tests for analytics API models and API end points

## March 26, 2024

- **Bug Fix**: Various bugs in the survey tab [DESENG-520](https://citz-gdx.atlassian.net/browse/DESENG-523)
  - Update survey components and services to fix the bugs.
    - Removed is_template and is_hidden values from autosaving to avoid the debounce function consuming it older values
- **Task**: Add a custom dynamic page to engagement [DESENG-501](https://citz-gdx.atlassian.net/browse/DESENG-501)
  - Integrated new summary and custom content tabs into the engagement form, providing users with structured sections for managing different types of content, enhancing overall organization and user experience.
  - Implemented functionality to allow users to add custom tabs with a variety of provided icons, along with options to edit or delete tabs as needed, granting users greater flexibility and control over their engagement content layout.
  - Streamlined data management by transitioning content and rich content from engagement tables to dedicated content tables, while also implementing logic to automatically generate default summary and custom content upon engagement creation or tab addition, ensuring consistent content structure and user experience.

## March 21, 2024

- **Task**: MET Web - Replace hover & background colours [DESENG-520](https://citz-gdx.atlassian.net/browse/DESENG-520)
  - Update Table and Menu Dropdown hover colors
  - Update engagement tiles hover color.
  - Updated all white backgrounds to use css variable.

## March 19, 2024

- **Task**: Add poll results to results tab [DESENG-513](https://citz-gdx.atlassian.net/browse/DESENG-513)
  - Added poll results to results tab.
  - Added poll results API.
  - Added Unit tests.
- **Task**: Change static english text to be able to support string translations [DESENG-467](https://citz-gdx.atlassian.net/browse/DESENG-467)
  - Implemented a language selector in the public header.
  - Incorporated logic to dynamically adjust the unauthenticated route based on the selected language and load the appropriate translation file.
  - Enhanced all public pages to fetch static text from the translation file.

## March 15, 2024

- **Task**: Multi-language - Create event, subcribe_item, poll, timeline widget translation tables & API routes [DESENG-515](https://citz-gdx.atlassian.net/browse/DESENG-515)
  - Added Poll answer translation API.
  - Added Timeline Event translation API.
  - Added Subscribe Item translation API.
  - Added Event item translation API
  - Added Unit tests.
- **Task** Add "Results" page to engagements [DESENG-512](https://citz-gdx.atlassian.net/browse/DESENG-512)

## March 08, 2024

- **Task**: Multi-language - Create engagement translation table & API routes [DESENG-510](https://citz-gdx.atlassian.net/browse/DESENG-510)
  - Added Engagement translation model.
  - Added Engagement translation API.
  - Added Unit tests.

## March 07, 2024

- **Task**: Remove "default_values" from metadata taxa.
  Replace with "preset values", metadata entries that are not assigned to an engagement.
- **Task**: Update authorization documentation in the API blueprint. Update
  metadata management to rely on normal authorization check functions.
- **Task**: Clean up metadata management code and tests.
- **Task**: Add endpoint for updating metadata by taxon in bulk
- **Feature**: Add editor for metadata taxa (admin only). [🎟️DESENG-443](https://citz-gdx.atlassian.net/browse/DESENG-443)
- **Feature**: Add editor for metadata entries (available to anyone who can
  edit an engagement). [🎟️DESENG-443](https://citz-gdx.atlassian.net/browse/DESENG-443)

## March 06, 2024

- **Task**Multi-language - Create simple widget translation tables & API routes [DESENG-514](https://citz-gdx.atlassian.net/browse/DESENG-514)
  - Added Widget translation model.
  - Added Widget translation API.
  - Added Unit tests.
- **Task**Multi-language - Create survey translation table & API routes [DESENG-511](https://citz-gdx.atlassian.net/browse/DESENG-511)
  - Added Survey Translation model.
  - Added Survey Translation API.
  - Added Survey Translation tests.

## March 04, 2024

- **Task**Engagement "save" enhancements [DESENG-507](https://citz-gdx.atlassian.net/browse/DESENG-507)
  - The existing "Save" button in the floating bar has been split into two distinct actions: "Save and Continue" and "Save and Exit".
  - Tabs are greyed out, and widgets are disabled until the engagement is successfully saved. A helpful tool-tip has been added to inform users that the engagement needs to be saved before accessing certain features.
  - Independent save buttons previously present in tabs, such as "Additional Details", "Settings" have been removed. Now, the floating save bar is universally employed when editing an engagement.
- **Task**Multi-language - Create language table & API [DESENG-509](https://citz-gdx.atlassian.net/browse/DESENG-509)
  - Added Language model.
  - Added Language API.
  - Added Unit tests.

## February 27, 2024

- **Bug Fix**Comments cannot be approved while reviewing [DESENG-496](https://citz-gdx.atlassian.net/browse/DESENG-496)
  - Fixed by adding a missing decorator for transactional methods.
- **Task**Enhance analytics api for Improved Readability and Maintainability [DESENG-492](https://citz-gdx.atlassian.net/browse/DESENG-492)
  - Refactor analytics-api config to harmonize its structure and conventions with met-api.
  - Ensure the sample.env file maintains consistent formatting.
  - Adjusted the component_id column size in the comment table of the met-api to resolve an error encountered during user submissions.

## February 26, 2024

- **Task**Models for dynamic engagement pages [DESENG-500](https://citz-gdx.atlassian.net/browse/DESENG-500)
  - Implemented endpoints for dynamic engagement pages, including summary and custom sections.
  - Default behavior ensures that each engagement has a dynamic summary page.
  - Introduced logic to migrate existing content and rich content for engagements to the summary table.
- **Task**Add font awesome libraries [DESENG-490](https://citz-gdx.atlassian.net/browse/DESENG-490)
  - Added related libraries to the frontend package.json.
- **Task**Adding missing unit test [DESENG-483](https://citz-gdx.atlassian.net/browse/DESENG-483)
  - Added missing unit test for components.

## February 20, 2024

- **Task**Upgrade the version of flask [DESENG-502](https://citz-gdx.atlassian.net/browse/DESENG-502)
  - Performed a Flask version upgrade to version 2.2.5.

## February 16, 2024

- **Task**Make a floating save/preview bar when editing engagements [DESENG-498](https://citz-gdx.atlassian.net/browse/DESENG-498)
  - Implemented a floating behavior for the save/preview buttons during engagement editing. This feature persists across all tabs but exclusively saves data for the Engagement Content tab.

## February 15, 2024

- **Task**Restore role assignment functionality to MET with the CSS API [DESENG-473](https://citz-gdx.atlassian.net/browse/DESENG-473)
  - Utilize the CSS API for efficient management of composite roles. This involves the assignment, reassignment, or removal of users from the composite roles of TEAM_MEMBER, REVIEWER, IT_ADMIN, or IT_VIEWER.

## February 09, 2024

- **Task**Consolidate and re-write old migration files [DESENG-452](https://citz-gdx.atlassian.net/browse/DESENG-452)
  - Deleted old migration files
  - Created [ec0128056a33_table_until_feb_09_2024.py](met-api/migrations/versions/ec0128056a33_table_until_feb_09_2024.py) with all tables until feb 09 2024
  - Created [37176ea4708d_data_until_feb_09_2024.py](met-api/migrations/versions/37176ea4708d_data_until_feb_09_2024.py) with all initial data until feb 09 2024

## February 08, 2024

- **Task**Cache CORS preflight responses with the browser for a given period of time [DESENG-484](https://citz-gdx.atlassian.net/browse/DESENG-484)
  - Introduces a new configuration variable to specify the maximum age for Cross-Origin Resource Sharing (CORS)
  - Modified the CORS preflight method to utilize this newly introduced variable.
- **Task**Consolidate and re-write old migration files [DESENG-452](https://citz-gdx.atlassian.net/browse/DESENG-452)
  - Change some foreign key field to nullbale false in model files
  - Change `rejected_reason_other` to nullable true in `submission` model
  - Generated new migration file based on the pending model changes which confirmed to be valid
  - Updated Unit test of email verfication to send type to the api

## February 06, 2024

- **Task**Convert keycloak groups to composite roles for permission levels [DESENG-447](https://citz-gdx.atlassian.net/browse/DESENG-447)
  - Commented out unit test related to Keycloak groups
  - Changed reference of Keycloak `groups` to `roles`
  - Commented out code related to Keycloak groups

## February 06, 2024

- **Task** Streamline CRON jobs [DESENG-493](https://citz-gdx.atlassian.net/browse/DESENG-493)
  - Aligned the CRON configuration and sample environment files with the structure used in the Met API.
  - Eliminated the reliance on engagement metadata within CRON jobs.
  - Implemented necessary code adjustments to seamlessly integrate with the updated CRON configuration.

## February 05, 2024

- **Task** Change "Superuser" to "Administrator" [DESENG-476](https://citz-gdx.atlassian.net/browse/DESENG-476)

## February 02, 2024

- **Task** Updated Timeline widget icons so that the circles are more consistent. [🎟️DESENG-488](https://citz-gdx.atlassian.net/browse/DESENG-488)

## February 01, 2024

- **Task** Change name from "Engagement Core" to "Engagement Content". [🎟️DESENG-489](https://citz-gdx.atlassian.net/browse/DESENG-489)

## January 29, 2024

- **Task** Updated Babel Traverse library. [🎟️DESENG-474](https://citz-gdx.atlassian.net/browse/DESENG-474)
  - Run `npm audit fix` to update the vulnerable Babel traverse library.

## January 26, 2024

- **Task** Poll Widget: Front-end. [🎟️DESENG-464](https://citz-gdx.atlassian.net/browse/DESENG-464)
  - Created UI for Poll Widget.
  - Updated Poll widget API and unit tests.

## January 25, 2024

- **Task** Resolve issue preventing met-web from deploying on the Dev OpenShift environment. [🎟️DESENG-469](https://citz-gdx.atlassian.net/browse/DESENG-469)
  - Remove Epic Engage-related links and update Keycloak link.
  - Remove additional authentication method.

## January 24, 2024

- **Task** Update default project type to GDX for all deployments by default. [🎟️DESENG-472](https://citz-gdx.atlassian.net/browse/DESENG-472)
  - Set the default project type to GDX on all continuous deployment (CD) files.
  - Removed the option to deploy to EAO.

## January 22, 2024

- **Task** Poll Widget: Back-end [🎟️DESENG-463](https://citz-gdx.atlassian.net/browse/DESENG-463)
  - Created Database models for Widget Poll, Poll Answers, Poll Response.
  - Created API to manage Widget Poll, Poll Answers, Poll Response.
  - Created Unit tests to test the code.
- **Task** Add missing unit tests for met api [🎟️DESENG-481](https://citz-gdx.atlassian.net/browse/DESENG-481)
  - Added missing unit tests for met api
  - Added unit tests for error handling for met api

## January 19, 2024

- **Feature**: Add metadata management to the API [🎟️DESENG-442](https://citz-gdx.atlassian.net/browse/DESENG-442)
  - Add new models, services, and endpoints for metadata and metadata taxonomy
  - Add test coverage for new endpoints
  - Begin documenting new endpoints using Flask-RESTX
  - Add new endpoints to the API blueprint
  - Enabled pylint for flask and flask_sqlalchemy in vscode
  - Created a new "transactional" decorator to wrap model methods in a transaction that safely rolls back on error
  - Stub out frontend components for metadata management in preparation for the next step
- **Task**: Continue switching staff users to db-based (rather than keycloak based) authentication

## January 15, 2024

- **Task** Audit for missing unit tests [🎟️DESENG-436](https://citz-gdx.atlassian.net/browse/DESENG-436)
  - Corrected tests to execute smoothly in the local environment using development variables.
  - Established continuous integration configuration to automatically run tests upon each commit.
  - Ensured that the tests pass successfully in our GitHub test environment.
- **Task** Audit for missing unit tests [🎟️DESENG-449](https://citz-gdx.atlassian.net/browse/DESENG-449)
  - Identified and corrected failing unit test for api and web
- **Bug Fix**: Fixing Form.io error when reordering Radio Button options [🎟️DESENG-446](https://citz-gdx.atlassian.net/browse/DESENG-446)

## January 10, 2024

- **Task** Custom Consent per Engagement [🎟️DESENG-456](https://citz-gdx.atlassian.net/browse/DESENG-456)
- **Task** Engagement Edit Screen Reorder/Redesign [🎟️DESENG-448](https://citz-gdx.atlassian.net/browse/DESENG-448)
  - Added new tab Addional Details and moved metadata inside that
  - Moved public url section inside Settings tab
  - Changed Engagement Details to Engagement Core
  - Removed Links tab

## January 9, 2024

- **Task** Improvements from Epic [🎟️DESENG-468](https://citz-gdx.atlassian.net/browse/DESENG-468)
  - Improvements to Survey Result Tracking analytics
  - New Rejection Email Template for Closed Engagements
  - Export Format for Proponent updated to be in excel format
  - Formio Version Update
  - Enable Survey Editing for Open Engagements
- **Bug Fix**: Fixing timezone issue while publishing using met cron [🎟️DESENG-437](https://citz-gdx.atlassian.net/browse/DESENG-437)

## December 28, 2023

- **Feature**: Added the timeline widget. [🎟️DESENG-439](https://citz-gdx.atlassian.net/browse/DESENG-439)

## December 11, 2023

- **Task** Merge `gdx-sso`, `gdx-dev`, `gdx-main` into `main` [🎟️DESENG-442](https://citz-gdx.atlassian.net/browse/DESENG-442)

## December 5, 2023

- **Task** Remove unused project metadata [🎟️DESENG-441](https://citz-gdx.atlassian.net/browse/DESENG-441)

## December 4, 2023

- **Feature**: .env var audit and cleanup [🎟️DESENG-414](https://citz-gdx.atlassian.net/browse/DESENG-414) (work finished)
  - Full rewrite of met_api/config.py
  - Sample .env files updated to capture all current settings
  - Changed many configs to use a nested dict structure
  - Changed all configs to use get_named_config() to access settings
  - SQLAlchemy now generates its url based on db settings
  - Default settings are handled more gracefully
  - Enable file-watching reloader and debugger for development environments
  - Inline documentation added in config.py
  - Removed unused settings

## November 29, 2023

- **Feature**: Superusers can publish engagements without attached surveys [🎟️DESENG-438](https://citz-gdx.atlassian.net/browse/DESENG-438)

## November 21, 2023

- **Feature**: Started logging source url path with feedback submission. Viewable in dashboard. [🎟️DESENG-415](https://citz-gdx.atlassian.net/browse/DESENG-415)

## November 11, 2023

- **Bug Fix**: Removed a duplicate service class [🎟️DESENG-429](https://citz-gdx.atlassian.net/browse/DESENG-429)

## November 6, 2023

- **Feature**: Switch MET to use Keycloak SSO service [🎟️DESENG-408](https://citz-gdx.atlassian.net/browse/DESENG-408)
  - Switch all role-based checks on the API to use a single callback function (`current_app.config['JWT_ROLE_CALLBACK']`)
  - Added a configurable path `JWT_ROLE_CLAIM` to indicate where your SSO instance places role information in the JWT token. If your access token looks like:
    `{ ..., "realm_access": { "roles": [ "role1", "role2"]}}` you would set `JWT_ROLE_CLAIM=realm_access.roles`
  - Explicitly disable single tenant mode by default to ensure correct multi-tenancy behaviour
  - Remove local Keycloak instances and configuration
  - Default to the "standard" realm for Keycloak
  - Use tenancy information from DB rather than Keycloak
- **Feature**: .env var audit and cleanup [🎟️DESENG-414](https://citz-gdx.atlassian.net/browse/DESENG-414)

## October 26, 2023

- **Bug Fix**: Upgraded BC-Sans font to the newest version [🎟️DESENG-413](https://citz-gdx.atlassian.net/browse/DESENG-413)

## October 19, 2023

- **Feature**: Update sample .env files [🎟️DESENG-414](https://citz-gdx.atlassian.net/browse/DESENG-414)
  - Sample .env files have been updated to reflect the current state of the project.
  - Keycloak URLs and resources now point to the BC Government's SSO service when using `sample.env` as a baseline
  - The `met_api` module has been updated slightly to consume Pathfinder SSO's API schema.
  - Remove one old production .env file with obsolete settings
- Changes to DEVELOPMENT.md to reflect the current state of the project

## v1.0.0 - 2023-10-01

- App handoff from EAO to GDX
- Added changelog
