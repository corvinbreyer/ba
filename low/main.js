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
        <style>
          :root {
            --gray-50: #f4f4f6;
            --gray-100: #e4e4e8;
            --gray-200: #cfcfd6;
            --gray-300: #b1b1bf;
            --gray-400: #8d8da2;
            --gray-500: #707087;
            --gray-600: #58586a;
            --gray-700: #3e3e4a;
            --gray-800: #26262c;
            --gray-900: #161619;
            --gray-950: #0e0e10;
          }

          * {
            font-size: 1rem;
            margin: 0;
            padding: 0;
          }

          html {
            background: var(--gray-50);
            color: var(--gray-900);
          }

          body {
            padding: 40px 15px;
          }

          section {
            border: 2px solid var(--gray-600);
            margin-bottom: 20px;
            padding: 10px;
            border-radius: 5px;
          }

          .content {
            max-width: 800px;
            margin: 0 auto;
          }

          .teaserTFbgHell {
            background: var(--gray-100);
            padding: 2px 10px;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="content">
          <main id="merged"></main>
        </div>
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

  let s = newTab.document.createElement('script');
  s.innerHTML = `document.querySelectorAll('.imagelinks, .spacer20, .clearboth, a:not([href]), [style="text-align:right;"], br').forEach(el=>{el.remove()});`;
  newTab.document.documentElement.appendChild(s);
})();