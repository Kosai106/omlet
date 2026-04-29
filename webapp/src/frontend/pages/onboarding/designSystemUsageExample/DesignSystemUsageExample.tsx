import { H3 } from "../../../library/Heading/Heading";

import { ImgDesignSystemUsageExample } from "./ImgDesignSystemUsageExample";

import classes from "./DesignSystemUsageExample.module.css";

interface Props {
    designSystemName: string;
}

export function DesignSystemUsageExample({ designSystemName }: Props) {
    return (
        <div className={classes.designSystemUsageExample}>
            <p>
                Based on the information you provide, we’ll set up your Omlet dashboard and provide usage insights like so:
            </p>
            <div className={classes.example}>
                <div className={classes.separator}/>
                <div className={classes.chart}>
                    <H3 className={classes.h3}>An example:</H3>
                    <p>How different teams across the company use our design system</p>
                    <ImgDesignSystemUsageExample designSystemName={designSystemName}/>
                </div>
            </div>
        </div>
    );
}
