<template>
	<div class="popup-page">
		<md-switch v-model="enable_he" class="md-primary">{{t('enable_he')}}</md-switch>
		<md-button @click="openManage" class="md-raised md-primary">{{t('manage')}}</md-button>
	</div>
</template>

<script>
import storage from '../core/storage';
import utils from '../core/utils';
import browser from 'webextension-polyfill';

export default {
	data() {
		return {
			enable_he: false
		}
	},
	methods: {
		t: utils.t,
		openManage() {
			browser.runtime.sendMessage({"method": "openURL", "url": browser.extension.getURL('options/options.html')});
			window.close();
		}
	},
	mounted() {
		storage.prefs.onReady().then(prefs => {
			this.enable_he = !prefs.get('disable-all');
			this.$watch('enable_he', newOpt => {
				storage.prefs.set('disable-all', !newOpt);
			});
		});
	}
}
</script>

<style lang="scss">
@import "../style.scss";
.popup-page {
	min-width: 180px;
	max-width: 400px;
	padding: 15px 17px;
	.md-switch {
		margin: 0;
	}
	.md-button {
		display: block;
		width: 100%;
		box-sizing: border-box;
		margin: 17px 0 0;
	}
}
</style>
