import React, { createContext, useState, useEffect, useMemo, JSX } from 'react';
import { postEngagement, patchEngagement } from '../../../services/engagementService';
import { useRouteLoaderData, useNavigate, useParams } from 'react-router';
import { EngagementContext, EngagementForm, EngagementFormUpdate, EngagementParams } from './types';
import { createDefaultEngagement, Engagement, EngagementMetadata, MetadataTaxon } from '../../../models/engagement';
import { saveObject } from 'services/objectStorageService';
import { openNotification } from 'services/notificationService/notificationSlice';
import { useAppDispatch, useAppSelector } from 'hooks';
import { getErrorMessage } from 'utils';
import { updatedDiff } from 'deep-object-diff';
import { PatchEngagementRequest } from 'services/engagementService/types';
import { USER_ROLES } from 'services/userService/constants';
import { EngagementStatus } from 'constants/engagementStatus';
import { TenantState } from 'reduxSlices/tenantSlice';
import { EngagementLoaderPublicData } from '../public/view';
import { ROUTES, getPath } from 'routes/routes';

const CREATE = 'create';

export const ActionContext = createContext<EngagementContext>({
    handleCreateEngagementRequest: (_engagement: EngagementForm): Promise<Engagement> => {
        return Promise.reject();
    },
    handleUpdateEngagementRequest: (_engagement: EngagementFormUpdate): Promise<Engagement> => {
        return Promise.reject();
    },
    tenantTaxa: [],
    setTenantTaxa: () => {
        throw new Error('setTenantTaxa is unimplemented');
    },
    setEngagementMetadata() {
        return Promise.reject();
    },
    taxonMetadata: new Map(),
    isSaving: false,
    setSaving: () => {
        /* empty default method  */
    },
    savedEngagement: createDefaultEngagement(),
    engagementMetadata: [],
    engagementId: CREATE,
    handleAddBannerImage: (_files: File[]) => {
        /* empty default method  */
    },
    loadingAuthorization: true,
    isNewEngagement: true,
    setIsNewEngagement: () => {
        /* empty default method  */
    },
});

