import { TaxonType, GenericInputProps as TaxonInputProps } from './types';
import * as yup from 'yup';
import React from 'react';
import { TextField } from '@mui/material';
import { TaxonPicker, PickerTypes, taxonSwitch } from 'components/metadataManagement/TaxonInputComponents';
import { MetadataFilterTypes } from './MetadataFilterTypes';
import {
    faAt,
    faCalendarClock,
    faCalendarDay,
    faClock,
    faHashtag,
    faInputText,
    faAlignLeft,
    faLinkSimple,
    faPhone,
    faToggleOff,
    faMapMarkerAlt,
} from '@fortawesome/pro-regular-svg-icons';

export const TaxonTypes: { [key: string]: TaxonType } = {
    text: {
        name: 'Text',
        icon: faInputText,
        supportsPresetValues: true,
        supportsFreeform: true,
        supportsMulti: true,
        yupValidator: yup.string(),
        supportedFilters: [MetadataFilterTypes.chips_all, MetadataFilterTypes.chips_any],
        allowFreeformInFilter: true,
    },
    long_text: {
        name: 'Multiline Text',
        icon: faAlignLeft,
        supportsPresetValues: false,
        supportsFreeform: true,
        supportsMulti: false,
        yupValidator: yup.string(),
        customInput: ({ taxon, field, setValue, errors }: TaxonInputProps) => (
            <TextField
                {...field}
                label={taxon.name}
                variant="outlined"
                error={!!errors[taxon.id.toString()]}
                helperText={errors[taxon.id.toString()]?.message?.toString() ?? ''}
                fullWidth
                multiline
                minRows={3}
                maxRows={8}
                onChange={(e) => {
                    setValue(taxon.id.toString(), e.target.value);
                }}
            />
        ),
    },
    number: {
        name: 'Number',
        icon: faHashtag,
        supportsPresetValues: true,
        supportsFreeform: true,
        supportsMulti: true,
        yupValidator: yup.number().typeError('This value must be a number.'),
    },
    boolean: {
        name: 'True/False',
        icon: faToggleOff,
        supportsPresetValues: false,
        supportsFreeform: false,
        supportsMulti: false,
        yupValidator: yup.boolean(),
        customInput: taxonSwitch,
    },
    date: {
        name: 'Date',
        icon: faCalendarDay,
        supportsPresetValues: false,
        supportsFreeform: false,
        supportsMulti: true,
        yupValidator: yup.date().typeError('This value must be a valid date.'),
        customInput: ({ ...props }: TaxonInputProps) => TaxonPicker({ ...props, pickerType: PickerTypes.DATE }),
    },
    time: {
        name: 'Time',
        icon: faClock,
        supportsPresetValues: false,
        supportsFreeform: false,
        supportsMulti: false,
        yupValidator: yup.date().typeError('This value must be a valid time.'),
        customInput: ({ ...props }: TaxonInputProps) => TaxonPicker({ ...props, pickerType: PickerTypes.TIME }),
    },
    datetime: {
        name: 'Date and Time',
        icon: faCalendarClock,
        supportsPresetValues: false,
        supportsFreeform: false,
        supportsMulti: false,
        yupValidator: yup.date().typeError('This value must consist of a valid date and time.'),
        customInput: ({ ...props }: TaxonInputProps) => TaxonPicker({ ...props, pickerType: PickerTypes.DATETIME }),
    },
    url: {
        name: 'Web Link',
        icon: faLinkSimple,
        supportsPresetValues: true,
        supportsFreeform: true,
        supportsMulti: true,
        yupValidator: yup.string().url('This value must be a valid web URL.'),
        externalResource: (value: string) => value,
        externalResourceLabel: 'Open',
    },
    email: {
        name: 'Email Address',
        icon: faAt,
        supportsPresetValues: true,
        supportsFreeform: true,
        supportsMulti: true,
        yupValidator: yup.string().email('This value must be a valid email address.'),
        externalResource: (value: string) => `mailto:${value}`,
        externalResourceLabel: 'Email',
    },
    phone: {
        name: 'Phone Number',
        icon: faPhone,
        supportsPresetValues: true,
        supportsFreeform: true,
        supportsMulti: true,
        yupValidator: yup
            .string()
            .matches(
                /^(\+?\d{1,3}[\s-]?)?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}$/,
                'This value must be a valid phone number.',
            ),
        externalResource: (value: string) => `tel:${value}`,
        externalResourceLabel: 'Call',
    },
    geo_area: {
        name: 'Geographical Area',
        icon: faMapMarkerAlt,
        supportsPresetValues: true,
        supportsFreeform: true,
        supportsMulti: true,
        yupValidator: yup.string(),
    },
};
