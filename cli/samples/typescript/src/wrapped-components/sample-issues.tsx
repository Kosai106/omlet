import { Component, forwardRef } from "react";
import { CopperButton } from "@acme/copper";
import { injectIntl } from "react-intl";

function LocalComponent() {
    return <img/>;
}

export const IntlComponent = injectIntl(LocalComponent);

const withRef = (component) => forwardRef(component);
export const Button = withRef(() => { });


function withHoverRegion(WrappedComponent) {
    return class extends WrappedComponent {
    };
}
export const HoveringComponent = withHoverRegion(LocalComponent);


export const CopperSimpleComponent = function () {
    return <div><CopperButton>Hello</CopperButton></div>;
};

export const WrappedCopperComponent = forwardRef(function () {
    return <div><CopperButton>Hello</CopperButton></div>;
});

export const WrappedCopperClassComponent = forwardRef(class extends Component {
    render() {
        return <div><CopperButton>Hello</CopperButton></div>;
    }
});

export const SampleComponent = ({
    classes,
    items,
}) => {
    return (
        <ul className={classes.list}>
            {items.map((item) => (
                <CopperButton key={item.slug} classes={classes} {...item} />
            ))}
        </ul>
    );
};

export const StyledWrappedComponent = Styled<{}>(styles)(SampleComponent);

export const ComponentWrappedByObjectAssign = Object.assign(StyledWrappedComponent, {
    /** Collects related `Items` in an `ActionList`. */
    SampleComponent,

    /** An actionable or selectable `Item` with an optional icon and description. */
    WrappedCopperComponent,

    /** Visually separates `Item`s or `Group`s in an `ActionList`. */
    CopperButton
});