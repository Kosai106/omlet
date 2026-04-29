import { UserMenu, UserAvatar } from "./nav";

export function UserMenuNew() {
    return (
        <div>
            <UserMenu/>
            <UserAvatar/>
        </div>
    );
}

export { Header as HeaderNew } from "./nav";

export function BackButton() {
    return (
        <button type="button">
            Back
        </button>
    );
}
