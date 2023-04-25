class File {
  save(text: string, fileName: string) {
    const blob = new Blob([text]);
    const fileUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.style.display = 'none';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => link.remove(), 500);
  }
  load(formatToFilter: string): Promise<string> {
    return new Promise((resolve) => {
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
          fReader.onloadend = (event) => {
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

const file = new File();

export default file;
