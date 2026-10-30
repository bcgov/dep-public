import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { MetadataTaxon, MetadataTaxonModify } from 'models/engagement';
import { JSX } from 'react';
import { ControllerRenderProps, FieldErrorsImpl, FieldValues } from 'react-hook-form';
import * as yup from 'yup';

export type TaxonFormValues = {
    [key: string]: string[];
} & FieldValues;

export interface IProps {
    errorMessage?: string;
    errorCode?: string;
}

export interface ActionContextProps {
    metadataTaxa: MetadataTaxon[];
    selectedTaxon: MetadataTaxon | null;
    setSelectedTaxonId: (taxonId: number) => void;
    reorderMetadataTaxa: (taxonIds: number[]) => void;
    createMetadataTaxon: (taxon: MetadataTaxonModify) => Promise<MetadataTaxon | null>;
    updateMetadataTaxon: (taxon: MetadataTaxon) => void;
    removeMetadataTaxon: (taxonId: number) => void;
    isLoading: boolean;
}

export interface GenericInputProps {
    field: ControllerRenderProps<TaxonFormValues, string>;
    taxon: MetadataTaxon;
    taxonType: TaxonType;
    trigger: (name?: string | string[] | undefined) => Promise<boolean>;
    errors: Partial<
        FieldErrorsImpl<{
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            [x: string]: any; // This is the type specified by react-hook-form for formState.errors
        }>
    >;
    setValue: (
        name: string,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        value: any,
        options?:
            | Partial<{
                  shouldValidate: boolean;
                  shouldDirty: boolean;
                  shouldTouch: boolean;
              }>
            | undefined,
    ) => void;
}

export interface MetadataFilterType {
    name: string;
    code: string;
    details: string;
    icon: IconDefinition;
    // TODO: allow for custom input components based on the passed taxon type
}

export interface MetadataFilter {
    taxon_id: number;
    name?: string;
    filter_type: string;
    values: string[];
    wildcard_name?: string | null;
}

export interface TaxonType {
    name: string;
    icon: IconDefinition;
    supportsPresetValues: boolean;
    supportsFreeform: boolean;
    supportsMulti: boolean;
    supportedFilters?: MetadataFilterType[];
    allowFreeformInFilter?: boolean;
    yupValidator: yup.AnySchema;
    customInput?: (props: GenericInputProps) => JSX.Element;
    externalResource?: (value: string) => string;
    externalResourceLabel?: string;
}

export interface TaxonCardProps {
    taxon: MetadataTaxon;
    isExpanded: boolean;
    onSelect: (taxon: MetadataTaxon) => void;
    onExpand: (taxon: MetadataTaxon) => void;
    isSelected: boolean;
    index: number;
}
