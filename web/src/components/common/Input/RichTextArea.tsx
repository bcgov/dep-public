import React, { useId, useLayoutEffect, useRef, useState } from 'react';
import { ContentBlock, ContentState, Editor, EditorProps } from 'react-draft-wysiwyg';
import { SxProps, Theme } from '@mui/material/styles';
import { Box } from '@mui/material';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import '../RichTextEditor/RichEditorStyles.css';
import { Button } from './Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronUp, faChevronDown } from '@fortawesome/pro-regular-svg-icons';
import { colors } from 'styles/Theme';
import { Heading2 } from '../Typography';
import { Link } from '../Navigation/Link';

export type ContainerSx = SxProps<Theme>;

interface RTAProps extends EditorProps {
    maxLines?: number;
    readMoreLabel?: string;
    readLessLabel?: string;
    containerSx?: ContainerSx;
}

const LinkRenderer = ({
    children,
    contentState,
    entityKey,
}: {
    children: React.ReactNode;
    contentState: ContentState;
    entityKey: string;
}) => {
    const { url } = contentState.getEntity(entityKey).getData();
    return <Link to={url}>{children}</Link>;
};

const Heading2Renderer = ({ children }: { children: React.ReactNode }) => {
    return (
        <Heading2 decorated weight="thin">
            {children}
        </Heading2>
    );
};

const findDraftContentElement = (root: HTMLElement | null): HTMLElement | null => {
    if (!root) return null;
    const el = root.querySelector<HTMLElement>('.public-DraftEditor-content');
    if (el) return el;
    return root.querySelector<HTMLElement>('[contenteditable]') ?? null;
};

const setClampStyles = (target: HTMLElement, maxLines: number) => {
    const stylesToRemove = ['display', 'overflow', 'max-height', '-webkit-line-clamp', '-webkit-box-orient'];
    stylesToRemove.forEach((style) => {
        target.style.removeProperty(style);
    });

    // Prefer WebKit clamp if supported
    const supportsWebkit =
        typeof CSS !== 'undefined' &&
        CSS.supports('-webkit-line-clamp', '1') &&
        CSS.supports('-webkit-box-orient', 'vertical');

    if (supportsWebkit) {
        target.style.display = '-webkit-box';
        target.style.overflow = 'hidden';
        target.style.setProperty('-webkit-line-clamp', String(maxLines));
        target.style.setProperty('-webkit-box-orient', 'vertical');
        return;
    }

    // Firefox fallback: clamp by max-height, derived from computed line-height
    const cs = getComputedStyle(target);
    let lineHeight = Number.parseFloat(cs.lineHeight);
    if (!Number.isFinite(lineHeight) || lineHeight <= 0) {
        const fontSize = Number.parseFloat(cs.fontSize) || 16;
        lineHeight = fontSize * 1.4;
    }
    target.style.overflow = 'hidden';
    target.style.maxHeight = `${lineHeight * maxLines}px`;
};

/**
 * A Rich Text Area component that uses react-draft-wysiwyg to render rich text.
 * Its primary purpose is to display rich text content created in {@link RichTextEditor}.
 * It contains custom styling for links and headings.
 * It also truncates text if the maxLines argument is present.
 * @param {EditorProps} props - Other props to pass to the Editor component.
 * @param {Array} props.customDecorators - Optional custom decorators to extend the functionality of the editor.
 * @param {number} props.maxLines - The maximum number of lines that can be displayed before the text is clamped.
 * @param {string} props.readMoreLabel - The label text shown at the bottom when the RichTextArea is clamped (default: "Read More").
 * @param {string} props.readLessLabel - The label text shown at the bottom when the RichTextArea is expanded (default: "Read Less").
 * @param {ContainerSx} props.containerSx - Optional MUI sx styles for the outer container.
 * @param {boolean} props.readOnly - Optional prop to render the editor in read-only mode.
 *                   If true, the editor will not allow any text input or modifications.
 * @see {@link https://jpuri.github.io/react-draft-wysiwyg/#/docs} for more details on the editor and its options.
 * @see {@link https://draftjs.org/docs/advanced-topics-decorators} for more information on decorators in Draft.js.
 * @see {@link https://draftjs.org/docs/advanced-topics-block-styling} for more information on block styles in Draft.js.
 * @returns
 */
