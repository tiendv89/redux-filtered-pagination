import {combineReducers} from "redux";

export const pagination_types = {
	REQUEST_PAGE: '@@filtered-pagination/REQUEST_PAGE',
	RECEIVE_PAGE: '@@filtered-pagination/RECEIVE_PAGE',
	RECEIVE_PAGE_ERROR: '@@filtered-pagination/RECEIVE_PAGE_ERROR',
	CLEAR_ALL_PAGES: '@@filtered-pagination/CLEAR_ALL_PAGES',
	INIT_PAGINATION_PARAMS: '@@filtered-pagination/INIT_PAGINATION_PARAMS',
	INIT_PAGINATION_ENDPOINT: '@@filtered-pagination/INIT_PAGINATION_ENDPOINT',
	UPDATE_ENTRY: '@@filtered-pagination/UPDATE_ENTRY',
	RECEIVE_ENTRY: '@@filtered-pagination/RECEIVE_ENTRY',
};

// node is the node that the returned data is actual cotained in, can be null
export function createPagination(key, _host, _endpoint, _params, entry_identifier, node) {
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
						for (let k in objKeys) {
							let tempKey = '<' + objKeys[k] + '>';
							let index = endpoint_template.indexOf(tempKey);
							if (index != -1) {
								endpoint_template = endpoint_template.replace(tempKey, action.endpoint[objKeys[k]]);
							}
						}

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
								data: pages[action.page] ? pages[action.page].data : [],
								fetching: true,
								error: false
							}
						};
					case pagination_types.RECEIVE_PAGE:
						let newPageData = node ? action.data[node] : action.data;
						if (pages[0] && Array.isArray(pages[0].data)) {
							let newPage0 = pages[0].data.filter(e => newPageData.findIndex(i => i[entry_identifier] === e[entry_identifier]) === -1)
							return {
								...pages,
								0: {
									fetching: false,
									error: false,
									data: newPage0,
								},
								[action.page]: {
									data: newPageData,
									fetching: false,
									error: false
								}
							};
						} else {
							return {
								...pages,
								[action.page]: {
									data: newPageData,
									fetching: false,
									error: false
								}
							};
						}
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
					case pagination_types.RECEIVE_ENTRY:
						let pageNumber = null
						let newData = null
						for (pageNumber in pages) {
							if (Array.isArray(pages[pageNumber].data)) {
								let idx = pages[pageNumber].data.findIndex(e => e[entry_identifier] === action.entry[entry_identifier])
								if (idx !== -1) {
									newData = pages[pageNumber].data.slice()
									newData[idx] = action.entry
									break;
								}
							}
						}
						if (newData) {
							return {
								...pages,
								[pageNumber]: {
									...pages[pageNumber],
									data: newData,
								}
							}
						} else {
							// page 0 contains single entry, not belong to any pages (yet)
							newData = (pages[0] && Array.isArray(pages[0].data)) ? pages[0].data.slice() : []
							newData.push(action.entry)
							return {
								...pages,
								0: {
									fetching: false,
									error: false,
									data: newData,
								}
							}
						}
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
