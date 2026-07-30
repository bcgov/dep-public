// components/Form/formio/setup.ts
import { Formio, Utils } from '@formio/react';
export { Form, FormBuilder } from '@formio/react';
import FormioComponents from 'met-formio';
import BCGovFormioComponents from '@bcgov/formio';
import 'components/Form/formio.scss';

let initialized = false;

export default function setupFormio() {
    if (initialized) return;
    Formio['use'](FormioComponents);
    Formio['use'](BCGovFormioComponents);
    Utils.Evaluator.noeval = false;
    initialized = true;
}

setupFormio();
