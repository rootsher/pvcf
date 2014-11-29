define([], function addEvent() {
	return function module(container, params, addCleanupHandler) {
		console.log('$1$', container.querySelector('h1'));
		console.log('$2$', params);

		addCleanupHandler(function () {
			console.log('cleanup');
		});
	};
});