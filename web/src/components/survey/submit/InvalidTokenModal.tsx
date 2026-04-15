import React from 'react';
import { Grid2 as Grid, Modal } from '@mui/material';
import { modalStyle } from 'components/common';
import { useAppSelector, useAppTranslation } from 'hooks';
import { useNavigate } from 'react-router';
import { Button } from 'components/common/Input/Button';
import { BodyText } from 'components/common/Typography/Body';
import { AppConfig } from 'config';
import { getPath, ROUTES } from 'routes/routes';
import { RouterLinkRenderer } from 'components/common/Navigation/Link';
import { useSurveyLoaderData } from './useSurveyLoaderData';

export const InvalidTokenModal = () => {
    const { t: translate } = useAppTranslation();
    const isLoggedIn = useAppSelector((state) => state.user.authentication.authenticated);
    const navigate = useNavigate();
    const { verification, slug } = useSurveyLoaderData();
    const language = sessionStorage.getItem('languageId') ?? AppConfig.language.defaultLanguageId;
    const engagementPath =
        slug !== null
            ? getPath(ROUTES.PUBLIC_ENGAGEMENT_BY_SLUG, { slug: slug.slug, language })
            : getPath(ROUTES.PUBLIC_LANDING);

    const navigateToEngagement = () => navigate(engagementPath);

    return (
        <Modal
            open={!verification && !isLoggedIn}
            onClose={navigateToEngagement}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
        >
            <Grid
                container
                direction="row"
                sx={{ ...modalStyle }}
                justifyContent="flex-start"
                alignItems="flex-start"
                spacing={2}
            >
                <Grid size={12}>
                    <BodyText bold sx={{ mb: 2 }}>
                        {translate('surveySubmit.inValidToken.header')}
                    </BodyText>
                </Grid>
                <Grid size={12}>
                    <BodyText>{translate('surveySubmit.inValidToken.bodyLine1')}</BodyText>
                </Grid>
                <Grid size={12}>
                    <BodyText sx={{ p: '1em', borderLeft: 8, borderColor: '#003366', backgroundColor: '#F2F2F2' }}>
                        <ul>
                            <li>{translate('surveySubmit.inValidToken.reasons.0')}</li>
                            <li>{translate('surveySubmit.inValidToken.reasons.1')}</li>
                            <li>{translate('surveySubmit.inValidToken.reasons.2')}</li>
                        </ul>
                    </BodyText>
                </Grid>
                <Grid container size={12} justifyContent="flex-end" spacing={1} sx={{ mt: '1em' }}>
                    <Button variant="primary" href={engagementPath} LinkComponent={RouterLinkRenderer}>
                        {translate('surveySubmit.inValidToken.button')}
                    </Button>
                </Grid>
            </Grid>
        </Modal>
    );
};
