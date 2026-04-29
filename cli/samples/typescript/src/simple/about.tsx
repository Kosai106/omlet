import { AlertButton } from "@acme/components";
import * as navComponents from "./components/nav";

const UserAvatar = navComponents.UserAvatar;
const { Header } = navComponents;

export default function AboutPage() {
    return (
        <Header>
            <UserAvatar/>
            <h1>About</h1>
            <AlertButton/>
        </Header>
    );
}
