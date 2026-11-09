(async () => {
  // Find all links in .column1
  const links = [
    ...document.querySelectorAll('.column1 a[href]')
  ];

  if (!links.length) {
    alert('No links found inside .column1!');
    return;
  }

  // Open a new tab immediately to avoid popup blockers
  const newTab = window.open('', '_blank');

  if (!newTab) {
    alert('Please allow popups for this website.');
    return;
  }

  newTab.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Merged Pages</title>
      </head>
      <body>
        <h2>Loading ${links.length} pages...</h2>
        <main id="merged"></main>
      </body>
    </html>
  `);
  newTab.document.close();

  const merged = newTab.document.querySelector('#merged');

  // Fetch pages and extract .column3
  const results = await Promise.all(
    links.map(async (link) => {
      const url = link.href;

      try {
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const html = await response.text();
        const doc = new DOMParser().parseFromString(
          html,
          'text/html'
        );

        const content = doc.querySelector('.column3');

        if (!content) return '';

        // Fix relative URLs for images and links
        const base = doc.createElement('base');
        base.href = url;
        doc.head.prepend(base);

        for (const element of content.querySelectorAll(
          '[href], [src]'
        )) {
          for (const attr of ['href', 'src']) {
            if (element.hasAttribute(attr)) {
              element.setAttribute(
                attr,
                new URL(element.getAttribute(attr), url).href
              );
            }
          }
        }

        return `
          <section>
            ${content.innerHTML}
          </section>
          <hr>
        `;
      } catch (error) {
        return `
          <p>Failed to load ${url}: ${error.message}</p>
        `;
      }
    })
  );

  // Merge all results in menu order
  merged.innerHTML = results.join('');

  newTab.document.querySelector('h2').textContent =
    `Merged ${links.length} pages`;
})();