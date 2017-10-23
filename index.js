
module.exports = {
	get filter() {
		return require('./lib/filter').default;
	},
	get pagination() {
		return require('./lib/pagination').default;
	}
};