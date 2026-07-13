async function main() {
  if (!process.env.GITHUB_TOKEN) {
    console.log('No GITHUB_TOKEN');
    return;
  }

  const baseURL = `${process.env.GITHUB_API_URL}/repos/${process.env.GITHUB_REPOSITORY}`;

  const apiHeader = {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  };

  console.log('baseURL: ' + baseURL);

  const pulls = await fetch(
    `${baseURL}/pulls?state=open&head=dev-locale&base=dev`,
    {
      headers: apiHeader,
    },
  );

  const data = await pulls.json();
  if (data.length > 0) {
    // already has PR
    const item = data[0];
    console.log('PR already exists: ' + item.html_url);
    return;
  }

  // Create new PR
  const create = await fetch(`${baseURL}/pulls`, {
    method: 'POST',
    body: JSON.stringify({
      title: 'locale: update locales',
      body: '',
      head: 'dev-locale',
      base: 'dev',
    }),
    headers: apiHeader,
  });

  if (create.status === 201) {
    console.log(`PR created: ${(await create.json()).html_url}`);
  } else {
    console.log('PR created failed: ' + create.status);
  }
}

main();
