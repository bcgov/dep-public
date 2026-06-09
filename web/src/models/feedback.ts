export interface Feedback {
    id: number;
    created_date: string;
    rating: number;
    comment: string;
    comment_type: CommentTypeEnum;
    source: SourceTypeEnum;
    status: FeedbackStatusEnum;
    submission_path: string;
}

export enum FeedbackStatusEnum {
    NotReviewed = 0,
    Archived = 1,
}

export enum RatingTypeEnum {
    None = 0,
}

export enum CommentTypeEnum {
    None = 0,
    Issue = 1,
    Idea = 2,
    Else = 3,
}

export enum SourceTypeEnum {
    Public = 0,
    Internal = 1,
}

export const createDefaultFeedback = (): Feedback => {
    return {
        id: 1,
        rating: 0,
        comment: '',
        comment_type: CommentTypeEnum.None,
        created_date: '',
        source: SourceTypeEnum.Public,
        status: FeedbackStatusEnum.NotReviewed,
        submission_path: '',
    };
};

export const setFeedbackPath = (existingFeedback: Feedback): Feedback => {
    return {
        ...existingFeedback,
        submission_path: globalThis.location.pathname,
    };
};
