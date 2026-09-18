import { DraggableProvided } from '@hello-pangea/dnd';
import { UploadedFile } from './uploadedFile';

export type DocumentType = 'file' | 'folder';

export const DOCUMENT_TYPE: { [x: string]: DocumentType } = {
    FOLDER: 'folder',
    FILE: 'file',
};

export interface DocumentItem {
    id: number;
    title: string;
    type: DocumentType;
    url?: string;
    file_id?: string;
    file?: UploadedFile;
    parent_document_id?: number;
    children?: DocumentItem[];
    draggableProvided?: DraggableProvided;
    is_uploaded?: boolean;
}
