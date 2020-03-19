export type FromToFilter = {
    type: "fromTo",
    from?: number,
    to?: number
};

export type NotFilter<T> = {
    type: "not",
    values: T[]
};

export type OneOfFilter<T> = {
    type: "oneOf",
    values: T[]
};

export type SingleFilter<T> = OneOfFilter<T> | NotFilter<T> | (T extends number ? FromToFilter : never)

export type Filter = {
    actions?: {
        account?: SingleFilter<string>,
        name?: SingleFilter<string>,
        authorizations?: {
            actor?: SingleFilter<string>,
            permission?: SingleFilter<string>,
        },
        data?: SingleFilter<string>
    },
    ref_block_num?: SingleFilter<number>,
    ref_block_prefix?: SingleFilter<number>,
    max_net_usage_words?: SingleFilter<number>,
    max_cpu_usage_ms?: SingleFilter<number>,
    delay_sec?: SingleFilter<number>,
}


const localCheckFilter = <T extends unknown>(value: any, filter?: SingleFilter<T>) => {
    if (value === undefined)
        return;
    if (filter === undefined)
        return;

    switch (filter.type) {
        case "fromTo":
            if (filter.from !== undefined && value < filter.from)
                throw new Error();
            if (filter.to !== undefined && value > filter.to)
                throw new Error();
            return;
        case "not":
            if (filter.values.includes(value)) {
                throw new Error();
            }
            return;
        case "oneOf":
            if (!filter.values.includes(value)) {
                throw new Error();
            }
            return;
    }
};

const filterThrowable = (transaction: any, filter: Filter) => {
    localCheckFilter(transaction.ref_block_num, filter.ref_block_num);
    localCheckFilter(transaction.ref_block_prefix, filter.ref_block_prefix);
    localCheckFilter(transaction.max_net_usage_words, filter.max_net_usage_words);
    localCheckFilter(transaction.max_cpu_usage_ms, filter.max_cpu_usage_ms);
    localCheckFilter(transaction.delay_sec, filter.delay_sec);

    if (filter.actions && transaction.actions) {
        transaction.actions.forEach((action: any) => {
            localCheckFilter(action.account, filter.actions.account);
            localCheckFilter(action.name, filter.actions.name);
            localCheckFilter(action.data, filter.actions.data);
            if (filter.actions.authorizations && action.authorization) {
                action.authorization.forEach((authorization: any) => {
                    localCheckFilter(authorization.permission, filter.actions.authorizations.permission);
                    localCheckFilter(authorization.actor, filter.actions.authorizations.actor);
                })
            }
        })
    }
};

export const filter = (transaction: any, filter: Filter) => {
    try {
        filterThrowable(transaction, filter);
        return true;
    } catch (e) {
        return false;
    }
};

