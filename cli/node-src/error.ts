export class CliError<C extends Record<string, unknown> = Record<string, unknown>> extends Error {
    readonly context?: C;

    constructor(message: string, { context }: { context?: C; } = {}) {
        super(message);
        this.name = this.constructor.name;
        this.context = context;
    }

    getContextString(): string {
        if (this.context && Object.keys(this.context).length > 0) {
            return JSON.stringify(this.context, null, 2);
        }

        return "";
    }
}