export const RichTextArea = ({
    customDecorators,
    maxLines,
    readMoreLabel = 'Read More',
    readLessLabel = 'Read Less',
    containerSx,
    ...props
}: RTAProps) => {
    const rootRef = useRef<HTMLDivElement>(null);
    const contentRegionId = useId();
    const [expanded, setExpanded] = useState(false);
    const [hasOverflow, setHasOverflow] = useState(false);
    const [overflowEverDetected, setOverflowEverDetected] = useState(false);
    const showToggle = Boolean(maxLines && maxLines > 0) && (hasOverflow || (expanded && overflowEverDetected));

    const apply = (contentEl: HTMLElement) => {
        // If maxLines isn't set, ensure no clamp styles are applied.
        if (!maxLines || maxLines <= 0 || expanded) {
            contentEl.style.removeProperty('display');
            contentEl.style.removeProperty('overflow');
            contentEl.style.removeProperty('max-height');
            contentEl.style.removeProperty('-webkit-line-clamp');
            contentEl.style.removeProperty('-webkit-box-orient');
            if (expanded) {
                setHasOverflow(false);
            }
            return;
        }
        setClampStyles(contentEl, maxLines);
        if (maxLines && maxLines > 0 && !expanded) {
            const overflowing = contentEl.scrollHeight > contentEl.clientHeight + 1;
            setHasOverflow(overflowing);
            if (overflowing) {
                setOverflowEverDetected(true);
            }
        } else {
            setHasOverflow(false);
        }
    };

    const buttonStyles = {
        mt: 1,
        px: 0,
        fontWeight: 400,
        background: 'none',
        color: 'blue.90',
        '&:hover, &:active, &:focus': { background: 'none' },
    };

    useLayoutEffect(() => {
        const root = rootRef.current;
        if (!root) return;
        const contentEl = findDraftContentElement(root);
        if (!contentEl) return;
        apply(contentEl);
        const raf = globalThis.requestAnimationFrame(() => apply(contentEl));
        const onResize = () => {
            if (!expanded) apply(contentEl);
        };
        globalThis.addEventListener('resize', onResize);
        let ro: ResizeObserver | null = null;
        if ('ResizeObserver' in globalThis) {
            ro = new globalThis.ResizeObserver(() => {
                if (!expanded) apply(contentEl);
            });
            ro.observe(contentEl);
        }
        return () => {
            globalThis.cancelAnimationFrame(raf);
            globalThis.removeEventListener('resize', onResize);
            ro?.disconnect();
        };
    }, [maxLines, expanded, props.editorState]);

    return (
        <Box
            ref={rootRef}
            id={contentRegionId}
            sx={[
                {
                    '&:has([contenteditable="true"])': {
                        borderColor: 'gray.80',
                        border: '1px solid',
                        borderRadius: '8px',
                        '&:hover:not(:focus-within), &:hover:not(:focus-within) .rdw-editor-wrapper': {
                            boxShadow: `0 0 0 1px ${colors.surface.gray[90]} inset`,
                        },
                        '&:focus-within': {
                            borderColor: `${colors.focus.regular.inner}`,
                            outline: `4px solid ${colors.focus.regular.outer}`,
                        },
                    },
                },
                ...(Array.isArray(containerSx) ? containerSx : [containerSx || {}]),
                1,
            ]}
        >
            <Editor
                customDecorators={[
                    {
                        strategy: (
                            contentBlock: ContentBlock,
                            callback: (start: number, end: number) => void,
                            contentState: ContentState,
                        ) => {
                            contentBlock.findEntityRanges((character) => {
                                const entityKey = character.getEntity();
                                return entityKey !== null && contentState.getEntity(entityKey).getType() === 'LINK';
                            }, callback);
                        },
                        component: LinkRenderer,
                    },
                    {
                        strategy: (contentBlock: ContentBlock, callback: (start: number, end: number) => void) => {
                            if (!contentBlock) return;
                            if (contentBlock.getType() === 'header-two') {
                                callback(contentBlock.getDepth(), contentBlock.getDepth() + contentBlock.getLength());
                            }
                        },
                        component: Heading2Renderer,
                    },
                    ...(customDecorators || []),
                ]}
                {...props}
            />

            {showToggle && (
                <Button
                    size="small"
                    variant="tertiary"
                    sx={buttonStyles}
                    onClick={() => setExpanded(!expanded)}
                    aria-controls={contentRegionId}
                    aria-expanded={expanded}
                >
                    <span style={{ color: 'inherit' }}>
                        {expanded ? readLessLabel : readMoreLabel}
                        <FontAwesomeIcon
                            icon={expanded ? faChevronUp : faChevronDown}
                            style={{ fontSize: '0.75rem', marginLeft: '0.5rem' }}
                        ></FontAwesomeIcon>
                    </span>
                </Button>
            )}
        </Box>
    );
};
