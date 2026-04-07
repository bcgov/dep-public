declare global {
    interface Window {
        _env_: {
            [key: string]: string;
        };
    }
}

const getEnv = (key: string, defaultValue = '') => {
    return window._env_[key] ?? process.env[key] ?? defaultValue;
};

const API_URL = getEnv('REACT_APP_API_URL');
const PUBLIC_URL = getEnv('REACT_APP_PUBLIC_URL');
const REACT_APP_ANALYTICS_API_URL = getEnv('REACT_APP_ANALYTICS_API_URL');
const REACT_APP_ENVIRONMENT = getEnv('REACT_APP_ENVIRONMENT', 'development');

// Keycloak Environment Variables
const KC_URL = getEnv('REACT_APP_KEYCLOAK_URL');
const KC_CLIENT = getEnv('REACT_APP_KEYCLOAK_CLIENT');
const KC_REALM = getEnv('REACT_APP_KEYCLOAK_REALM');
const KC_ADMIN_ROLE = getEnv('REACT_APP_KEYCLOAK_ADMIN_ROLE');

// tenant conifg
const IS_SINGLE_TENANT_ENVIRONMENT = getEnv('REACT_APP_IS_SINGLE_TENANT_ENVIRONMENT', 'true') === 'true';
const DEFAULT_TENANT = getEnv('REACT_APP_DEFAULT_TENANT');
const DEFAULT_LANGUAGE_ID = getEnv('REACT_APP_DEFAULT_LANGUAGE_ID');
const DEFAULT_LANGUAGE_NAME = getEnv('REACT_APP_DEFAULT_LANGUAGE_NAME');

// version config
const BUILD_COMMIT_HASH = getEnv('REACT_APP_BUILD_COMMIT_HASH', 'dev');
const BUILD_DATE = getEnv('REACT_APP_BUILD_DATE', 'unknown');
const BUILD_BRANCH = getEnv('REACT_APP_BUILD_BRANCH', 'unknown');
const GITHUB_REPO = getEnv('REACT_APP_GITHUB_REPO', 'https://github.com/bcgov/dep-public');

export const AppConfig = {
    apiUrl: API_URL,
    analyticsApiUrl: REACT_APP_ANALYTICS_API_URL,
    publicUrl: PUBLIC_URL,
    environment: REACT_APP_ENVIRONMENT,
    keycloak: {
        url: KC_URL || '',
        clientId: KC_CLIENT || '',
        realm: KC_REALM || '',
        adminRole: KC_ADMIN_ROLE || 'super_admin',
    },
    tenant: {
        isSingleTenantEnvironment: IS_SINGLE_TENANT_ENVIRONMENT,
        defaultTenant: DEFAULT_TENANT,
    },
    language: {
        defaultLanguageId: DEFAULT_LANGUAGE_ID || 'en',
        defaultLanguageName: DEFAULT_LANGUAGE_NAME || 'English',
    },
    version: {
        commit: BUILD_COMMIT_HASH,
        buildDate: BUILD_DATE,
        branch: BUILD_BRANCH,
        version: BUILD_COMMIT_HASH === 'dev' ? 'dev' : BUILD_COMMIT_HASH.substring(0, 7),
        commitUrl: BUILD_COMMIT_HASH === 'dev' ? undefined : `${GITHUB_REPO}/commit/${BUILD_COMMIT_HASH}`,
    },
};
