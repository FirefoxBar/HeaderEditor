const axios = require('axios');

const token = process.env.GITHUB_TOKEN;

const baseURL = process.env.GITHUB_API_URL + '/repos/' + process.env.GITHUB_REPOSITORY;
const request = axios.create({
  baseURL: baseURL,
  validateStatus: () => true,
});

request.defaults.headers.common['Accept'] = 'application/vnd.github+json';
request.defaults.headers.common['Authorization'] = 'Bearer ' + token;
request.defaults.headers.common['X-GitHub-Api-Version'] = '2022-11-28';

async function main() {
  if (!token) {
    console.log('No token');
    return;
  }

  console.log('baseURL: ' + baseURL);

  const pulls = await request.get('/pulls', {
    params: {
      state: 'open',
      head: 'dev-locale',
      base: 'dev',
    }
  });

  if (pulls.data.length > 0) {
    // already has PR
    const item = pulls.data[0];
    console.log("PR already exists: " + item.html_url);
    return;
  }

  // Create new PR
  const create = await request.post('/pulls', JSON.stringify({
    title: '[locale] update locales',
    body: '',
    head: 'dev-locale',
    base: 'dev',
  }));

  if (create.status === 201) {
    console.log("PR created: " + create.data.html_url);
  } else {
    console.log("PR created failed: " + create.status);
  }
}

main();