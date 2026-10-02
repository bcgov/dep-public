import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EngagementStatusChip } from 'components/common/Indicators/StatusChip';
import { SubmissionStatus } from 'constants/engagementStatus';

describe('EngagementStatusChip', () => {
    it('renders the "Upcoming" label for an upcoming engagement', () => {
        render(<EngagementStatusChip statusId={SubmissionStatus.Upcoming} />);
        expect(screen.getByText('Upcoming')).toBeInTheDocument();
    });

    it('renders the "Open" label for an open engagement', () => {
        render(<EngagementStatusChip statusId={SubmissionStatus.Open} />);
        expect(screen.getByText('Open')).toBeInTheDocument();
    });

    it('renders the "Closed" label for a closed engagement', () => {
        render(<EngagementStatusChip statusId={SubmissionStatus.Closed} />);
        expect(screen.getByText('Closed')).toBeInTheDocument();
    });

    it('renders the "Closed With Results" label for a closed engagement with results', () => {
        render(<EngagementStatusChip statusId={SubmissionStatus.ClosedWithResults} />);
        expect(screen.getByText('Closed With Results')).toBeInTheDocument();
    });

    it('renders a custom label when one is provided', () => {
        render(<EngagementStatusChip statusId={SubmissionStatus.Open} label="Custom Label" />);
        expect(screen.getByText('Custom Label')).toBeInTheDocument();
        expect(screen.queryByText('Open')).not.toBeInTheDocument();
    });

    it('applies the "hovered" class when hovered is true', () => {
        render(<EngagementStatusChip statusId={SubmissionStatus.Open} hovered />);
        expect(screen.getByText('Open').closest('.MuiChip-root')).toHaveClass('hovered');
    });

    it('applies the "unhovered" class when hovered is explicitly false', () => {
        render(<EngagementStatusChip statusId={SubmissionStatus.Open} hovered={false} />);
        expect(screen.getByText('Open').closest('.MuiChip-root')).toHaveClass('unhovered');
    });

    it('applies no hover-state class by default', () => {
        render(<EngagementStatusChip statusId={SubmissionStatus.Open} />);
        const chip = screen.getByText('Open').closest('.MuiChip-root');
        expect(chip).not.toHaveClass('hovered');
        expect(chip).not.toHaveClass('unhovered');
    });
});
