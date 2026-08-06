import React, { useEffect } from 'react';
import { Checkbox } from '@mui/material';
import { HeadCell } from 'components/common/Table/types';
import CustomTable from 'components/common/Table';
import { ClientSidePagination } from 'components/common/Table/ClientSidePagination';
import { SurveyReportSetting } from 'models/surveyReportSetting';

const SettingsTable = ({
    displayedMap,
    setDisplayedMap,
    searchTerm,
    surveyReportSettings,
}: {
    displayedMap: { [key: number]: boolean };
    setDisplayedMap: React.Dispatch<
        React.SetStateAction<{
            [key: number]: boolean;
        }>
    >;
    searchTerm: string;
    surveyReportSettings: SurveyReportSetting[];
}) => {
    useEffect(() => {
        const map = surveyReportSettings.reduce(
            (acc, curr) => {
                acc[curr.id] = curr.display;
                return acc;
            },
            {} as { [key: number]: boolean },
        );
        setDisplayedMap(map);
    }, [surveyReportSettings]);

    const headCells: HeadCell<SurveyReportSetting>[] = [
        {
            key: 'id',
            numeric: false,
            disablePadding: true,
            label: 'Include in Report',
            allowSort: true,
            renderCell: (row: SurveyReportSetting) => (
                <Checkbox
                    data-testid={`checkbox-${row.id}`}
                    checked={displayedMap[row.id]}
                    onClick={() => {
                        setDisplayedMap({
                            ...displayedMap,
                            [row.id]: !displayedMap[row.id],
                        });
                    }}
                />
            ),
        },
        {
            key: 'question',
            numeric: false,
            disablePadding: true,
            label: 'Question',
            allowSort: true,
            renderCell: (row: SurveyReportSetting) => row.question,
        },
        {
            key: 'question_type',
            numeric: false,
            disablePadding: true,
            label: 'Question Type',
            allowSort: true,
            renderCell: (row: SurveyReportSetting) => row.question_type,
        },
    ];

    return (
        <ClientSidePagination rows={surveyReportSettings} searchFilter={{ key: 'question', value: searchTerm }}>
            {(props) => <CustomTable {...props} headCells={headCells} />}
        </ClientSidePagination>
    );
};

export default SettingsTable;
