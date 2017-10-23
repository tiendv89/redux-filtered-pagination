
module.exports = {
	get Pagination() {
		return require('./lib/pagination').default;
	},
	get Filter() {
		return require('./lib/filter').default;
	},
	get filterMiddleware() {
		return require('./lib/filter').FilterMiddleware;	
	}
};