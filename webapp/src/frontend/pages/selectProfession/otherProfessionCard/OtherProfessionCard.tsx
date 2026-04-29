import { Dropdown } from "../../../library/Dropdown/Dropdown";
import { H3 } from "../../../library/Heading/Heading";
import { PopoverDirection } from "../../../library/Popover/Popover";
import { Profession, getProfessionLabel } from "../../../models/Profession";

import classes from "./OtherProfessionCard.module.css";

const OTHER_PROFESSION_OPTIONS = [
    Profession.ProductManager,
    Profession.TeamLead,
    Profession.Executive,
].map(profession => ({
    value: profession,
    label: getProfessionLabel(profession),
}));

interface Props {
    value?: Profession;
    onChange(value: Profession): void;
}

export function OtherProfessionCard({
    value,
    onChange,
}: Props) {
    return (
        <div className={classes.otherProfessionCard}>
            <div className={classes.info}>
                <H3 className={classes.title}>Other</H3>
                <p className={classes.description}>e.g. Product Manager, Team Lead</p>
            </div>
            <Dropdown
                className={classes.otherProfessionDropdown}
                optionsClassName={classes.otherProfessionOption}
                placeholder="Select profession…"
                options={OTHER_PROFESSION_OPTIONS}
                value={value}
                optionsDirection={PopoverDirection.Vertical}
                showValueInButton
                onChange={onChange}/>
        </div>
    );
}
