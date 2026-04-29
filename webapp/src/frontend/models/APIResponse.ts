export type APIResponse<TData, TMeta = never> = {
    data: TData;
    meta: TMeta;
};
