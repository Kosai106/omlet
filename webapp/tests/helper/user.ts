import { UserModel } from "../../src/backend/service/user/models";
import { User } from "../../src/backend/service/user/user";

export async function createUser({ _id, email }: {
    _id: string;
    email: string;
}): Promise<User> {
    const userDoc = new UserModel({
        _id,
        email,
    });

    await userDoc.save();

    return User.fromDoc(userDoc);
}
