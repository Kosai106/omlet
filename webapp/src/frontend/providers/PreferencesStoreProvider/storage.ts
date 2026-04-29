import localForage from "localforage";

import { type UserPreferences } from "./UserPreferences";

export const USER_PREFERENCES_DEFAULTS: UserPreferences = {
    workspacesWithHiddenSetupSteps: [],
    isDataIssuesDialogSeen: false,
    isTagsCalloutHidden: false,
};

const userPreferencesStore = localForage.createInstance({
    driver: [localForage.INDEXEDDB, localForage.LOCALSTORAGE],
    name: "userPreferences",
    version: 1.0,
});

export const userPreferences = {
    async getAll(userId: string): Promise<UserPreferences> {
        const preferences = await userPreferencesStore.getItem<UserPreferences>(userId) ?? USER_PREFERENCES_DEFAULTS;

        return { ...USER_PREFERENCES_DEFAULTS, ...preferences };
    },
    async get(userId: string, key: keyof UserPreferences) {
        const preferences = await userPreferencesStore.getItem<UserPreferences>(userId);

        return preferences?.[key] ?? USER_PREFERENCES_DEFAULTS[key];
    },
    async set(userId: string, key: keyof UserPreferences, value: UserPreferences[typeof key]): Promise<void> {
        const preferences = await userPreferencesStore.getItem<UserPreferences>(userId);

        await userPreferencesStore.setItem(userId, {
            ...preferences,
            [key]: value,
        });
    },
    async remove(userId: string, key: keyof UserPreferences) {
        const preferences = await userPreferencesStore.getItem<UserPreferences>(userId);

        await userPreferencesStore.setItem(userId, {
            ...preferences,
            key: USER_PREFERENCES_DEFAULTS[key],
        });
    },
};
