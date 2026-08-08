import { LoaderFunctionArgs, LoaderFunction } from 'react-router';
import { getAllTenants, getTenant } from 'services/tenantService';

export const allTenantsLoader: LoaderFunction = () => {
    const tenants = getAllTenants();
    return { tenants };
};

export const tenantLoader: LoaderFunction = ({ params }: LoaderFunctionArgs) => {
    const { tenantShortName } = params;
    if (!tenantShortName) throw new Error('Tenant ID is required');

    const tenant = getTenant(tenantShortName);
    return { tenant };
};

export default tenantLoader;
