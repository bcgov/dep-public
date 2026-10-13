import React, { useState } from 'react';
import { Radio, RadioGroup, FormControlLabel, FormControl, FormLabel } from '@mui/material';
import { PollWidget } from 'models/pollWidget';
import { BodyText } from 'components/common/Typography/Body';
import { Palette } from 'styles/Theme';

// type for the component's props
interface PollDisplayProps {
    pollWidget: PollWidget;
    interactionEnabled: boolean;
    onOptionChange?: (option: string) => void;
}

const PollDisplay = ({ pollWidget, interactionEnabled, onOptionChange }: PollDisplayProps) => {
    const [selectedOption, setSelectedOption] = useState('');

    const handleRadioChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedOption(event.target.value);
        if (onOptionChange) {
            onOptionChange(event.target.value);
        }
    };

    if (!pollWidget) {
        return null;
    }

    return (
        <FormControl component="fieldset" sx={{ minWidth: 275 }}>
            <FormLabel component="legend" style={{ fontWeight: 'bold' }}>
                {pollWidget.title}
            </FormLabel>
            <BodyText variant="body2" color="text.secondary" sx={{ marginTop: '1em', marginBottom: '1em' }}>
                {pollWidget.description}
            </BodyText>
            <RadioGroup
                style={{ pointerEvents: interactionEnabled ? 'auto' : 'none' }}
                name="poll-options"
                value={selectedOption}
                onChange={handleRadioChange}
            >
                {pollWidget.answers.map((answer, index) => (
                    <FormControlLabel
                        sx={{ marginInline: '-11px 16px' }}
                        key={'answer' + index}
                        value={answer.id.toString()}
                        control={<Radio />}
                        label={
                            <BodyText
                                variant="body2"
                                style={{
                                    lineHeight: '32px',
                                    fontWeight: selectedOption === answer.id.toString() ? 'bold' : 'normal',
                                    color: selectedOption === answer.id.toString() ? Palette.blue[90] : 'inherit',
                                }}
                            >
                                {answer.answer_text}
                            </BodyText>
                        }
                    />
                ))}
            </RadioGroup>
        </FormControl>
    );
};

export default PollDisplay;
