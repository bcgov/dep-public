import React from 'react';
import { Navigate, useParams } from 'react-router';
import { useAppSelector } from 'hooks';

const SlugLanguageRedirect = () => {
    const { slug } = useParams<{ slug: string }>();
    const languageId = useAppSelector((state) => state.language.id);

    return <Navigate to={`/${slug}/${languageId}`} replace />;
};

export default SlugLanguageRedirect;
