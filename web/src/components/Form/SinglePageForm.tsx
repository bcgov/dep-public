import React from 'react';
import { Form } from './formio/setup';
import { FormSubmissionData, FormSubmitterProps } from './types';

const SinglePageForm = ({ handleFormChange, savedForm, handleFormSubmit }: FormSubmitterProps) => {
    return (
        <div className="formio">
            <Form
                form={savedForm || { display: 'form' }}
                onChange={(form: unknown) => handleFormChange(form as FormSubmissionData)}
                onSubmit={(form: unknown) => {
                    const formSubmissionData = form as FormSubmissionData;
                    handleFormSubmit(formSubmissionData.data);
                }}
            />
        </div>
    );
};

export default SinglePageForm;
