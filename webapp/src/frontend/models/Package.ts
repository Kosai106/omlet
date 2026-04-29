import { type Folder } from "./Folder";

export interface Package {
    name: string;
    children: Folder[];
    numberOfComponents: number;
    totalNumberOfComponents: number;
}
