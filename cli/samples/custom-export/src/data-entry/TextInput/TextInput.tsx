import { forwardRef } from 'react';
const TextInput = forwardRef((props, ref) => {
    return <input ref={ref} {...props} />;
});

export { TextInput };
