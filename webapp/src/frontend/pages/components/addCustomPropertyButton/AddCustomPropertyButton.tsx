import { useState } from "react";

import { IconAddMetadata } from "../../../library/icons/IconAddMetadata";
import { CustomPropertiesDialog } from "../customPropertiesDialog/CustomPropertiesDialog";

import classes from "./AddCustomPropertyButton.module.css";

export function AddCustomPropertyButton() {
    const [isDisalogVisible, setIsDialogVisible] = useState(false);

    return (
        <>
            <button
                className={classes.addCustomPropertyButton}
                type="button"
                onClick={() => setIsDialogVisible(true)}>
                <IconAddMetadata/> Add custom property
            </button>
            {isDisalogVisible && <CustomPropertiesDialog onClose={() => setIsDialogVisible(false)}/>}
        </>
    );
}
