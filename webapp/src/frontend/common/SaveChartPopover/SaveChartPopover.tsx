import { type FormEvent, useState, useEffect } from "react";

import { Button } from "../../library/Button/Button";
import { H3 } from "../../library/Heading/Heading";
import { Popover, PopoverDirection } from "../../library/Popover/Popover";
import { TextArea } from "../../library/TextArea/TextArea";
import { TextInput } from "../../library/TextInput/TextInput";
import { SAVED_CHART_NAME_MAX_LENGTH, SAVED_CHART_DESCRIPTION_MAX_LENGTH } from "../../models/SavedChart";

import classes from "./SaveChartPopover.module.css";

enum Action {
    Save,
    Update,
}

interface Props {
    anchor: HTMLElement;
    offset?: number;
    action?: Action;
    chartName?: string;
    chartDescription?: string;
    onSave(name: string, description: string): void;
    onCancel(): void;
}

export function SaveChartPopover({
    anchor,
    offset,
    action = Action.Save,
    chartName: initialChartName = "",
    chartDescription: initialChartDescription = "",
    onSave,
    onCancel,
}: Props) {
    const [chartName, setChartName] = useState(initialChartName);
    const [chartDesciption, setChartDescription] = useState(initialChartDescription);

    useEffect(() => {
        setChartName(initialChartName);
    }, [initialChartName]);

    useEffect(() => {
        setChartDescription(initialChartDescription);
    }, [initialChartDescription]);

    function handleSave(event: FormEvent) {
        event.preventDefault();

        onSave(chartName.trim(), chartDesciption.trim());
    }

    function isButtonDisabled() {
        if (action === Action.Save) {
            return chartName === "";
        }

        return chartName === initialChartName &&
            chartDesciption === initialChartDescription;
    }

    return (
        <Popover
            className={classes.saveChartPopover}
            anchor={anchor}
            offset={offset}
            direction={PopoverDirection.BottomLeft}
            onClose={onCancel}
            onCancel={onCancel}>
            <form
                className={classes.saveChartForm}
                onSubmit={handleSave}>
                <H3 className={classes.chartNameHeader}>Chart Name</H3>
                <TextInput
                    className={classes.chartNameInput}
                    placeholder="Add a chart name"
                    value={chartName}
                    maxLength={SAVED_CHART_NAME_MAX_LENGTH}
                    autoFocus
                    required
                    autoSelect={initialChartName !== ""}
                    onChange={setChartName}/>
                <H3 className={classes.chartDesciptionHeader}>Chart Desciption <span className={classes.optionalInfo}>(optional)</span></H3>
                <span className={classes.chartDescriptionInfo}>Explain how your colleagues can best read this chart</span>
                <TextArea
                    className={classes.chartDesciptionTextArea}
                    placeholder="By looking at this chart…"
                    value={chartDesciption}
                    maxLength={SAVED_CHART_DESCRIPTION_MAX_LENGTH}
                    submitOnEnter
                    onInput={value => setChartDescription(value)}/>
                <Button
                    className={classes.saveButton}
                    type="submit"
                    disabled={isButtonDisabled()}>
                    {action === Action.Save ? "Save to Dashboard" : "Update"}
                </Button>
            </form>
        </Popover>
    );
}

export {
    Action as SaveChartPopoverAction,
    type Props as SaveChartPopoverProps,
};
