import { type Profession } from "./Profession";

export interface User {
    id: string;
    email: string;
    fullName?: string;
    avatarUrl?: string;
    profession?: Profession;
}
