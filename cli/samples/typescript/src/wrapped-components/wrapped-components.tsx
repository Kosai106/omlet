import { IntlLabel, injectIntl } from "react-intl";
import { PlainComponent, WrappedComponent } from "./components";
import { withClassWrapperJsx, withClassWrapperNoJsx, withWrapperJsx, withWrapperNoJsx } from "./wrappers";

export const ComponentWithExternalWrapper = injectIntl(WrappedComponent);

export const ComponentWithWrapperJsx = withWrapperJsx(WrappedComponent);

export const ComponentWithWrapperNoJsx = withWrapperNoJsx(WrappedComponent);

export const ComponentWithClassWrapperJsx = withClassWrapperJsx(WrappedComponent);

export const ComponentWithClassWrapperNoJsx = withClassWrapperNoJsx(WrappedComponent);

function LocalComponentWithIntl() {
    return <div><WrappedComponent/><IntlLabel id="hello" /></div>;
}

export const LocalComponentWithExternalWrapper = injectIntl(LocalComponentWithIntl);

export const LocalComponentWithWrapperJsx = withWrapperJsx(LocalComponentWithIntl);

export const LocalComponentWithWrapperNoJsx = withWrapperNoJsx(LocalComponentWithIntl);

export const LocalComponentWithClassWrapperJsx = withClassWrapperJsx(LocalComponentWithIntl);

export const LocalComponentWithClassWrapperNoJsx = withClassWrapperNoJsx(LocalComponentWithIntl);

export const ExternalComponentWithExternalWrapper = injectIntl(IntlLabel);

export const ExternalComponentWithWrapperJsx = withWrapperJsx(IntlLabel);

export const ExternalComponentWithWrapperNoJsx = withWrapperNoJsx(IntlLabel);

export const ComponentWithIntl = LocalComponentWithIntl;

export const AnonymousWrappedComponent = withClassWrapperNoJsx(function () {
    return <div><PlainComponent/><IntlLabel id="hello" /></div>;
});
