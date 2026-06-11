import { colors } from 'components/common';
import { FormField, Select, TextField } from 'components/common/Input';
import React, { useCallback, useState } from 'react';
import { useLoaderData, useOutletContext, useParams } from 'react-router';
import { Controller, useFormContext } from 'react-hook-form';
import { defaultValuesObject, EngagementUpdateData } from './AuthoringContext';
import { AuthoringTemplateOutletContext } from './types';
import { AuthoringFormContainer, AuthoringFormSection } from './AuthoringFormLayout';
import { EngagementStatus } from 'constants/engagementStatus';
import { AuthoringLoaderData } from './authoringLoader';
import { Engagement } from 'models/engagement';
import { Page } from 'services/type';
import { getEngagementTranslationByCode } from 'services/engagementService';
import { useAuthoringPageHydration } from './useAuthoringPageHydration';
import { AppConfig } from 'config';

type EngagementOption = { label: string; value: number };
type EngagementSlot = 'more_engagements_1' | 'more_engagements_2' | 'more_engagements_3';

const AuthoringMore = () => {
    const [engagementSelectOptions, setEngagementSelectOptions] = useState<EngagementOption[]>([
        { label: 'None', value: -1 },
    ]);
    const { setDefaultValues, fetcher, pageName }: AuthoringTemplateOutletContext = useOutletContext(); // Access the form functions and values from the authoring template.
    const { languageCode } = useParams();
    const activeLanguageCode = (languageCode ?? AppConfig.language.defaultLanguageId).toLowerCase();
    const {
        getValues,
        reset,
        control,
        formState: { errors },
    } = useFormContext<EngagementUpdateData>();
    // Must be a loader assigned to this route or data won't be refreshed on page change.
    const { suggestions, engagementList, engagement } = useLoaderData() as AuthoringLoaderData;
    const engagementSlots = ['more_engagements_1', 'more_engagements_2', 'more_engagements_3'];
    const iterance = ['first', 'second', 'third'];

    const loadMoreValues = useCallback(async () => {
        const [engagementPage, loadedEngagement, loadedSuggestions] = await Promise.all([
            engagementList,
            engagement,
            suggestions,
        ]);
        const translation = await getEngagementTranslationByCode(Number(loadedEngagement.id), activeLanguageCode);

        updateEngagementListValues(engagementPage, loadedEngagement.tenant_id, Number(loadedEngagement.id));

        return {
            ...defaultValuesObject,
            form_source: pageName,
            id: Number(loadedEngagement.id),
            more_engagements_heading:
                translation?.more_engagements_heading ??
                loadedEngagement.more_engagements_heading ??
                'You may also be interested in',
            more_engagements_1: loadedSuggestions.find((s) => s.sort_index === 1)?.suggested_engagement_id || -1,
            more_engagements_2: loadedSuggestions.find((s) => s.sort_index === 2)?.suggested_engagement_id || -1,
            more_engagements_3: loadedSuggestions.find((s) => s.sort_index === 3)?.suggested_engagement_id || -1,
        };
    }, [activeLanguageCode, engagement, engagementList, pageName, suggestions]);

    const { isHydrating } = useAuthoringPageHydration<EngagementUpdateData>({
        deps: [engagement, engagementList, suggestions, activeLanguageCode, pageName],
        fetcherData: fetcher.data,
        getValues,
        loadValues: loadMoreValues,
        reset,
        setDefaultValues,
    });

    const updateEngagementListValues = (list: Page<Engagement>, tenantId: number, engagementId: number) => {
        if (list.items && Array.isArray(list.items) && list.items.length > 0) {
            const filteredOptions: EngagementOption[] = [];
            const validStatuses = new Set([
                EngagementStatus.Published,
                EngagementStatus.Closed,
                EngagementStatus.Scheduled,
            ]);
            list.items.forEach((eng) => {
                if (
                    eng.tenant_id === tenantId && // Must be engagements from same tenant
                    eng.id !== engagementId && // Can't suggest the current engagement
                    // Only suggest published, scheduled, or closed engagements.
                    validStatuses.has(eng.status_id)
                ) {
                    filteredOptions.push({
                        label: eng?.name || '',
                        value: eng?.id || 0,
                    });
                }
            });
            setEngagementSelectOptions([{ label: 'None', value: -1 }, ...filteredOptions]);
        }
    };

    const getSelectedValue = (selected: number) => {
        const matchingOption = engagementSelectOptions.find((eso) => eso.value === selected);
        if (matchingOption?.label) {
            return matchingOption.label;
        }
        return 'None';
    };

    return (
        <>
            {/* More Engagements form */}
            <AuthoringFormContainer size={12} isHydrating={isHydrating}>
                <AuthoringFormSection
                    name="Section Heading"
                    required={true}
                    labelFor={'more_engagements_heading'}
                    details="Your more engagements heading should be descriptive, short, and succinct."
                >
                    <Controller
                        control={control}
                        name="more_engagements_heading"
                        rules={{ required: true, maxLength: 60 }}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                sx={{ backgroundColor: colors.surface.white }}
                                id="more_engagements_heading"
                                aria-label="Your more engagements heading should be descriptive, short, and succinct."
                                counter
                                maxLength={60}
                                placeholder="Feedback heading message"
                                error={errors.more_engagements_heading?.message ?? ''}
                                onChange={(value) => {
                                    field.onChange(value);
                                }}
                            />
                        )}
                    />
                </AuthoringFormSection>

                <AuthoringFormSection
                    required
                    name="Select and Add Other Engagements"
                    labelFor={'more_engagements_1'}
                    details="Select up to three other engagements to display this section in your engagement page."
                >
                    {engagementSlots.map((es, i) => (
                        <Controller
                            key={es}
                            control={control}
                            name={es as EngagementSlot}
                            render={({ field }) => (
                                <FormField
                                    title={`Engagement #${i + 1}`}
                                    error={errors[es as EngagementSlot]?.message ?? ''}
                                >
                                    <Select
                                        aria-label={`Select the ${iterance[i]} engagement that you wish to share in your more engagements section.`}
                                        id={es}
                                        size="small"
                                        sx={{ minHeight: '48px', width: '100%' }}
                                        options={engagementSelectOptions}
                                        value={
                                            engagementSelectOptions.some((eso) => eso.value === field.value)
                                                ? Number(field.value)
                                                : engagementSelectOptions[0].value // None
                                        }
                                        onChange={(e) => {
                                            field.onChange(e.target.value || null);
                                        }}
                                        renderValue={(selected) => (
                                            <span>
                                                {selected ? getSelectedValue(selected as unknown as number) : 'None'}
                                            </span>
                                        )}
                                        MenuProps={{
                                            PaperProps: {
                                                style: {
                                                    maxHeight: 48 * 4.5 + 8,
                                                    overflowY: 'auto',
                                                },
                                            },
                                        }}
                                    />
                                </FormField>
                            )}
                        />
                    ))}
                </AuthoringFormSection>
            </AuthoringFormContainer>
        </>
    );
};

export default AuthoringMore;
