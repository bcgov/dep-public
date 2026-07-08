import React from 'react';
import { FormBuilder as FormioFormBuilder } from './formio/setup';
import { formioOptions } from './FormBuilderOptions';
import { FormBuilderData, FormBuilderProps } from './types';
import { createSimpleFileOptions } from './formio/simpleFileOptions';

const FormBuilder = ({ handleFormChange, savedForm }: FormBuilderProps) => {
    // Add file upload and other handlers for Formio to call when uploading files.
    const fileUploadOptions = createSimpleFileOptions();

    return (
        <div className="formio">
            <FormioFormBuilder
                form={savedForm || { display: 'form' }}
                options={{
                    ...formioOptions,
                    ...fileUploadOptions,
                }}
                saveText={'Create Form'}
                onChange={(form: unknown) => handleFormChange(form as FormBuilderData)}
            />
        </div>
    );
};

export default FormBuilder;
