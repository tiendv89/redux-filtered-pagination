import {combineReducers} from 'redux';

export const pagination_types = {
    REQUEST_PAGE: 'REQUEST_PAGE',
    RECEIVE_PAGE: 'RECEIVE_PAGE',
    RECEIVE_PAGE_ERROR: 'RECEIVE_PAGE_ERROR',
    CLEAR_ALL_PAGES: 'CLEAR_ALL_PAGES',
    INIT_PAGINATION_PARAMS: 'INIT_PAGINATION_PARAMS',
    INIT_PAGINATION_ENDPOINT: 'INIT_PAGINATION_ENDPOINT'
};

export function createPagination(key, _host, _endpoint, _params, _filter) {
    return {
        reducer: combineReducers({
            params: (params = _params, action = {}) => {
                if (action.key !== key && action.key !== 'all')
                    return params;

                switch (action.type) {
                    case pagination_types.INIT_PAGINATION_PARAMS:
                        return {...params, ...action.params};
                    default:
                        return params;
                }
            },
            endpoint: (endpoint = _endpoint, action = {}) => {
                if (action.key !== key && action.key !== 'all')
                    return endpoint;

                switch (action.type) {
                    case pagination_types.INIT_PAGINATION_ENDPOINT:
                        let endpoint_template = endpoint;
                        let objKeys = Object.keys(action.endpoint); 
                        console.log(objKeys);
                        for (let k in objKeys) {
                            console.log("template key: " + k);
                            let tempKey = '<' + objKeys[k] + '>';
                            let index = endpoint_template.indexOf(tempKey);
                            if (index != -1) {
                                endpoint_template = endpoint_template.replace(tempKey, action.endpoint[objKeys[k]]);
                            }
                        }

                        console.log('Final endpoint: ' + endpoint_template);

                        return endpoint_template;
                    default:
                        return endpoint;
                }
            },
            host: (host = _host, action = {}) => host,
            currentPage: (currentPage = 1, action = {}) => action.type === pagination_types.REQUEST_PAGE ? action.page : action.type === pagination_types.CLEAR_ALL_PAGES ? 1 : currentPage,
            pages: (pages = {}, action = {}) => {
                if (action.key !== key && action.key !== 'all')
                    return pages;

                switch (action.type) {
                    case pagination_types.REQUEST_PAGE:
                        return {
                            ...pages,
                            [action.page]: {
                                data: [],
                                fetching: true,
                                error: false
                            }
                        };
                    case pagination_types.RECEIVE_PAGE:
                        return {
                            ...pages,
                            [action.page]: {
                                data: action.data,
                                fetching: false,
                                error: false
                            }
                        };
                    case pagination_types.RECEIVE_PAGE_ERROR:
                        return {
                            ...pages,
                            [action.page]: {
                                data: [],
                                fetching: false,
                                error: true
                            }
                        };
                    case pagination_types.CLEAR_ALL_PAGES:
                        return {};
                    default:
                        return pages;
                }
            }
        })
    }
}

export default {
    pagination_types,
    createPagination
}