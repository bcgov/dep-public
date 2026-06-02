import http from 'apiManager/httpRequestHandler';
import Endpoints from 'apiManager/endpoints';
import { replaceUrl } from 'helper';
import { Contact } from 'models/contact';

interface PostContactRequest {
    name?: string;
    title?: string;
    phoneNumber?: string;
    email?: string;
    address?: string;
    bio?: string;
    avatar_filename?: string;
}

export interface PatchContactRequest {
    id: number;
    name?: string;
    title?: string;
    phoneNumber?: string;
    email?: string;
    address?: string;
    bio?: string;
    avatar_filename?: string;
}

export const postContact = async (data: PostContactRequest): Promise<Contact> => {
    const response = await http.PostRequest<Contact>(Endpoints.Contacts.CREATE, data);
    return response.data || Promise.reject(new Error('Failed to create contact'));
};
export const patchContact = async (data: PatchContactRequest): Promise<Contact> => {
    const response = await http.PatchRequest<Contact>(Endpoints.Contacts.UPDATE, data);
    return response.data || Promise.reject(new Error('Failed to update contact'));
};

export interface ContactTranslation {
    id: number;
    contact_id: number;
    language_id: number;
    name?: string;
    title?: string;
    email?: string;
    phone_number?: string;
    address?: string;
    bio?: string;
}

export const getContactTranslation = async (
    contactId: number,
    languageId: number,
): Promise<ContactTranslation | null> => {
    const url = replaceUrl(
        replaceUrl(Endpoints.Contacts.GET_TRANSLATION, 'contact_id', String(contactId)),
        'language_id',
        String(languageId),
    );
    try {
        const response = await http.GetRequest<ContactTranslation>(url);
        return response.data ?? null;
    } catch {
        return null;
    }
};

export const createContactTranslation = async (data: {
    contact_id: number;
    language_id: number;
    name?: string;
    title?: string;
    email?: string;
    phone_number?: string;
    address?: string;
    bio?: string;
}): Promise<ContactTranslation> => {
    const response = await http.PostRequest<ContactTranslation>(Endpoints.Contacts.CREATE_TRANSLATION, data);
    return response.data;
};

export const updateContactTranslation = async (
    translationId: number,
    data: Partial<Omit<ContactTranslation, 'id'>>,
): Promise<ContactTranslation> => {
    const url = replaceUrl(Endpoints.Contacts.UPDATE_TRANSLATION, 'translation_id', String(translationId));
    const response = await http.PatchRequest<ContactTranslation>(url, data);
    return response.data;
};

export const saveContactTranslation = async (
    contactId: number,
    languageId: number,
    data: {
        name?: string;
        title?: string;
        email?: string;
        phone_number?: string;
        address?: string;
        bio?: string;
    },
): Promise<ContactTranslation> => {
    const existing = await getContactTranslation(contactId, languageId);
    if (existing?.id) {
        return updateContactTranslation(existing.id, data);
    }
    return createContactTranslation({ contact_id: contactId, language_id: languageId, ...data });
};
