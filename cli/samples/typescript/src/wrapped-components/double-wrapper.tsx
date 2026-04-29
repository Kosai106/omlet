export const DoubleWrapper =  () => () => () => <div>Hello World</div>;

export const Wrapper = DoubleWrapper();
export const Wrapped = Wrapper();
export const WrappedWithComponentArg = Wrapper(() => <div>Foo Bar</div>);

export const WrapperWithComponentArg = DoubleWrapper(() => <div>Foo Bar</div>);
export const WrappedFromWrapperWithComponentArg = WrapperWithComponentArg();
export const WrappedWithComponentArgFromWrapperWithComponentArg = WrapperWithComponentArg(() => <div>Foo Bar</div>);
