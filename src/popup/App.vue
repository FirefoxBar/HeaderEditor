<template>
	<div class="popup-page">
		<md-switch v-model="disable_all" class="md-primary">{{t('disable_add')}}</md-switch>
		<md-button @click="openManage" class="md-raised md-primary">{{t('manage')}}</md-button>
	</div>
</template>

<script>
import storage from '../core/storage';
import utils from '../core/utils';
import browser from 'webextension-polyfill';

export default {
	data () {
		return {
			disable_all: false
		}
	},
	methods: {
		t: utils.t,
		openManage() {
			browser.runtime.sendMessage({"method": "openURL", "url": browser.extension.getURL('options/options.html')});
		}
	},
	mounted() {
		storage.prefs.onReady().then(prefs => {
			this.disable_all = prefs.get('disable-all');
			this.$watch('disable_all', (newOpt) => {
				storage.prefs.set('disable-all', newOpt);
			});
		});
	}
}
</script>

<style lang="scss">
.popup-page {
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
