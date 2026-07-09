import http from 'apiManager/httpRequestHandler';
import Endpoints from 'apiManager/endpoints';
import { replaceUrl } from 'helper';
import { EmailVerification, EmailVerificationType } from 'models/emailVerification';

export const getEmailVerification = async (token: string): Promise<EmailVerification> => {
    if (!token) {
        throw new Error('Invalid Token');
    }
    const url = replaceUrl(Endpoints.EmailVerification.GET, 'verification_token', token);
    const response = await http.GetRequest<EmailVerification>(url);
    if (response.data) {
        return response.data;
    }
    throw new Error('Failed to fetch email verification');
};

export const verifyEmailVerification = async (token: string): Promise<EmailVerification> => {
    if (!token) {
        throw new Error('Invalid Token');
    }
    const url = replaceUrl(Endpoints.EmailVerification.UPDATE, 'verification_token', token);
    const response = await http.PutRequest<EmailVerification>(url);
    return response.data;
};

interface CreateEmailVerification {
    email_address: string;
    survey_id: number;
    type: EmailVerificationType;
    language: string;
}
export const createEmailVerification = async (request: CreateEmailVerification): Promise<EmailVerification> => {
    const response = await http.PostRequest<EmailVerification>(Endpoints.EmailVerification.CREATE, request);
    return response.data;
};

export const createSubscribeEmailVerification = async (
    request: CreateEmailVerification,
    subscription_type: string,
): Promise<EmailVerification> => {
    const url = replaceUrl(
        Endpoints.EmailVerification.CREATE_SUBSCRIBE,
        'subscription_type',
        String(subscription_type),
    );
    const response = await http.PostRequest<EmailVerification>(url, request);
    return response.data;
};
