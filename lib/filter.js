export const filter_types = {
    ONE_CHOICE: 'ONCE_CHOICE',
    MULTI_CHOICE: 'MULTI_CHOICE'
};

export const filter_method = {
    SORT: 'sort',
    FILTER: 'filter'
};

export const action_types = {
    FILTER_SELECT_ALL: '@@filtered-pagination/FILTER_SELECT_ALL',
    FILTER_SELECT_ITEM: '@@filtered-pagination/FILTER_SELECT_ITEM',
    FILTER_SELECT_DONE: '@@filtered-pagination/FILTER_SELECT_DONE',
    FILTER_RESET_ALL: '@@filtered-pagination/FILTER_RESET_ALL',
    FILTER_UPDATE_ALL: '@@filtered-pagination/FILTER_UPDATE_ALL',
};

export const FilterMiddleware = store => next => action => {
    if (action.type === action_types.FILTER_SELECT_ALL
        || action.type === action_types.FILTER_SELECT_ITEM)
    {
        if (store.getState().filter && store.getState().filter[action.key]) {
            let filter = store.getState().filter[action.key];
            if (Array.isArray(filter)) {
                let target_options = filter[filter.findIndex(item => item.label === action.label)].options;
                let options = [];

                if (action.type === action_types.FILTER_SELECT_ALL) {
                    if (target_options.findIndex(item => item.selected === false && item.visible) != -1) {
                        target_options.forEach(function (item) {
                            options.push({...item, selected: item.visible ? true : item.selected});
                        })
                    } else {
                        target_options.forEach(function (item) {
                            options.push({...item, selected: item.visible ? false : item.selected});
                        })
                    }
                } else if (action.type === action_types.FILTER_SELECT_ITEM) {
                    if (filter.find(item => item.label === action.label).type === filter_types.MULTI_CHOICE) {
                        target_options.forEach(function (item) {
                            if (item.key !== action.item_key)
                                options.push({...item, selected: item.selected});
                            else
                                options.push({...item, selected: !item.selected});
                        })
                    } else {
                        let item = target_options.find(x => x.key === action.item_key)
                        if (item) {
                            if (item.selected === false) {
                                target_options.forEach(function (item) {
                                    if (item.key !== action.item_key)
                                        options.push({...item, selected: false});
                                    else
                                        options.push({...item, selected: true});
                                })
                            } else {
                                options.push(...target_options);
                            }
                        }
                    }
                }
                let newAction = {
                    type: action_types.FILTER_SELECT_DONE,
                    key: action.key,
                    label: action.label,
                    options: options
                };
                next(newAction);
            } else {
                console.log("TARGET FILTER IS NOT AN ARRAY, TAKE A LOOK AT MY DOCUMENTATION :@");
            }

        } else {
            console.log("FILTER STATE MISSING IN STORE OR THERE IS NO CORRESPONDING KEY.")
        }
    } else {
        next(action);
    }
};

let initialFilter = {};

export function createFilter(key, _filter) {
    initialFilter[key] = JSON.parse(JSON.stringify(_filter));
    return {
        reducer: (filter = _filter, action = {}) => {
            if (action.key !== key && action.key !== 'all')
                return filter;

            let newFilter = JSON.parse(JSON.stringify(filter));
            switch (action.type) {
                case action_types.FILTER_SELECT_DONE:
                    newFilter[newFilter.findIndex(item => item.label === action.label)].options = action.options;
                    return newFilter;
                case action_types.FILTER_RESET_ALL:
                    return JSON.parse(JSON.stringify(initialFilter[key]));
                case action_types.FILTER_UPDATE_ALL:
                    newFilter.forEach((f1, i) => {
                        if (f1.visible) {
                            f1.options.forEach((o1, j) => {
                                if (o1.visible) {
                                    for (let f2 of action.filter) {
                                        if (f2.label === f1.label) {
                                            for (let o2 of f2.options) {
                                                if (o2.key === o1.key) {
                                                    newFilter[i].options[j] = {...o2, visible: o1.visible}
                                                }
                                            }
                                        }
                                    }
                                }
                            })
                        }
                    })
                    return newFilter;
                default:
                    return filter;
            }
        }
    }
}

export function applyFilter(filter, data) {
    // Apply filter first
    filter.forEach(function(f) {
        if (f.method === filter_method.FILTER) {
            data = data.filter(item => {
                for (let option of f.options) {
                    if (option.selected &&
                        ((option.filter_values_other && option.filter_values_other.indexOf(item[f.label]) === -1) ||
                        (option.filter_value && option.filter_value === item[f.label]))
                    ) {
                        return true;
                    }
                }
                return false;
            });
        }
    });

    // Then apply sort
    filter.sort(function(a, b) {
        return a.sort_priority - b.sort_priority;
    });
    let filter_array = [];

    filter.forEach(function(f) {
        let ascendingInx = f.options.findIndex(item => item.key === 'ascending');
        let ascending = ascendingInx !== -1 ? (f.options[ascendingInx].selected ? 1 : -1) : -1;
        if (f.method === filter_method.SORT) {
            filter_array.push({label: f.label, ascending: ascending});
        }
    });

    data.sort(function(a, b) {
        for (let i = 0; i < filter_array.length; i++) {
            const {label, ascending} = filter_array[i];
            if (!a[label]) return -1 * ascending;
            if (!b[label]) return 1 * ascending;
            if (typeof a[label] !== typeof b[label]) {
                console.log("WARNING! SOURCE ARRAY HAS DIFFERENT TYPE OF VALUE.");
                return -1 * ascending;
            }
            let compareResult = 0;
            if (typeof a[label] === 'string') {
                compareResult = a[label].localeCompare(b[label]);
            } else if (typeof a[label] === 'number') {
                compareResult = a[label] - b[label];
            }
            if (compareResult !== 0)
                return compareResult * ascending;
        }

        return -1;
    });

    return data;
}

export function getFilterChanges(key, filter, filterToCompare) {
    let changes = 0;
    let ftc = filterToCompare ? filterToCompare : initialFilter[key];
    if (ftc && filter) {
        for (let f of filter) {
            let f1 = ftc.find(e => e.label === f.label && e.type === f.type && e.method === f.method);
            if (f1) {
                for (let option of f.options) {
                    let o1 = f1.options.find(e => e.key === option.key)
                    if (!o1 || option.selected !== o1.selected) {
                        changes += 1;
                        if (f.type === filter_types.ONE_CHOICE) {
                            break;
                        }
                    }
                }
            } else {
                changes += f.options.length;
            }
        }
    }
    return changes;
}

export default {
    // constants
    filter_types,
    filter_method,
    action_types,

    // middleware
    FilterMiddleware,

    // helpers
    createFilter,
    applyFilter,
    getFilterChanges
}