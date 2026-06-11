import React, { useEffect, useState } from 'react';

import { Grid2 as Grid, Skeleton, Paper } from '@mui/material';
import { Widget } from 'models/widget';
import { useAppDispatch } from 'hooks';
import { openNotification } from 'services/notificationService/notificationSlice';
import { ImageWidget } from 'models/imageWidget';
import { fetchImageWidgets } from 'services/widgetService/ImageService';
import { BodyText, Heading2 } from 'components/common/Typography';
import { useEngagementLoaderData } from 'components/engagement/preview/PreviewLoaderDataContext';
import { resolveTranslationValue } from 'components/engagement/public/view/engagementTranslationResolution';

interface ImageWidgetProps {
    widget: Widget;
}

const ImageWidgetView = ({ widget }: ImageWidgetProps) => {
    const dispatch = useAppDispatch();
    const [imageWidget, setImageWidget] = useState<ImageWidget | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { translationBundle } = useEngagementLoaderData();
    const loadedTranslationBundle = React.use(translationBundle);

    const currentImageTranslationsById = new Map(
        loadedTranslationBundle.currentContentTranslations.image_widgets.map((translation) => [
            translation.widget_image_id,
            translation,
        ]),
    );
    const defaultImageTranslationsById = new Map(
        loadedTranslationBundle.defaultContentTranslations.image_widgets.map((translation) => [
            translation.widget_image_id,
            translation,
        ]),
    );

    const fetchImage = async () => {
        try {
            const images = await fetchImageWidgets(widget.id);
            setImageWidget(images.at(-1) ?? null);
            setIsLoading(false);
        } catch (error) {
            setIsLoading(false);
            console.log(error);
            dispatch(
                openNotification({
                    severity: 'error',
                    text: 'Error occurred while fetching widget information',
                }),
            );
        }
    };

    useEffect(() => {
        fetchImage();
    }, [widget]);

    if (isLoading) {
        return (
            <Paper elevation={1} sx={{ padding: '1em' }}>
                <Grid container justifyContent="flex-start" spacing={3}>
                    <Grid size={12}>
                        <Heading2>
                            <Skeleton variant="rectangular" />
                        </Heading2>
                    </Grid>
                    <Grid size={12}>
                        <Skeleton variant="rectangular" height="20em" />
                    </Grid>
                </Grid>
            </Paper>
        );
    }

    if (!imageWidget) {
        return null;
    }

    const resolvedImageDescription =
        resolveTranslationValue<string>({
            translatedValue: currentImageTranslationsById.get(imageWidget.id)?.description,
            defaultValue: defaultImageTranslationsById.get(imageWidget.id)?.description,
            baseValue: imageWidget.description,
        }).value ?? imageWidget.description;

    const resolvedImageAltText =
        resolveTranslationValue<string>({
            translatedValue: currentImageTranslationsById.get(imageWidget.id)?.alt_text,
            defaultValue: defaultImageTranslationsById.get(imageWidget.id)?.alt_text,
            baseValue: imageWidget.alt_text,
        }).value ?? imageWidget.alt_text;

    return (
        <Grid container size={12} alignItems="center" rowSpacing={2}>
            <Grid
                container
                justifyContent={{ xs: 'center', md: 'flex-start' }}
                flexDirection={'column'}
                size={12}
                paddingBottom={0}
            >
                <Heading2>{widget.title}</Heading2>
            </Grid>
            <Grid size={12}>
                <BodyText>{resolvedImageDescription}</BodyText>
            </Grid>
            <Grid
                container
                size={12}
                maxWidth="32rem"
                component={Paper}
                elevation={4}
                sx={{ borderRadius: '16px', backgroundClip: 'padding-box' }}
            >
                <img
                    style={{
                        width: '100%',
                        aspectRatio: '3/2',
                        objectFit: 'cover',
                        borderRadius: '16px',
                    }}
                    src={imageWidget.image_url}
                    alt={resolvedImageAltText}
                />
            </Grid>
        </Grid>
    );
};

export default ImageWidgetView;
