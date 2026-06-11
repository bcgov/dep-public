import React, { useContext } from 'react';
import { Heading3 } from 'components/common/Typography';
import { Button } from 'components/common/Input/Button';
import { Widget } from 'models/widget';
import { IconButton, Grid2 as Grid } from '@mui/material';
import { TextInput } from 'components/common/Input/TextInput';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen } from '@fortawesome/pro-regular-svg-icons/faPen';
import { Else, If, Then } from 'react-if';
import { useUpdateWidgetMutation } from 'apiManager/apiSlices/widgets';
import { useAppDispatch } from 'hooks';
import { openNotification } from 'services/notificationService/notificationSlice';
import { WidgetDrawerContext } from './WidgetDrawerContext';
import { useParams } from 'react-router';
import {
    getEngagementContentTranslationsByCode,
    syncEngagementContentTranslationsByCode,
} from 'services/engagementContentTranslationService';

export const WidgetTitle = ({ widget }: { widget: Widget }) => {
    const [editing, setEditing] = React.useState(false);
    const [title, setTitle] = React.useState(widget.title);
    const [updateWidget] = useUpdateWidgetMutation();
    const dispatch = useAppDispatch();
    const { setWidgets } = useContext(WidgetDrawerContext);
    const [isSaving, setIsSaving] = React.useState(false);
    const { languageCode } = useParams<{ languageCode?: string }>();
    const activeLanguageCode = (languageCode ?? 'en').toLowerCase();

    React.useEffect(() => {
        if (activeLanguageCode === 'en') {
            setTitle(widget.title);
            return;
        }
        getEngagementContentTranslationsByCode(widget.engagement_id, activeLanguageCode)
            .then((translations) => {
                const existingTranslation = translations.widgets.find((t) => t.widget_id === widget.id);
                setTitle(existingTranslation?.title ?? widget.title);
            })
            .catch(() => {
                setTitle(widget.title);
            });
    }, [widget.id, activeLanguageCode]);

    const saveTitle = async () => {
        if (title === widget.title) {
            setEditing(false);
            return;
        }
        try {
            setIsSaving(true);
            if (activeLanguageCode === 'en') {
                const response = await updateWidget({
                    id: widget.id,
                    engagementId: widget.engagement_id,
                    data: {
                        title,
                    },
                }).unwrap();
                setWidgets((prevWidgets) => {
                    const updatedWidget = prevWidgets.find((prevWidget) => prevWidget.id === widget.id);
                    if (updatedWidget) {
                        updatedWidget.title = response?.title || '';
                    }
                    return [...prevWidgets];
                });
            } else {
                const existingContentTranslations = await getEngagementContentTranslationsByCode(
                    widget.engagement_id,
                    activeLanguageCode,
                );

                const existingTranslation = existingContentTranslations.widgets.find(
                    (translation) => translation.widget_id === widget.id,
                );

                const nextTranslations = existingTranslation
                    ? existingContentTranslations.widgets.map((translation) =>
                          translation.widget_id === widget.id ? { ...translation, title } : translation,
                      )
                    : [...existingContentTranslations.widgets, { widget_id: widget.id, title }];

                await syncEngagementContentTranslationsByCode(widget.engagement_id, activeLanguageCode, {
                    widgets: nextTranslations,
                });

                setWidgets((prevWidgets) => {
                    const updatedWidget = prevWidgets.find((prevWidget) => prevWidget.id === widget.id);
                    if (updatedWidget) {
                        updatedWidget.title = title;
                    }
                    return [...prevWidgets];
                });
            }
            dispatch(openNotification({ severity: 'success', text: 'Widget title successfully updated' }));
            setIsSaving(false);
            setEditing(false);
        } catch {
            setIsSaving(false);
            dispatch(openNotification({ severity: 'error', text: 'Error occurred while updating widget title' }));
        }
    };

    const handleTitleChange = (text: string) => {
        setTitle(text);
    };

    return (
        <If condition={editing}>
            <Then>
                <Grid container spacing={1} alignItems="center" size={12} mt={2}>
                    <TextInput
                        name="title"
                        value={title}
                        onChange={(value) => handleTitleChange(value)}
                        inputProps={{ maxLength: 100 }}
                        fullWidth
                    />

                    <Button
                        loading={isSaving}
                        variant="primary"
                        onClick={() => {
                            saveTitle();
                        }}
                    >
                        Save
                    </Button>
                </Grid>
            </Then>
            <Else>
                <Grid container size={12} spacing={1} alignItems="center" mt={2}>
                    <Grid size="grow">
                        <Heading3 bold width="max-content">
                            {title}
                        </Heading3>
                    </Grid>
                    <Grid size="auto">
                        <IconButton
                            onClick={() => {
                                setEditing(true);
                            }}
                        >
                            <FontAwesomeIcon icon={faPen} style={{ fontSize: '22px', color: '#757575' }} />
                        </IconButton>
                    </Grid>
                </Grid>
            </Else>
        </If>
    );
};
