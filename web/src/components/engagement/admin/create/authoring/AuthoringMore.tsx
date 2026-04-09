import { colors } from 'components/common';
import { FormField, Select, TextField } from 'components/common/Input';
import React, { useEffect, useState } from 'react';
import { useLoaderData, useOutletContext } from 'react-router';
import { Controller, useFormContext } from 'react-hook-form';
import { defaultValuesObject, EngagementUpdateData } from './AuthoringContext';
import { AuthoringTemplateOutletContext } from './types';
import UnsavedWorkConfirmation from 'components/common/Navigation/UnsavedWorkConfirmation';
import { AuthoringFormContainer, AuthoringFormSection } from './AuthoringFormLayout';
import { SubmissionStatus } from 'constants/engagementStatus';
import { AuthoringLoaderData } from './authoringLoader';
import { Engagement } from 'models/engagement';
import { Page } from 'services/type';
import { SuggestedEngagement } from 'models/suggestedEngagement';

type EngagementOption = { label: string; value: number };

const AuthoringMore = () => {
    const [engagementSelectOptions, setEngagementSelectOptions] = useState<EngagementOption[]>([
        { label: 'None', value: -1 },
    ]);
    const { setDefaultValues, fetcher, pageName, engagement: eng }: AuthoringTemplateOutletContext = useOutletContext(); // Access the form functions and values from the authoring template.
    const tenantId = eng.tenant_id;
    const engagementId = eng.id;
    const {
        setValue,
        getValues,
        reset,
        control,
        formState: { errors, isDirty, isSubmitting },
    } = useFormContext<EngagementUpdateData>();
    // Must be a loader assigned to this route or data won't be refreshed on page change.
    const { suggestions, engagementList, engagement } = useLoaderData() as AuthoringLoaderData;
    const engagementSlots = ['more_engagements_1', 'more_engagements_2', 'more_engagements_3'];
    type EngagementSlot = 'more_engagements_1' | 'more_engagements_2' | 'more_engagements_3';
    const iterance = ['first', 'second', 'third'];

    const hasUnsavedWork = isDirty && !isSubmitting;

    // Set current values to default state after saving form
    useEffect(() => {
        if (typeof fetcher.data === 'string' && fetcher.data === 'success') {
            const newDefaults = getValues();
            setDefaultValues(newDefaults);
            reset(newDefaults);
        }
    }, [fetcher.data]);

    // Load data from three services
    useEffect(() => {
        const collectData = async () => {
            try {
                const [el, e, s] = await Promise.all([engagementList, engagement, suggestions]);
                reset(defaultValuesObject);
                setValue('form_source', pageName);
                setValue('id', engagementId);
                setValue('more_engagements_heading', e.more_engagements_heading ?? 'You may also be interested in');
                updateEngagementListValues(el); // Options
                updateSuggestionValues(s); // Selected
            } catch (e) {
                console.error('Failed to load page data. ', e);
            } finally {
                const newDefaults = getValues();
                setDefaultValues(newDefaults);
                reset(newDefaults);
            }
        };
        collectData();
    }, [engagement, engagementList, suggestions]);

    const updateEngagementListValues = (list: Page<Engagement>) => {
        if (list.items && Array.isArray(list.items) && list.items.length > 0) {
            const filteredOptions: EngagementOption[] = [];
            list.items.forEach((eng) => {
                if (
                    eng.tenant_id === tenantId && // Must be engagements from same tenant
                    eng.id !== engagementId && // Can't suggest the current engagement
                    // Only suggest open or closed engagements, not drafts or unpublished
                    (eng.submission_status === SubmissionStatus.Open ||
                        eng.submission_status === SubmissionStatus.Closed)
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

    const updateSuggestionValues = (sugs: SuggestedEngagement[]) => {
        engagementSlots.forEach((es, i) => {
            setValue(es as EngagementSlot, sugs.find((s) => s.sort_index === i + 1)?.suggested_engagement_id || -1);
        });
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
            {/* prevent navigating away when the user has unsaved work */}
            <UnsavedWorkConfirmation blockNavigationWhen={hasUnsavedWork} />

            {/* More Engagements form */}
            <AuthoringFormContainer size={12}>
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
