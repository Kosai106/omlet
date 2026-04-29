import React from "react";

class BaseComponent extends React.Component {
    render() {
        return <div>base</div>;
    }
}

const object = {
    base: {
        component: BaseComponent
    }
};

export default object;
