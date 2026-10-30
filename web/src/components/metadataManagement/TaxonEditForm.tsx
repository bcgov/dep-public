import {
    TextField,
    Switch,
    FormControlLabel,
    FormControl,
    FormGroup,
    Select,
    Grid2 as Grid,
    MenuItem,
    Tooltip,
    Collapse,
    Box,
    useMediaQuery,
    Theme,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/pro-regular-svg-icons/faCheck';
import { faPen } from '@fortawesome/pro-solid-svg-icons/faPen';
import { faXmark } from '@fortawesome/pro-regular-svg-icons/faXmark';
import { faTrash } from '@fortawesome/pro-solid-svg-icons/faTrash';
import { faCircleExclamation } from '@fortawesome/pro-solid-svg-icons/faCircleExclamation';
import * as yup from 'yup';
import React, { JSX, useContext, useEffect } from 'react';
import { MetadataFormValue, MetadataTaxon } from 'models/engagement';
import { ActionContext } from './ActionContext';
import { useAppDispatch } from 'hooks';
import { If, Then, Else } from 'react-if';
import { TaxonTypes } from './TaxonTypes';
import { TaxonType } from './types';
import { MetadataFilterTypes } from './MetadataFilterTypes';
import PresetValuesEditor from './presetFieldsEditor/PresetValuesEditor';
import { useForm, SubmitHandler, Controller, FormProvider, UseFormReturn } from 'react-hook-form';
import { openNotification } from 'services/notificationService/notificationSlice';
import { Button } from 'components/common/Input/Button';
import {
    faArrowDownWideShort,
    faArrowUpWideShort,
    faListCheck,
    faCog,
    faGlobe,
    faFilterSlash,
    faSave,
    IconDefinition,
} from '@fortawesome/pro-regular-svg-icons';
import { BodyText, Heading3 } from 'components/common/Typography';

const FormSection = ({
    title,
    description,
    children,
    icon,
}: {
    title: string;
    description: string;
    children: React.ReactNode;
    icon?: IconDefinition;
}) => {
    return (
        <Grid
            container
            spacing={1}
            component="section"
            aria-label={title}
            sx={{ border: '1px solid', backgroundColor: 'white', borderColor: 'gray.40', borderRadius: 1, p: 2 }}
        >
            <Grid container size={12} spacing={1}>
                {icon && (
                    <Grid
                        container
                        alignItems="center"
                        justifyContent="center"
                        sx={{
                            backgroundColor: 'blue.10',
                            color: 'blue.100',
                            p: 1,
                            borderRadius: 1,
                            width: '36px',
                            height: '36px',
                        }}
                    >
                        <FontAwesomeIcon icon={icon} style={{ color: 'inherit', fontSize: '20px' }} />
                    </Grid>
                )}
                <Grid size="grow">
                    <BodyText size="huge" bold>
                        {title}
                    </BodyText>
                    <BodyText size="small">{description}</BodyText>
                </Grid>
            </Grid>
            <Grid container size={12} direction="column" mt={1} gap={1}>
                {children}
            </Grid>
        </Grid>
    );
};

const TaxonEditForm = ({ taxon }: { taxon: MetadataTaxon }): JSX.Element => {
    const { setSelectedTaxonId, updateMetadataTaxon, removeMetadataTaxon } = useContext(ActionContext);
    const dispatch = useAppDispatch();
    const isSmallScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));
    const methods = useForm<MetadataTaxon>({
        defaultValues: {
            name: taxon.name,
            description: taxon.description ?? '',
            freeform: taxon.freeform,
            one_per_engagement: taxon.one_per_engagement,
            data_type: taxon.data_type,
            preset_values: taxon.preset_values,
            filter_type: taxon.filter_type,
            include_freeform: taxon.include_freeform,
            wildcard_enabled: taxon.wildcard_enabled,
            wildcard_name: taxon.wildcard_name,
        },
    });
    const {
        handleSubmit,
        control,
        watch,
        formState: { isDirty },
        reset,
        setError,
    } = methods;

    useEffect(() => {
        reset({
            name: taxon.name ?? '',
            description: taxon.description ?? '',
            freeform: taxon.freeform ?? false,
            one_per_engagement: taxon.one_per_engagement ?? false,
            data_type: taxon.data_type ?? 'text',
            preset_values: taxon.preset_values ? parsePresetValues(taxon.preset_values) : [],
            filter_type: taxon.filter_type ?? 'none',
            include_freeform: taxon.include_freeform ?? false,
            wildcard_enabled: taxon.wildcard_enabled ?? false,
            wildcard_name: taxon.wildcard_name ?? '',
        });
    }, [taxon, reset]);

    const parsePresetValues = (meta: MetadataFormValue[]) => {
        if (!Array.isArray(meta) || !meta.length) return [];
        return meta.sort((a, b) => a.position - b.position);
    };

    // Watch data_type to update taxonType
    const dataType = watch('data_type');
    const taxonType = TaxonTypes[dataType as keyof typeof TaxonTypes];
    // Watch freeform to update label
    const isFreeform = watch('freeform');
    const filterType = watch('filter_type');
    const isValidFilter = filterType !== 'none';
    const presetValues = watch('preset_values');
    const selectedFilter = (taxonType.supportedFilters ?? []).find((filter) => filter.code === filterType);
    const wildcardEnabled = watch('wildcard_enabled');
    const wildcardName = watch('wildcard_name');

    const presetValueSchema: yup.AnySchema = yup.object({
        id: yup.number(),
        value: taxonType.yupValidator ?? yup.mixed(),
        position: yup.number().required(),
    });

    const schema = yup.object().shape({
        name: yup.string().required('Name is required').max(64, 'Name is too long! Limit: 64 characters.'),
        description: yup.string().max(255, 'Description is too long! Limit: 255 characters.'),
        freeform: yup.boolean().oneOf([taxonType.supportsFreeform, false]),
        one_per_engagement: taxonType.supportsMulti ? yup.boolean() : yup.boolean().oneOf([true]),
        data_type: yup.string().required('Type is required'),
        preset_values: yup.mixed().when('data_type', {
            is: () => taxonType.supportsPresetValues,
            then: yup.mixed().when('freeform', {
                is: false,
                then: yup.array().of(presetValueSchema).required('Preset value is required'),
                otherwise: yup.array().of(presetValueSchema),
            }),
            otherwise: yup.mixed().strip(),
        }),
        filter_type: yup.string().when('data_type', {
            is: (value: string) => (taxonType.supportedFilters ?? []).length > 0,
            then: yup
                .string()
                .oneOf(['none', ...(taxonType.supportedFilters ?? []).map((filter) => filter.code)])
                .nullable(),
            otherwise: yup.string().strip(),
        }),
        include_freeform: yup.boolean().when('filter_type', {
            is: (value: string) => {
                return taxonType.allowFreeformInFilter;
            },
            then: yup.boolean().optional(),
            otherwise: yup.boolean().strip(),
        }),
        wildcard_enabled: yup.boolean().when('data_type', {
            is: (value: string) => TaxonTypes[value]?.supportsPresetValues,
            then: yup.boolean().optional(),
            otherwise: yup.boolean().strip(),
        }),
        wildcard_name: yup.string().when('wildcard_enabled', {
            is: true,
            then: yup
                .string()
                .trim()
                .required('A wildcard name is required.')
                .max(64, 'Name is too long!')
                .test(
                    'wildcard-name-not-preset',
                    'The wildcard name cannot match a preset value.',
                    (value) => !value || !(presetValues ?? []).some((preset) => preset.value === value),
                ),
            otherwise: yup.string().nullable(),
        }),
    });

    const onSubmit: SubmitHandler<MetadataTaxon> = async (data, event) => {
        let formErrors: { [key: string]: string } = {};
        // These fields don't always apply to all taxon types, so
        // if they are unsupported, we set them to the defaults
        if (!taxonType.supportsFreeform) data.freeform = false;
        if (!taxonType.supportsMulti) data.one_per_engagement = true;
        if (!taxonType.supportsPresetValues) data.preset_values = [];
        try {
            await schema.validate(data, { abortEarly: false });
            // Catch clause variable type annotation must be 'any' or 'unknown' if specified
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: yup.ValidationError | any) {
            console.error(error);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formErrors = error.inner.reduce((errors: { [key: string]: string }, innerError: any) => {
                errors[innerError.path] = innerError.message;
                return errors;
            }, {});
            // Set errors for each field in formState
            Object.keys(formErrors).forEach((fieldName) => {
                setError(fieldName as keyof MetadataTaxon, {
                    type: 'validate',
                    message: formErrors[fieldName],
                });
            });
        }

        if (Object.keys(formErrors).length) {
            dispatch(
                openNotification({ text: 'Please correct the highlighted errors before saving.', severity: 'error' }),
            );
            return false;
        }

        const updatedTaxon: MetadataTaxon = {
            ...taxon,
            name: data.name,
            description: data.description,
            freeform: data.freeform || data.preset_values?.length === 0,
            one_per_engagement: data.one_per_engagement || !TaxonTypes[data.data_type ?? 'text'].supportsMulti,
            data_type: data.data_type,
            preset_values: TaxonTypes[data.data_type ?? 'text'].supportsPresetValues ? data.preset_values : [],
            filter_type: data.filter_type === 'none' ? null : data.filter_type,
            include_freeform: data.include_freeform,
            wildcard_enabled: taxonType.supportsPresetValues && data.wildcard_enabled,
            wildcard_name: taxonType.supportsPresetValues ? data.wildcard_name?.trim() || null : null,
        };
        updateMetadataTaxon(updatedTaxon);
    };

    const handleKeys = (event: React.KeyboardEvent) => {
        // Handle as many key combinations as possible
        if ((event.ctrlKey || event.metaKey || event.altKey) && event.key === 'Enter') {
            event.nativeEvent.stopImmediatePropagation();
            event.preventDefault(); // Prevent default to stop any native form submission
            handleSubmit(onSubmit)();
        }
    };

    const isMac = () => {
        return /Mac|iPod|iPhone|iPad/.test(navigator.platform);
    };
    const modifierKey = !isMac() ? 'Ctrl' : '⌘';

    // Whether the options can be limited to preset values
    const allowLimiting = taxonType.supportsFreeform && (presetValues?.length ?? 0) > 0;

    return (
        <FormProvider {...methods}>
            <FormGroup onKeyDown={handleKeys}>
                <Grid container spacing={2} direction="column" sx={{ width: '100%', maxWidth: '700px' }}>
                    <Grid container direction="row">
                        <Grid size="grow" container alignItems="center">
                            <Heading3 weight="bold">Edit metadata field</Heading3>
                        </Grid>
                        <Tooltip title={taxon.is_required ? 'This taxon is required and cannot be deleted.' : ''}>
                            <Grid size="auto" justifySelf="flex-end">
                                <Button
                                    icon={
                                        <FontAwesomeIcon
                                            icon={faTrash}
                                            style={{ fontSize: '20px', paddingRight: '5px' }}
                                        />
                                    }
                                    color="error"
                                    aria-label={taxon.is_required ? 'cannot delete' : 'delete'}
                                    onClick={() => removeMetadataTaxon(taxon.id)}
                                    disabled={taxon.is_required}
                                    aria-disabled={taxon.is_required}
                                >
                                    Delete
                                </Button>
                            </Grid>
                        </Tooltip>
                    </Grid>
                    <FormSection
                        icon={faCog}
                        title="Field setup"
                        description="Choose what this field is called and what kind of information it collects."
                    >
                        <Grid>
                            <BodyText bold>Field name</BodyText>
                            <Controller
                                name="name"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        disabled={taxon.is_required}
                                        placeholder="Enter taxon name"
                                        error={!!methods.formState.errors.name}
                                        helperText={methods.formState.errors.name?.message}
                                        value={field.value}
                                        onChange={field.onChange}
                                    />
                                )}
                            />
                        </Grid>
                        <Grid>
                            <BodyText bold>Field description</BodyText>
                            <Controller
                                name="description"
                                control={control}
                                render={({ field, fieldState }) => (
                                    <TextField
                                        fullWidth
                                        multiline
                                        minRows={2}
                                        maxRows={8}
                                        placeholder="[Optional] Enter a description"
                                        value={field.value}
                                        onChange={field.onChange}
                                        error={!!fieldState?.error}
                                        helperText={fieldState?.error?.message}
                                    />
                                )}
                            />
                        </Grid>
                        <Grid>
                            <BodyText bold>Data type</BodyText>
                            <BodyText size="small" sx={{ mb: 1 }}>
                                The data type determines which choices and settings are available for this field.
                            </BodyText>
                            <FormControl fullWidth>
                                <Controller
                                    name="data_type"
                                    control={control}
                                    render={({ field }) => (
                                        <Select {...field} disabled={taxon.is_required}>
                                            {Object.entries(TaxonTypes).map(([key, type]: [string, TaxonType]) => (
                                                <MenuItem key={key} value={key}>
                                                    <Grid container spacing={1} alignItems="center">
                                                        <Grid width="30px" textAlign="center">
                                                            <FontAwesomeIcon
                                                                icon={type.icon}
                                                                style={{ fontSize: '22px' }}
                                                            />
                                                        </Grid>
                                                        <Grid>{type.name}</Grid>
                                                    </Grid>
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    )}
                                />
                            </FormControl>
                        </Grid>
                    </FormSection>
                    <Grid component={Collapse} in={taxonType.supportsPresetValues} timeout="auto" unmountOnExit>
                        <FormSection
                            icon={faListCheck}
                            title="Options for engagement staff"
                            description="These settings control what staff can choose when adding metadata to an engagement."
                        >
                            <Grid>
                                <BodyText bold>Preset options</BodyText>
                                <BodyText size="small" sx={{ mb: 1 }}>
                                    Staff can choose from these values when editing an engagement.
                                </BodyText>
                                <PresetValuesEditor control={methods.control} name="preset_values" />
                                <Grid container m="0.5rem 0 0" p={0} gap={1}>
                                    <SortButton methods={methods} direction="normal">
                                        Sort A to Z
                                    </SortButton>
                                    <SortButton methods={methods} direction="reverse">
                                        Sort Z to A
                                    </SortButton>
                                </Grid>
                            </Grid>
                            <Grid>
                                <FormControlLabel
                                    slotProps={{ typography: { fontWeight: 'bold' } }}
                                    control={
                                        <Controller
                                            name="wildcard_enabled"
                                            control={control}
                                            render={({ field: { onChange, value } }) => (
                                                <Switch
                                                    checked={Boolean(value)}
                                                    onChange={(e) => onChange(e.target.checked)}
                                                />
                                            )}
                                        />
                                    }
                                    label="Include an 'All values' option"
                                />
                                <BodyText size="small" sx={{ mb: 1, ml: 6 }}>
                                    Staff users can select this option when an engagement applies to every value in this
                                    field.
                                </BodyText>
                                <Grid container ml={6}>
                                    <BodyText bold>Label for the 'All values' option</BodyText>
                                    <Controller
                                        name="wildcard_name"
                                        control={control}
                                        render={({ field }) => (
                                            <TextField
                                                fullWidth
                                                placeholder={`All "${taxonType.name}"`}
                                                disabled={!wildcardEnabled}
                                                error={!!methods.formState.errors.wildcard_name}
                                                helperText={methods.formState.errors.wildcard_name?.message}
                                                {...field}
                                            />
                                        )}
                                    />
                                </Grid>
                            </Grid>
                            <Grid
                                component={Collapse}
                                in={taxonType.supportsPresetValues && allowLimiting}
                                timeout="auto"
                                unmountOnExit
                            >
                                <FormControlLabel
                                    slotProps={{ typography: { fontWeight: 'bold' } }}
                                    control={
                                        <Controller
                                            name="freeform"
                                            control={control}
                                            render={({ field: { onChange, value } }) => {
                                                return (
                                                    <Switch
                                                        checked={value && allowLimiting}
                                                        onChange={(e) => onChange(e.target.checked)}
                                                    />
                                                );
                                            }}
                                        />
                                    }
                                    label="Allow staff to add custom options"
                                />
                                <BodyText size="small" sx={{ ml: 6 }}>
                                    When enabled, staff can enter a value that is not in the preset options.
                                </BodyText>
                            </Grid>
                            <Grid component={Collapse} in={taxonType.supportsMulti} timeout="auto" unmountOnExit>
                                <FormControlLabel
                                    slotProps={{ typography: { fontWeight: 'bold' } }}
                                    control={
                                        <Controller
                                            name="one_per_engagement"
                                            control={control}
                                            render={({ field: { onChange, value } }) => (
                                                <Switch
                                                    checked={!value}
                                                    onChange={(e) => onChange(!e.target.checked)}
                                                />
                                            )}
                                        />
                                    }
                                    label="Allow staff to choose multiple values"
                                />
                                <BodyText size="small" sx={{ ml: 6 }}>
                                    Turn this off when an engagement should have one value for this field.
                                </BodyText>
                            </Grid>
                        </FormSection>
                    </Grid>
                    {taxonType.supportedFilters && (
                        <FormSection
                            icon={faGlobe}
                            title="Public search"
                            description="Choose whether people can use this field to find engagements, and how selected choices are matched."
                        >
                            <Grid>
                                <BodyText bold>Show this field as a search filter</BodyText>
                                <FormControl fullWidth>
                                    <Controller
                                        name="filter_type"
                                        control={control}
                                        render={({ field: { onChange, value, ...fieldProps } }) => (
                                            <Select
                                                error={!!methods.formState.errors.filter_type}
                                                value={value || 'none'} // Display "none" when value is null or undefined
                                                onChange={onChange}
                                                {...fieldProps}
                                            >
                                                <MenuItem value="none">
                                                    <Grid container alignItems="center" spacing={1}>
                                                        {!isSmallScreen && (
                                                            <Grid>
                                                                {/* <FilterAltOff /> */}
                                                                <FontAwesomeIcon
                                                                    icon={faFilterSlash}
                                                                    style={{ fontSize: '22px' }}
                                                                />
                                                            </Grid>
                                                        )}
                                                        <Grid>Don't show this field in public search</Grid>
                                                    </Grid>
                                                </MenuItem>
                                                {(taxonType.supportedFilters ?? []).map((filter) => (
                                                    <MenuItem key={filter.code} value={filter.code}>
                                                        <Grid container alignItems="center" spacing={1}>
                                                            {!isSmallScreen && (
                                                                <Grid>
                                                                    <FontAwesomeIcon
                                                                        icon={filter.icon}
                                                                        style={{ fontSize: '22px' }}
                                                                    />
                                                                </Grid>
                                                            )}
                                                            <Grid>{filter.name}</Grid>
                                                        </Grid>
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        )}
                                    ></Controller>
                                </FormControl>
                                <BodyText size="small" sx={{ mt: 1 }}>
                                    {selectedFilter
                                        ? MetadataFilterTypes[selectedFilter.code].details
                                        : 'People will not see this field as a filter on the public engagement search page.'}
                                </BodyText>
                            </Grid>
                            <Grid
                                component={Collapse}
                                in={Boolean(taxonType.allowFreeformInFilter && isFreeform && isValidFilter)}
                                timeout="auto"
                                unmountOnExit
                            >
                                <FormControlLabel
                                    slotProps={{ typography: { fontWeight: 'bold' } }}
                                    control={
                                        <Controller
                                            name="include_freeform"
                                            control={control}
                                            render={({ field: { onChange, value } }) => (
                                                <Switch checked={value} onChange={(e) => onChange(e.target.checked)} />
                                            )}
                                        />
                                    }
                                    label="Include staff-entered custom options in public filters"
                                />
                                <BodyText size="small" sx={{ ml: 6 }}>
                                    When enabled, custom options already used on engagements can also appear as choices
                                    in public search.
                                </BodyText>
                            </Grid>
                            {taxonType.supportedFilters && (
                                <Box
                                    role="status"
                                    sx={{
                                        borderLeft: '4px solid',
                                        borderColor: 'primary.main',
                                        bgcolor: 'gray.10',
                                        px: 2,
                                        py: 1.5,
                                    }}
                                >
                                    <BodyText bold>What people will see</BodyText>
                                    <BodyText size="small">
                                        {selectedFilter
                                            ? `A “${taxon.name}” filter with ${isFreeform && watch('include_freeform') ? 'preset and staff-entered custom' : 'preset'} choices. ${MetadataFilterTypes[selectedFilter.code].details}`
                                            : `“${taxon.name}” will not appear as a public search filter.`}
                                    </BodyText>
                                    {wildcardEnabled && wildcardName?.trim() && (
                                        <BodyText size="small" sx={{ mt: 1 }}>
                                            Engagements marked “{wildcardName.trim()}” will appear when any choice in
                                            this filter is selected. “{wildcardName.trim()}” is only a staff-facing
                                            choice; it will not appear in public search.
                                        </BodyText>
                                    )}
                                </Box>
                            )}
                        </FormSection>
                    )}
                    <Grid container alignItems="center" justifyContent="flex-start">
                        <Tooltip title="Discard changes to taxon" id="cancel-button-tooltip">
                            <Button
                                icon={<FontAwesomeIcon icon={faXmark} style={{ fontSize: '20px' }} />}
                                aria-label="Discard changes to taxon"
                                onClick={() => setSelectedTaxonId(-1)}
                            >
                                Cancel
                            </Button>
                        </Tooltip>
                        <If condition={Object.keys(methods.formState.errors).length === 0}>
                            <Then>
                                <If condition={isDirty}>
                                    <Then>
                                        <Tooltip title={`Save changes to taxon (${modifierKey} + Enter)`}>
                                            <Button
                                                variant="primary"
                                                icon={
                                                    <FontAwesomeIcon
                                                        icon={faSave}
                                                        style={{ fontSize: '20px', paddingRight: '5px' }}
                                                    />
                                                }
                                                aria-label="Save changes to taxon"
                                                onClick={handleSubmit(onSubmit)}
                                                sx={{ marginLeft: '0.5em' }}
                                            >
                                                Save
                                            </Button>
                                        </Tooltip>
                                    </Then>
                                    <Else>
                                        <Button
                                            variant="primary"
                                            icon={
                                                <FontAwesomeIcon
                                                    icon={faCheck}
                                                    style={{ fontSize: '20px', paddingRight: '5px' }}
                                                />
                                            }
                                            aria-label="No changes to save"
                                            aria-disabled
                                            disabled
                                            sx={{ marginLeft: '0.5em' }}
                                        >
                                            {}Saved
                                        </Button>
                                    </Else>
                                </If>
                            </Then>
                            <Else>
                                <Tooltip title="Unable to save due to form errors" id="save-button-tooltip">
                                    <span>
                                        {/* Span is used to allow disabled elements in a tooltip */}
                                        <Button
                                            variant="primary"
                                            icon={
                                                <FontAwesomeIcon
                                                    icon={faCircleExclamation}
                                                    style={{ fontSize: '20px', paddingRight: '5px' }}
                                                />
                                            }
                                            aria-disabled
                                            aria-labelledby="save-button-tooltip"
                                            aria-details="Please correct the errors before saving."
                                            disabled
                                            sx={{ marginLeft: '0.5em' }}
                                        >
                                            {}Save
                                        </Button>
                                    </span>
                                </Tooltip>
                            </Else>
                        </If>
                    </Grid>
                </Grid>
            </FormGroup>
        </FormProvider>
    );
};

const SortButton = ({
    methods,
    direction,
    children,
}: {
    methods: UseFormReturn<MetadataTaxon>;
    direction: 'normal' | 'reverse';
    children: string;
}) => {
    const sortPresetValues = (direction: 'normal' | 'reverse') => {
        const newValues = methods.getValues('preset_values') as MetadataFormValue[];
        newValues?.sort((a, b) =>
            direction === 'normal' ? a.value.localeCompare(b.value) : b.value.localeCompare(a.value),
        );
        const positionedValues = newValues?.map((nv, i) => ({
            ...nv,
            position: i + 1,
        }));
        methods.setValue('preset_values', positionedValues, { shouldDirty: true });
    };

    return (
        <Button
            variant="secondary"
            disabled={Number(methods?.getValues('preset_values')?.length) === 0}
            size="small"
            type="button"
            icon={
                <FontAwesomeIcon
                    icon={direction === 'normal' ? faArrowDownWideShort : faArrowUpWideShort}
                    style={{ fontSize: '20px', paddingRight: '5px' }}
                />
            }
            aria-label={`Sort preset values ${direction == 'normal' ? 'alphabetically' : 'reverse-alphabetically'}.`}
            onClick={() => sortPresetValues(direction)}
        >
            {children}
        </Button>
    );
};

export default TaxonEditForm;
