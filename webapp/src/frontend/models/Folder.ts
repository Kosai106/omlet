export interface Folder {
    path: string;
    name: string;
    numberOfComponents: number;
    totalNumberOfComponents: number;
    children: Folder[];
}
