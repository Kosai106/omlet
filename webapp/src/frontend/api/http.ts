enum Method {
    Get = "GET",
    Patch = "PATCH",
    Post = "POST",
    Put = "PUT",
    Delete = "DELETE",
}

const headers = new Headers();
headers.set("Content-Type", "application/json");

export const http = {
    get(url: string, init: Omit<RequestInit, "headers"> & { headers?: Headers; } = {}): Promise<Response> {
        if (init.headers === undefined) {
            init.headers = new Headers();
        }

        if (init.headers.get("Accept") === null) {
            init.headers.set("Accept", "application/json");
        }

        return fetch(url, init);
    },

    patch(url: string, body?: unknown): Promise<Response> {
        const init = {
            method: Method.Patch,
            headers,
        };

        if (body) {
            Object.assign(init, {
                body: JSON.stringify(body),
            });
        }

        return fetch(url, init);
    },

    post(url: string, body?: unknown, options: RequestInit = {}) {
        const init = {
            method: Method.Post,
            headers,
            ...options,
        };

        if (body) {
            Object.assign(init, {
                body: JSON.stringify(body),
            });
        }

        return fetch(url, init);
    },

    put(url: string, body?: unknown): Promise<Response> {
        const init = {
            method: Method.Put,
            headers,
        };

        if (body) {
            Object.assign(init, {
                body: JSON.stringify(body),
            });
        }

        return fetch(url, init);
    },

    delete(url: string, body?: unknown): Promise<Response> {
        const init = {
            method: Method.Delete,
            headers,
        };

        if (body) {
            Object.assign(init, {
                body: JSON.stringify(body),
            });
        }

        return fetch(url, init);
    },
};
