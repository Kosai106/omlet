import { type Invite } from "./Invite";
import { type User } from "./User";

export type InviteResponse = {
    type: "invite";
    data: Invite;
} | {
    type: "user";
    data: User;
};
