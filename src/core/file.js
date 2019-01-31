import utils from './utils';
import browser from 'webextension-polyfill';

export default {
	save(text, fileName) {
		return new Promise(function(resolve){
			const blob = new Blob([text]);
			const fileUrl = URL.createObjectURL(blob);
			const option = {filename: fileName, url: fileUrl};
			// Firefox supported saveAs since version 52
			if (utils.IS_CHROME || (!utils.IS_ANDROID && utils.FIREFOX_VERSION >= 52)) {
				option.saveAs = true;
			}
			browser.downloads.download(option).then(resolve);
		});
	},
	load(formatToFilter) {
		return new Promise(function(resolve){
			const fileInput = document.createElement('input');
			fileInput.style = "display: none;";
			fileInput.type = "file";
			fileInput.accept = formatToFilter || '.json';
			fileInput.acceptCharset = "utf8";

			document.body.appendChild(fileInput);

			function changeHandler(){
				if (fileInput.value != fileInput.initialValue){
					const fReader = new FileReader();
					fReader.readAsText(fileInput.files[0]);
					fReader.onloadend = function(event){
						fileInput.removeEventListener('change', changeHandler);
						fileInput.remove();
						resolve(event.target.result);
					}
				}
			}

			fileInput.initialValue = fileInput.value;
			fileInput.addEventListener('change', changeHandler);
			fileInput.click();
		});
	}
}