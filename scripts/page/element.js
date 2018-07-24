Vue.use(VueMaterial.default);

function init(page) {
	window._vue = new Vue(deepMerge({
		el: '#app',
		methods: {
			t: function(key, params) {
				const s = browser.i18n.getMessage(key, params)
				if (s == "") {
					return "";
				}
				return s;
			}
		}
	}, page));
}