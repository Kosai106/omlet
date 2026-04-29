import classes from "./Switch.module.css";

interface Props {
    checked: boolean;
    value?: string;
    name?: string;
    onChange: (checked: boolean) => void;
}

export function Switch({ checked, name, value, onChange }: Props) {
    function handleChange() {
        onChange(!checked);
    }

    return (
        <span className={classes.switchBase}>
            <span className={classes.switchCircle}></span>
            <input type="checkbox" name={name} value={value} className={classes.switch} checked={checked} onChange={handleChange}/>
        </span>

    );
}
