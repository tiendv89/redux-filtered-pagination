
module.exports = {
	get Filter() {
		return require('./lib/filter').default;
	},
	get Pagination() {
		return require('./lib/pagination').default;
	}
};