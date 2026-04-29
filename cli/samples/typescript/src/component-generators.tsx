import { Timer } from "./timer-utils";

import * as react from "react";

class C extends react.Component {

}

export function MahmutCan() { }

export function generateTimerComponent({ type }) {
    return (props) => (
        <Timer type={type} {...props}><MahmutCan/></Timer>
    );
}

export class ComponentFactory {
    lapTimer() {
        return generateTimerComponent({ type: "lap" });
    }
}

export function CountdownTimer(props) {
    const TimerComp = generateTimerComponent({ type: "countdown" });

    return <TimerComp label="Time to take off" initialValue={props.initialValue}/>;
}

export function LapTimer(props) {
    const factory = new ComponentFactory();
    const TimerComp = factory.lapTimer();

    return <TimerComp label="Time to take off" initialValue={props.initialValue}/>;
}