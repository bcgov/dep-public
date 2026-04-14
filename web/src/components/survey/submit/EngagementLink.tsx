import React from 'react';
import { useAsyncValue } from 'react-router';
import { When } from 'react-if';
import { Engagement } from 'models/engagement';
import { Link } from 'components/common/Navigation';
import UnsavedWorkConfirmation from 'components/common/Navigation/UnsavedWorkConfirmation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeftLong } from '@fortawesome/pro-regular-svg-icons';
import { ROUTES, getPath } from 'routes/routes';

export const EngagementLink = () => {
    const engagement = useAsyncValue() as Engagement | null;

    return (
        <When condition={!engagement}>
            <UnsavedWorkConfirmation blockNavigationWhen />
            <Link to={getPath(ROUTES.SURVEYS)}>
                <FontAwesomeIcon icon={faArrowLeftLong} /> Back to Surveys
            </Link>
        </When>
    );
};
