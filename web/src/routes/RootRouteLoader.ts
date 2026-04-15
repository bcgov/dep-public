import { redirect } from 'react-router';
import { AppConfig } from 'config';
import { getTenant } from 'services/tenantService';
import { Tenant } from 'models/tenant';
import { Languages } from 'constants/language';

export interface RootLoaderTenantData {
    id: string;
    name: string;
    heroImageUrl: string;
    basename: string;
    title: string;
    contact_email: string;
    contact_name: string;
    description: string;
    short_name: string;
    hero_image_description: string;
    hero_image_credit: string;
}

export interface RootLoaderData {
    tenant: RootLoaderTenantData;
    preferredLanguageId: string;
    translations: Promise<RootLoaderTranslations>;
}

export interface RootLoaderTranslations {
    [languageId: string]: { [key: string]: string };
}

const getBasenameFromRequest = (request: Request) => {
    const pathname = new URL(request.url).pathname;
    const pathSegments = pathname.split('/').filter((segment) => segment.trim() !== '');
    return pathSegments.length > 0 ? pathSegments[0].toLowerCase() : '';
};

const toRootLoaderTenantData = ({
    tenant,
    id,
    basename,
}: {
    tenant: Tenant;
    id: string;
    basename: string;
}): RootLoaderTenantData => ({
    id,
    name: tenant.name ?? tenant.title,
    heroImageUrl: tenant.hero_image_url ?? '',
    basename,
    title: tenant.title,
    contact_email: tenant.contact_email ?? '',
    contact_name: tenant.contact_name ?? '',
    description: tenant.description ?? '',
    short_name: tenant.short_name,
    hero_image_description: tenant.hero_image_description ?? '',
    hero_image_credit: tenant.hero_image_credit ?? '',
});

const getTranslationFile = async (localeId: string) => {
    try {
        return await import(`../locales/${localeId}.json`);
    } catch {
        return await import(`../locales/en.json`);
    }
};

const preloadTranslations = async (): Promise<RootLoaderTranslations> => {
    const translationEntries = await Promise.all(
        Object.values(Languages).map(async (languageId) => {
            const file = await getTranslationFile(languageId);
            return [languageId, file] as const;
        }),
    );

    const translations: RootLoaderTranslations = {};
    translationEntries.forEach(([languageId, file]) => {
        translations[languageId] = file.default;
    });

    const commonTranslations = await getTranslationFile('common');
    translations.common = commonTranslations.default;

    return translations;
};

export const rootLoader = async ({ request }: { request: Request }): Promise<RootLoaderData> => {
    const defaultTenant = AppConfig.tenant.defaultTenant;
    const preferredLanguageId = sessionStorage.getItem('languageId') ?? AppConfig.language.defaultLanguageId;
    const translations = preloadTranslations();

    if (AppConfig.tenant.isSingleTenantEnvironment) {
        const tenant = await getTenant(defaultTenant);
        return {
            tenant: toRootLoaderTenantData({ tenant, id: defaultTenant, basename: '' }),
            preferredLanguageId,
            translations,
        };
    }

    const basename = getBasenameFromRequest(request);

    if (!basename) {
        if (defaultTenant) {
            throw redirect(`/${defaultTenant}`);
        }
        throw new Response('Tenant not found', { status: 404 });
    }

    const tenant = await getTenant(basename);

    return {
        tenant: toRootLoaderTenantData({ tenant, id: basename, basename }),
        preferredLanguageId,
        translations,
    };
};

export default rootLoader;
