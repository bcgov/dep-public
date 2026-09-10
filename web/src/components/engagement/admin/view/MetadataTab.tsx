import React, { JSXElementConstructor, ReactElement, Suspense, useEffect, useMemo } from 'react';
import { BodyText, Heading2 } from 'components/common/Typography';
import { Box, Grid2 as Grid } from '@mui/material';
import { Controller, ControllerRenderProps, Resolver, useForm } from 'react-hook-form';
import { Await, createSearchParams, Form, useFetcher, useRouteLoaderData } from 'react-router';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Button } from 'components/common/Input/Button';
import { EngagementLoaderAdminData } from '../EngagementLoaderAdmin';
import { MetadataTaxon } from 'models/engagement';
import { useAppDispatch } from 'hooks';
import { openNotification } from 'services/notificationService/notificationSlice';
import { AlertColor } from 'services/notificationService/types';
import { ROUTES, getPath } from 'routes/routes';

export interface EngagementMetadataSubmission {
    id: number;
    engagement_id: number;
    ['key']: ['value']; // Unknown fields and values, since metadata is dynamic
}

const defaultValues = {
    id: 0,
    // Find a way to define default values
};

const engagementMetaSchema = yup.object({
    // Find a way to create a schema for the metadata here
});

export const MetadataTab = () => {
    const fetcher = useFetcher();
    const dispatch = useAppDispatch();
    const { engagement, metadata, taxa } = useRouteLoaderData('single-engagement') as EngagementLoaderAdminData;
    const engMetaForm = useForm<EngagementMetadataSubmission>({
        defaultValues: useMemo(() => defaultValues, [defaultValues]),
        mode: 'onSubmit',
        reValidateMode: 'onChange',
        resolver: yupResolver(engagementMetaSchema) as unknown as Resolver<EngagementMetadataSubmission>,
    });

    const notify = (severity: AlertColor, text: string) => {
        dispatch(
            openNotification({
                severity: severity,
                text: text,
            }),
        );
    };

    useEffect(() => {
        if ('success' === fetcher.data || 'failure' === fetcher.data) {
            const responseText =
                'success' === fetcher.data
                    ? 'Engagement metadata updated successfully.'
                    : 'Unable to update engagement metadata.';
            const responseSeverity = 'success' === fetcher.data ? 'success' : 'error';
            notify(responseSeverity, responseText);
            fetcher.data = undefined;
        }
        if ('success' === fetcher.data) {
            const newDefaults = engMetaForm.getValues();
            engMetaForm.reset(newDefaults);
        }
    }, [fetcher.data]);

    useEffect(() => {
        const populateForm = async (taxa: MetadataTaxon[]) => {
            const meta = await metadata;
            if (!meta) return;
            console.log('meta', meta);
            meta.forEach((m) => {
                const key = taxa.find((t) => t.id === m.taxon_id);
                if (!key?.name) return;
                console.log('key', key);
                // Populate the form values here
                // engMetaForm.setValue(key.name, m.value);
            });
            engMetaForm.reset(engMetaForm.getValues());
        };
        const getTaxa = async () => {
            const t = await taxa;
            if (!t) return;
            console.log('taxa', t);
            // Define form with taxa before populating form values
            populateForm(t);
        };
        getTaxa();
    }, [metadata, taxa, engagement]);

    const renderFormField = (
        taxon: MetadataTaxon,
        field: ControllerRenderProps<EngagementMetadataSubmission, 'id' | 'engagement_id' | 'key' | 'key.0'>,
    ): ReactElement<unknown, string | JSXElementConstructor<unknown>> => {
        return <p>Hello world</p>;
    };

    const submitForm = async () => {
        if (engMetaForm.formState.isValid && engMetaForm.formState.isDirty) {
            const data = engMetaForm.getValues();
            fetcher.submit(
                createSearchParams({
                    id: 0 !== data.id ? String(data.id) : '',
                    // Define other submission values here
                }),
                {
                    method: 'post',
                    action: getPath(ROUTES.ENGAGEMENT_DETAILS_METADATA, { engagementId: data.engagement_id }),
                },
            );
        } else {
            notify('error', 'The metadata form contains invalid values.');
        }
    };

    // Styles
    const metaContainerStyles = {
        display: 'flex',
        flexDirection: 'column',
        flexWrap: 'nowrap',
        gap: '1rem',
    };

    const labelStyles = {
        fontWeight: 'bold',
        mb: '0.5rem',
    };

    return (
        <Grid id="admin-authoring-section" direction="column" maxWidth={'700px'}>
            <Heading2 decorated>Metadata</Heading2>
            <BodyText size="small">
                Adding metadata to your engagement gives users new ways to filter in the engagement search.
            </BodyText>
            <Form onSubmit={engMetaForm.handleSubmit(submitForm)} id="publishing-form">
                <Grid container sx={metaContainerStyles}>
                    <Suspense>
                        <Await resolve={taxa}>
                            {(t) =>
                                t?.map((taxon: MetadataTaxon) => (
                                    <Grid container direction="column" py={2} key={taxon.id}>
                                        <Box component="label" htmlFor="publish_date" sx={labelStyles}>
                                            {taxon.name}
                                        </Box>
                                        <Controller
                                            control={engMetaForm.control}
                                            name={(taxon.name as unknown as string).toLowerCase().replace(' ', '_')}
                                            rules={{ required: 'Publishing date is required' }}
                                            render={({ field }) => renderFormField(taxon, field)}
                                        />
                                    </Grid>
                                ))
                            }
                        </Await>
                    </Suspense>
                </Grid>
                <Grid container gap="1rem">
                    <Button
                        disabled={!engMetaForm.formState.isDirty || !engMetaForm.formState.isValid}
                        variant="primary"
                        type="button"
                        onClick={() => submitForm()}
                    >
                        Update Metadata
                    </Button>
                </Grid>
            </Form>
        </Grid>
    );
};

export default MetadataTab;
