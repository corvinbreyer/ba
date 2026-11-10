(async () => {
  // Find all links in .column1
  const links = [...document.querySelectorAll('.column1 a[href]')];

  if (!links.length) {
    alert('No links found inside .column1!');
    return;
  }

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
		<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css" />
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
            background: var(--gray-200);
            color: var(--gray-900);
			font-family: sans-serif;
			line-height: 1.5;
          }

          body {
            padding: 40px 15px;
          }

          section {
            border: 2px solid var(--gray-600);
            margin-bottom: 20px;
            padding: 10px;
            border-radius: 5px;
			background: var(--gray-50);
          }

		  .highlight {
		  outline: 2px solid blue;
		  }

          .content {
            max-width: 800px;
            margin: 0 auto;
          }
		  
		  .elementCont {
			  border: 1px solid var(--gray-600);
			  border-radius: 5px;
			  padding: 10px;
		  }
		  
		  .teaserTF {
			  font-style: italic;
			  padding-left: 5px;
			  border-left: 1px solid var(--gray-400);
		  }

          .teaserTFbgHell {
            background: var(--gray-100);
			margin: 5px 0;
			border: 2px solid var(--gray-500);
            padding: 5px 15px;
            font-weight: bold;
			border-radius: 5px
          }

          #merged :is(ul, ol, li) {
            list-style: none !important;
            padding-inline: 0 !important;
            margin-inline: 0 !important;
            text-indent: 0 !important;
          }

          #merged li::marker {
            content: "";
          }

          .elementCont + .elementCont {
            margin-top: 12px;
          }

          .merged-action {
            margin-inline: 4px;
            padding: 2px 6px;
            border: 1px solid var(--gray-300);
            border-radius: 4px;
            background: var(--gray-100);
            color: var(--gray-900);
            font-size: 0.75rem;
            cursor: pointer;
          }
        </style>
      </head>
      <body>
        <div class="content">
          <main id="merged"></main>
        </div>
		<script>

		document.addEventListener("click", (event) => {
		  const container = event.target.closest(".elementCont");
		
		  document.querySelectorAll(".elementCont").forEach(el => {
		    el.classList.toggle("highlight", el === container);
		  });
		});
		
		</script>
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

  const output = newTab.document;
  merged.querySelectorAll(
    '.imagelinks, .spacer20, .clearboth, a:not([href]), [style="text-align:right;"], br'
  ).forEach((element) => element.remove());

  for (const section of merged.children) {
    const teasers = [...section.querySelectorAll('.teaserTF')];
    let nextBoundary = null;

    for (const teaser of teasers.reverse()) {
      const range = output.createRange();
      range.setStartBefore(teaser);
      if (nextBoundary) {
        range.setEndBefore(nextBoundary);
      } else {
        range.setEnd(section, section.childNodes.length);
      }

      const container = output.createElement('div');
      container.className = 'elementCont';
      // Work backwards so each completed group marks the next boundary.
      const content = range.extractContents();
      range.insertNode(container);
      container.append(content);
      nextBoundary = container;
    }
  }

  for (const element of merged.querySelectorAll('b, strong, em, i')) {
    const span = output.createElement('span');
    for (const attribute of element.attributes) {
      span.setAttribute(attribute.name, attribute.value);
    }
    span.append(...element.childNodes);
    element.replaceWith(span);
  }

  function addButton(after, label, action) {
    const button = output.createElement('button');
    button.type = 'button';
    button.className = 'merged-action ' + label.substring(0,4);
    button.textContent = label;
    button.addEventListener('click', async () => {
      try {
        await action();
      } catch {
        button.textContent = label + ' failed';
      }
    });
    after.after(button);
    return button;
  }

  const walker = output.createTreeWalker(merged, NodeFilter.SHOW_TEXT);
  const textBlocks = new Map();
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const parent = node.parentElement;
    if (parent.closest('script, style, textarea, button, select')) continue;

    const block = parent.closest(
      'p, li, div, section, main, td, th, dt, dd, blockquote, pre, h1, h2, h3, h4, h5, h6, figcaption'
    );
    const entry = textBlocks.get(block) ?? { parts: [], anchor: null };
    entry.parts.push(node.data);
    if (node.data.trim() && !parent.closest('a')) {
      let anchor = node;
      while (anchor.parentNode !== block) anchor = anchor.parentNode;
      entry.anchor = anchor;
    }
    textBlocks.set(block, entry);
  }

  for (const { parts, anchor } of textBlocks.values()) {
    if (!anchor) continue;
    const rawText = parts.join('');
    addButton(anchor, 'Copy', () => newTab.navigator.clipboard.writeText(rawText.trim()));
  }

  for (const link of merged.querySelectorAll('a[href]')) {
    const rawText = link.textContent;
    const copyText = addButton(link, 'Copy text', () => newTab.navigator.clipboard.writeText(rawText.trim()));

    const url = new URL(link.href);
    const copyUrl = addButton(copyText, 'Copy URL', () => newTab.navigator.clipboard.writeText(url.href.trim()));
    if (!/\.pdf$/i.test(url.pathname)) continue;

    addButton(copyUrl, 'Download PDF', async () => {
      const response = await fetch(url);
      if (!response.ok) throw new Error('HTTP ' + response.status);

      const blobUrl = newTab.URL.createObjectURL(await response.blob());
      const download = output.createElement('a');
      download.href = blobUrl;
      download.download = url.pathname.split('/').pop();
      output.body.append(download);
      download.click();
      download.remove();
      newTab.setTimeout(() => newTab.URL.revokeObjectURL(blobUrl), 30_000);
    });
  }
})();
