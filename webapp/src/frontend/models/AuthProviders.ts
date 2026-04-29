export interface AuthProviders {
    google: boolean;
    github: boolean;
    email: boolean;
    testUser: boolean;
}

export function defaultAuthProviders(): AuthProviders {
    return {
        google: false,
        github: false,
        email: false,
        testUser: false,
    };
}
