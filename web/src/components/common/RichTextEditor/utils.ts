import { ContentState, EditorState, convertFromHTML, convertFromRaw, convertToRaw } from 'draft-js';

// For draft-js to convert raw text to editor state
export const getEditorStateFromRaw = (rawTextToConvert: string) => {
    if (!rawTextToConvert) {
        return EditorState.createEmpty();
    }
    try {
        const rawContentFromStore = convertFromRaw(JSON.parse(rawTextToConvert));
        return EditorState.createWithContent(rawContentFromStore);
    } catch {
        // Invalid or corrupted JSON (e.g. '[object Object]') — start empty
        return EditorState.createEmpty();
    }
};

// For draft-js to convert html to editor state
export const getEditorStateFromHtml = (htmlToConvert: string) => {
    const blocksFromHTML = convertFromHTML(htmlToConvert);
    const contentState = ContentState.createFromBlockArray(blocksFromHTML.contentBlocks, blocksFromHTML.entityMap);
    return EditorState.createWithContent(contentState);
};

//Turn get text from draft-js state
export const getTextFromDraftJsContentState = (contentJSON: string): string => {
    if (!contentJSON) return '';
    const contentState = JSON.parse(contentJSON);
    return contentState.blocks.map((block: { text: string }) => block.text).join(' ');
};

// Convert EditorState to raw JSON string for storage
export const getRawFromEditorState = (editorState: EditorState | null | undefined): string => {
    if (!editorState) return '';
    try {
        const contentState = editorState.getCurrentContent();
        const raw = convertToRaw(contentState);
        return JSON.stringify(raw);
    } catch {
        return '';
    }
};
