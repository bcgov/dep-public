import { useEffect, useRef, useState } from 'react';
import { debounce } from 'lodash';
import { Engagement } from 'models/engagement';
import { getEngagements } from 'services/engagementService';
import { openNotification } from 'services/notificationService/notificationSlice';
import { useAppDispatch } from 'hooks';

interface UseEngagementSearchOptions {
    hasTeamAccess?: boolean;
    debounceMs?: number;
}

export const useEngagementSearch = ({ hasTeamAccess, debounceMs = 400 }: UseEngagementSearchOptions = {}) => {
    const dispatch = useAppDispatch();
    const [options, setOptions] = useState<Engagement[]>([]);
    const [loading, setLoading] = useState(false);

    const search = async (searchText: string) => {
        setLoading(true);
        try {
            const response = await getEngagements({
                search_text: searchText,
                sort_key: searchText ? 'name' : 'engagement_created_date',
                sort_order: searchText ? 'asc' : 'desc',
                ...(hasTeamAccess !== undefined && { has_team_access: hasTeamAccess }),
            });
            setOptions(response.items);
        } catch {
            dispatch(
                openNotification({
                    severity: 'error',
                    text: 'Error occurred while trying to fetch engagements, please refresh the page or try again at a later time',
                }),
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        search('');
    }, [hasTeamAccess]);

    const onInputChange = useRef(debounce(search, debounceMs)).current;

    return { options, loading, onInputChange };
};
