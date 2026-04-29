import * as OldDS from "./ds";
import * as NewDS from "ds";

function wrapper(flag?: boolean) {
    if(flag) {
        return OldDS;
    }
    return NewDS;
}

const util = {
    wrapper
};

export const OldButton = wrapper(true).Button;
export const NewButton = wrapper(false).Button;

export const NewButtonByUsingUtil = util.wrapper(true).Button;

export function Parent() {
    return (
        <>
            <OldButton />
            <NewButton />
            <NewButtonByUsingUtil />
        </>
    );
}
