import * as React from "react";
import { PureComponent } from "preact/compat";

export class SamplePureComponent extends React.PureComponent {
    render() {
        return <div>sample</div>;
    }
}

export class SamplePureactComponent extends PureComponent {
    render() {
        return <div>sample</div>;
    }
}
