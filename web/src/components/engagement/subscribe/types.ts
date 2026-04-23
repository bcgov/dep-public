export enum SubscriptionType {
    SUBSCRIBE = 'subscribe',
    UNSUBSCRIBE = 'unsubscribe',
}

export type SubscriptionParams = {
    engagementId: string;
    scriptionAction: string;
    scriptionKey?: string;
};
