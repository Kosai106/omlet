import { H3 } from "../../../library/Heading/Heading";
import { type Profession } from "../../../models/Profession";

import classes from "./ProfessionCard.module.css";

interface Props {
    title: string;
    description: string;
    value: Profession;
    selected: boolean;
    onChange(value: Profession): void;
}

export function ProfessionCard({
    title,
    description,
    value,
    selected,
    onChange,
}: Props) {
    function handleChange() {
        onChange(value);
    }

    return (
        <label className={classes.professionCard}>
            <input type="radio" name="profession" value={value} checked={selected} onChange={handleChange}/>
            <H3 className={classes.title}>{title}</H3>
            <p className={classes.description}>{description}</p>
        </label>
    );
}
