import { browser, Downloads } from 'webextension-polyfill-ts';
import { FIREFOX_VERSION, IS_ANDROID, IS_CHROME } from './utils';

class File {
  save(text: string, fileName: string) {
    return new Promise(resolve => {
      const blob = new Blob([text]);
      const fileUrl = URL.createObjectURL(blob);
      const option: Downloads.DownloadOptionsType = { filename: fileName, url: fileUrl };
      // Firefox supported saveAs since version 52
      if (IS_CHROME || (!IS_ANDROID && FIREFOX_VERSION >= 52)) {
        option.saveAs = true;
      }
      browser.downloads.download(option).then(resolve);
    });
  }
  load(formatToFilter: string): Promise<string> {
    return new Promise(resolve => {
      const fileInput = document.createElement('input');
      fileInput.style.display = 'none';
      fileInput.type = 'file';
      fileInput.accept = formatToFilter || '.json';
      // @ts-ignore
      fileInput.acceptCharset = 'utf8';

      document.body.appendChild(fileInput);

      function changeHandler() {
        if (fileInput.files && fileInput.files.length > 0) {
          const fReader = new FileReader();
          fReader.readAsText(fileInput.files[0]);
          fReader.onloadend = event => {
            fileInput.removeEventListener('change', changeHandler);
            fileInput.remove();
            const result = event.target!.result as string;
            resolve(result || '');
          };
        }
      }

      fileInput.addEventListener('change', changeHandler);
      fileInput.click();
    });
  }
}

export default new File();
