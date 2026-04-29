const DEFAULT_VARIABLE = 1;
const MY_DEFAULT_ARRAY = [];
const shorthand = 321;
const MY_DEFAULT_OBJECT = { foo: "bar" };
const MY_DEFAULT_KEY = "dasa";

enum MyEnum {
    Value1,
    Value2
}

export function ComponentWithDefaultProps({
    variable = DEFAULT_VARIABLE,
    number = 1,
    string = "string",
    reactNode = <span>SPAN</span>,
    jsxFragment = <>hello world</>,
    nullable = null,
    undefinedValue = undefined,
    boolean = true,
    regex = /dasdsa/i,
    myObject = {
        key: "key",
        1: "1",
        "string": "string",
        ["index"]: "index",
        [MY_DEFAULT_KEY]: "MY_DEFAULT_KEY",
        shorthand,
        get getter() {
            return ""
        },
        set setter(value) {},
        myFunction() {},
        ...MY_DEFAULT_OBJECT,
    },
    myField = MY_DEFAULT_OBJECT.foo,
    myComputedField = MY_DEFAULT_OBJECT["foo"],
    myArrayField = MY_DEFAULT_ARRAY[0],
    myEnum = MyEnum.Value2,
    myArray = [1, "adsad", <span>sad</span>, ...MY_DEFAULT_ARRAY],
    arrowProp = (error) => console.log(error),
    myKeyValuePattern: {
        foo,
        bar
    } = { foo: "", bar: 1 },
    myOptionalChain = MY_DEFAULT_OBJECT?.foo,
    myThisValue = this.foo,
    mySuperValue = super.foo,
    myTemplateLiteral = `foo bar`,
    myExpression = DEFAULT_VARIABLE ? 1 : 0,
}) {
    return (
        <button>
            myButton
        </button>
    );
}
