import { createContext } from "react";


export const MyContext =  createContext("test");

export const MyProvider = MyContext.Provider;


export function Parent() {
    return (
        <MyProvider>
            Hello
        </MyProvider>
    );
}
