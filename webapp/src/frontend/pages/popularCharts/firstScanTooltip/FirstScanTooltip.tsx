import { Callout, CalloutKind, CalloutSize } from "../../../library/Callout/Callout";
import { H3 } from "../../../library/Heading/Heading";
import { useStore } from "../../../providers/StoreProvider/StoreProvider";

import classes from "./FirstScanTooltip.module.css";

export function FirstScanTooltip() {
    const {
        actions: {
            setIsSetupRegularScansDialogVisible,
        },
    } = useStore();

    function handleActionClick() {
        setIsSetupRegularScansDialogVisible(true);
    }

    return (
        <Callout
            kind={CalloutKind.Onboarding}
            size={CalloutSize.Large}
            className={classes.firstScanTooltip}
            action={(
                <button type="button" onClick={handleActionClick}>
                    Set up regular scans
                </button>
            )}>
            <H3>Congrats on the first scan! 🎉</H3>
            <p>As you scan your projects regularly, you will see trends in component usage in this chart.</p>
        </Callout>
    );
}
