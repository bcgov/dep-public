import { ActionFunction } from 'react-router';
import { bulkPatchEngagementMetadata, patchMetadataTaxon } from 'services/engagementMetadataService';

export const metadataAction: ActionFunction = async ({ request }) => {
    const formData = (await request.formData()) as FormData;
    const engagementId = Number(formData.get('engagement_id'));
    if (Number.isNaN(engagementId)) return 'failure';

    // Update custom values
    if (formData.get('custom_values')) {
        try {
            const customValues = JSON.parse(formData.get('custom_values') as string) as {
                taxon_id: number;
                value: string[];
            }[];
            if (Array.isArray(customValues) && customValues.length > 0) {
                const customValuePromises = customValues
                    .filter((cv) => (cv.taxon_id || cv.taxon_id === 0) && cv.value?.length > 0)
                    .map((cv) =>
                        patchMetadataTaxon(cv.taxon_id, {
                            preset_values: cv.value,
                        }),
                    );

                await Promise.all(customValuePromises);
            }
        } catch (e) {
            console.error('Error updating custom metadata options', e);
            return 'failure';
        }
    }

    // Update engagement metadata
    if (formData.get('metadata')) {
        try {
            const metadata = JSON.parse(formData.get('metadata') as string) as Array<{
                taxon_id: number;
                values: string[];
            }>;
            const metadataPromiseArray = metadata.map((m) =>
                bulkPatchEngagementMetadata(m.taxon_id, engagementId, m.values),
            );
            await Promise.all(metadataPromiseArray);
        } catch (e) {
            console.error('Error updating engagement metadata', e);
            return 'failure';
        }
    }

    return 'success';
};

export default metadataAction;
