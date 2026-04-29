import classes from "./ComponentCell.module.css";

interface Props {
    componentName: string;
    packageName: string;
}

export function ComponentCell({ componentName, packageName }: Props) {
    return (
        <span className={classes.componentCell}>
            <span className={classes.componentName}>{componentName}</span>
            <span className={classes.packageName}>{packageName}</span>
        </span>
    );
}
