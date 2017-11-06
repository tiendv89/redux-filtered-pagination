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
    FILTER_UPDATE_OPTIONS: '@@filtered-pagination/FILTER_UPDATE_OPTIONS',
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
                    if (target_options.findIndex(item => item.selected === false) != -1) {
                        target_options.forEach(function (item) {
                            options.push({...item, selected: true});
                        })
                    } else {
                        target_options.forEach(function (item) {
                            options.push({...item, selected: false});
                        })
                    }
                } else if (action.type === action_types.FILTER_SELECT_ITEM) {
                    if (filter[filter.findIndex(item => item.label === action.label)].type === filter_types.MULTI_CHOICE) {
                        target_options.forEach(function (item) {
                            if (item.key !== action.item_key)
                                options.push({...item, selected: item.selected});
                            else
                                options.push({...item, selected: !item.selected});
                        })
                    } else {
                        if (target_options.findIndex(x => x.key === action.item_key) !== -1) {
                            let item = target_options[target_options.findIndex(x => x.key === action.item_key)];
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
                    type: action_types.FILTER_UPDATE_OPTIONS,
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

export function createFilter(key, _filter) {
    return {
        reducer: (filter = _filter, action = {}) => {
            if (action.key !== key && action.key !== 'all')
                return filter;

            switch (action.type) {
                case action_types.FILTER_UPDATE_OPTIONS:
                    let newFilter = JSON.parse(JSON.stringify(filter));
                    newFilter[newFilter.findIndex(item => item.label === action.label)].options = action.options;
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
               let ret = true;
               f.options.forEach(function(option) {
                   if (!option.selected && option.filter_value === item[f.label])
                       ret = false;
               });
               return ret;
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

export default {
  // constants
  filter_types,
  filter_method,
  action_types,

  // middleware
  FilterMiddleware,

  // helpers
  createFilter,
  applyFilter
}