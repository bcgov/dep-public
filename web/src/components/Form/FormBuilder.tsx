import React from 'react';
import { FormBuilder as FormioFormBuilder } from './formio/setup';
import { formioOptions } from './FormBuilderOptions';
import { FormBuilderData, FormBuilderProps } from './types';

const FormBuilder = ({ handleFormChange, savedForm }: FormBuilderProps) => {
    return (
        <div className="formio">
            <FormioFormBuilder
                form={savedForm || { display: 'form' }}
                options={formioOptions}
                saveText={'Create Form'}
                onChange={(form: unknown) => handleFormChange(form as FormBuilderData)}
            />
        </div>
    );
};

export default FormBuilder;
