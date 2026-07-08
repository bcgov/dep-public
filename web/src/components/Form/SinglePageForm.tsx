import React from 'react';
import { Form } from './formio/setup';
import { FormSubmissionData, FormSubmitterProps } from './types';
import { createSimpleFileOptions } from './formio/simpleFileOptions';

const SinglePageForm = ({
    handleFormChange,
    handleFormCancel,
    savedForm,
    handleFormSubmit,
    verificationToken,
}: FormSubmitterProps) => {
    const simpleFileOptions = createSimpleFileOptions({ verificationToken });

    return (
        <div className="formio">
            <Form
                form={savedForm || { display: 'form' }}
                options={{
                    ...simpleFileOptions,
                }}
                onCancel={() => handleFormCancel?.()}
                onChange={(form: unknown) => handleFormChange(form as FormSubmissionData)}
                onSubmit={(form: unknown) => handleFormSubmit?.((form as FormSubmissionData).data)}
            />
        </div>
    );
};

export default SinglePageForm;
