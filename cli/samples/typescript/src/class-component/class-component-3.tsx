import React from "react";

class BaseComponent extends React.Component {
    render() {
        return <div>base sample</div>;
    }
}

export class Sample extends BaseComponent {
    render() {
        return <div>sample</div>;
    }
}