export const ActionProvider = ({ children }: { children: JSX.Element }) => {
    const { name: tenantName }: TenantState = useAppSelector((state) => state.tenant);
    const { engagementId } = useParams<EngagementParams>();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const { roles, assignedEngagements } = useAppSelector((state) => state.user);

    const [isSaving, setSaving] = useState(false);
    const [loadingAuthorization, setLoadingAuthorization] = useState(true);

    const [tenantTaxa, setTenantTaxa] = useState<MetadataTaxon[]>([]);
    const [savedEngagement, setSavedEngagement] = useState<Engagement>(createDefaultEngagement(tenantName));
    const [isNewEngagement, setIsNewEngagement] = useState(!savedEngagement.id);
    const [engagementMetadata, setEngagementMetadata] = useState<EngagementMetadata[]>([]);
    const [bannerImage, setBannerImage] = useState<File | null>();
    const [savedBannerImageFileName, setSavedBannerImageFileName] = useState('');
    const isCreate = window.location.pathname.includes(CREATE);
    const { engagement, metadata, taxa } = (useRouteLoaderData('single-engagement') ??
        {}) as EngagementLoaderPublicData;

    // Load the engagement from the shared individual engagement loader and watch the engagement variable for any changes.
    useEffect(() => {
        if (!isCreate && isNaN(Number(engagementId))) {
            navigate(getPath(ROUTES.PUBLIC_LANDING));
        }
        if (isCreate && !engagementId) {
            return;
        }
        if (engagementId) {
            engagement.then((result) => {
                setEngagement(result);
            });
        }
    }, [engagement]);

    // Update states based on the loaded engagement.
    const setEngagement = (engagement: Engagement) => {
        setSavedEngagement(engagement);
        setIsNewEngagement(!savedEngagement.id);
        setSavedBannerImageFileName(engagement.banner_filename);

        if (bannerImage) setBannerImage(null);
    };

    // Load the engagement's metadata and taxa from the shared individual engagement loader and watch the metadata and taxa variables for any changes.
    useEffect(() => {
        if (isCreate) {
            return;
        }
        if (!isCreate) {
            metadata?.then((result) => setEngagementMetadata(result));
            taxa?.then((result) => setTenantTaxa(Object.values(result)));
        }
    }, [metadata, taxa]);

    const taxonMetadata = useMemo(() => {
        if (!engagementMetadata || !Array.isArray(engagementMetadata) || engagementMetadata.length < 1)
            return [] as unknown as Map<number, string[]>;
        const taxonMetadataMap = new Map<number, string[]>();
        engagementMetadata.forEach((metadata) => {
            if (!taxonMetadataMap.has(metadata.taxon_id)) {
                taxonMetadataMap.set(metadata.taxon_id, []);
            }
            taxonMetadataMap.get(metadata.taxon_id)?.push(metadata.value);
        });
        return taxonMetadataMap;
    }, [engagementMetadata]);

    const handleAddBannerImage = (files: File[]) => {
        if (files.length > 0) {
            setBannerImage(files[0]);
            return;
        }

        setBannerImage(null);
        setSavedBannerImageFileName('');
    };

    const verifyUserCanEdit = () => {
        const canViewPrivateEngagements = roles.includes(USER_ROLES.VIEW_PRIVATE_ENGAGEMENTS);
        if (canViewPrivateEngagements) {
            setLoadingAuthorization(false);
            return;
        }

        if (isCreate) {
            setLoadingAuthorization(false);
            return;
        }

        if (!savedEngagement.id) {
            return;
        }

        const engagementInDraft = savedEngagement.engagement_status.id === EngagementStatus.Draft;
        const isAssignedToEngagement = assignedEngagements.includes(Number(savedEngagement.id));
        if (!engagementInDraft || !isAssignedToEngagement) {
            navigate(getPath(ROUTES.UNAUTHORIZED));
            return;
        }
        setLoadingAuthorization(false);
    };

    useEffect(() => {
        verifyUserCanEdit();
    }, [savedEngagement, engagementId]);

    const handleCreateEngagementRequest = async (engagementForm: EngagementForm): Promise<Engagement> => {
        setSaving(true);
        try {
            const uploadedBannerImageFileName = await handleUploadBannerImage();
            const result = await postEngagement({
                ...engagementForm,
                banner_filename: uploadedBannerImageFileName,
            });
            setEngagement(result);
            dispatch(openNotification({ severity: 'success', text: 'Engagement has been created' }));
            setSaving(false);
            navigate(getPath(ROUTES.ENGAGEMENT_FORM, { engagementId: result.id }));
            return Promise.resolve(result);
        } catch (error) {
            dispatch(
                openNotification({ severity: 'error', text: getErrorMessage(error) || 'Error Creating Engagement' }),
            );
            setSaving(false);
            console.log(error);
            return Promise.reject(error);
        }
    };

    const handleUploadBannerImage = async () => {
        if (!bannerImage) {
            return savedBannerImageFileName;
        }
        try {
            const savedDocumentDetails = await saveObject(bannerImage, { filename: bannerImage.name });
            return savedDocumentDetails?.uniquefilename || '';
        } catch (error) {
            console.log(error);
            throw new Error('Error occurred during banner image upload');
        }
    };

    const handleUpdateEngagementRequest = async (engagement: EngagementFormUpdate): Promise<Engagement> => {
        setSaving(true);
        try {
            const uploadedBannerImageFileName = await handleUploadBannerImage();

            const engagementEditsToPatch = updatedDiff(savedEngagement, {
                ...engagement,
                banner_filename: uploadedBannerImageFileName,
            }) as PatchEngagementRequest;

            if (Object.keys(engagementEditsToPatch).length === 0) {
                setSaving(false);
                return savedEngagement;
            }

            const updatedEngagement = await patchEngagement({
                ...engagementEditsToPatch,
                id: Number(savedEngagement.id),
                status_block: engagement.status_block?.filter((_, index) => {
                    return engagementEditsToPatch.status_block?.[index];
                }),
            });
            setEngagement(updatedEngagement);
            dispatch(openNotification({ severity: 'success', text: 'Engagement has been saved' }));
            setSaving(false);
            return Promise.resolve(updatedEngagement);
        } catch (error) {
            dispatch(openNotification({ severity: 'error', text: 'Error Updating Engagement' }));
            setSaving(false);
            console.log(error);
            return Promise.reject(error);
        }
    };

    return (
        <ActionContext.Provider
            value={{
                handleCreateEngagementRequest,
                handleUpdateEngagementRequest,
                tenantTaxa,
                setTenantTaxa,
                isSaving,
                setSaving,
                savedEngagement,
                engagementMetadata,
                engagementId,
                handleAddBannerImage,
                setEngagementMetadata,
                taxonMetadata,
                loadingAuthorization,
                isNewEngagement,
                setIsNewEngagement,
            }}
        >
            {children}
        </ActionContext.Provider>
    );
};
