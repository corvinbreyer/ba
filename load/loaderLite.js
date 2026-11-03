(function () {
  const MAIN_JS_URL = "https://corvinbreyer.github.io/ba/load/main.js?t="+Date.now();

  const _VERSION = '1.0.1';
  const RESULTS_SORT_AtoZ = true;
  const RESULTS_SORT_FAILtoPASS = true;
  const STATUS_IS_OPENED = {
    crash: true,
    fail: true,
    check: true,
    pass: false
  };

  let selectedTests = [
    /* 1012 */ "imagesMissingAlt",
    /* 1013 */ "imagesEmptyAlt",
    /* 1031 */ "checkHeadings",
    /* 1242 */ "pruefeDokumenttitel",
    /* 1411 */ "checkIds",
    /* 1311 */ "pruefeLangAttribut",
    /* 1032 */ "pruefeListenStruktur",
    /* 2143 */ "pruefeTextKontrast"
  ];

  if (RESULTS_SORT_AtoZ) selectedTests = selectedTests.sort();

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.dataset.scope='__bar318a5bb8aaf3e';
      s.onload = resolve;
      s.onerror = () => reject(new Error(`Failed to load script: ${src}`));
      document.documentElement.appendChild(s);
    });
  }

  async function ensureMainLoaded() {
    if (window.PageAnalyzerTests) return;
    await loadScript(MAIN_JS_URL);

    if (!window.PageAnalyzerTests) {
      throw new Error("main.js loaded, but PageAnalyzerTests is not available.");
    }
  }

  function normalizeStatus(status) {
    return ["pass", "check", "fail"].includes(status) ? status : "check";
  }

  async function runTests(testNames) {
    const results = [];

    for (const name of testNames) {
      const fn = window.PageAnalyzerTests[name];

      if (typeof fn !== "function") {
        results.push({
          id: `Error`,
          reqLink: ['#', 'Error'],
          reqInfo: [`Test ${name} nicht gefunden`, `Betroffen: ${name}`],
          title: `Unbekannter Test: ${name}`,
          status: "crash",
          content: "This test name was configured in loader.js but not found in main.js."
        });
        continue;
      }

      try {
        const result = await fn();

        results.push({
          id: result?.id || name,
          reqLink: result?.reqLink || ['https://bitvtest.de/pruefverfahren/bitv-20-web', 'Weitere Prüfschritte anzeigen'],
          reqInfo: result?.reqInfo || ['', ''],
          title: result?.title || name,
          status: normalizeStatus(result?.status),
          content: result?.content || ""
        });
      } catch (err) {
        results.push({
          id: `Error`,  
          reqLink: ['', 'Error'],
          reqInfo: [`${err.name} im Test`, `${name}: <code>${err.name || 'Unbekannter Fehler'}</code>`],
          title: `${err.name} in test: ${name}`,
          status: "crash",
          content: `<pre>${__bar_escapeHtml(err.toString() || String(err))}</pre><pre>${__bar_escapeHtml(err.stack || err)}</pre>`
        });
      }
    }

    return results;
  }

  function getSummary(results) {
    return results.reduce(
      (acc, result) => {
        acc[result.status] = (acc[result.status] || 0) + 1;
        return acc;
      },
      { pass: 0, check: 0, fail: 0, crash: 0 }
    );
  }

  function getBadgeLabel(status) {
    if (status === "pass") return "BESTANDEN";
    if (status === "check") return "PRÜFEN";
    if (status === "fail") return "PROBLEM";
    if (status === "crash") return "ERROR";
    return "CHECK";
  }

  function openReport(results) {
    const summary = getSummary(results);

    const reportWindow = window.open("", "_blank");
    if (!reportWindow) {
      alert("Popup wurde blockiert. Bitte erlaube Popups auf dieser Seite, um die Prüfung durchzuführen.");
      return;
    }

    const ratingTotal = (summary.fail + summary.pass);
    const totalRating = summary.pass / ratingTotal;
    let ratingColor = 'pass';
    if (totalRating <= 0.7) ratingColor = 'check';
    if (totalRating <= 0.4) ratingColor = 'fail';
    const ratingOutput = (totalRating*100).toFixed(0);

    const html = `
      <!doctype html>
      <html lang="de">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="robots" content="noindex, nofollow">
        <title>Barrierefreiheit Analyse Report</title>
        <link rel="icon" type="image/png" src="data:image/png;base64,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" sizes="96x96">
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css">
        <base href="${window.location.origin}">
        <style>
          :root {
              --gray-0: #fff;
              --gray-50: #eeeeef;
              --gray-100: #dfe1e2;
              --gray-200: #caced2;
              --gray-300: #b1b9c2;
              --gray-400: #919eae;
              --gray-500: #718199;
              --gray-600: #5e6b81;
              --gray-700: #4f5768;
              --gray-800: #3e434d;
              --gray-900: #2d2f35;
              --gray-950: #1d1e21;
              --gray-970: #141416;
              --gray-990: #0f0f10;
              --gray-999: #000;

              --info-50: #ebf1f2;
              --info-100: #d6e9eb;
              --info-200: #b5e1e8;
              --info-300: #87dbeb;
              --info-400: #4ad4f5;
              --info-500: #0bc6ff;
              --info-600: #06a1da;
              --info-700: #1079a6;
              --info-800: #165575;
              --info-900: #17374a;
              --info-950: #12212b;
              --info-970: #0f161b;
              --info-990: #0d1012;

              --pass-50: #fbfcfb;
              --pass-100: #f2f6f1;
              --pass-200: #e0eee0;
              --pass-300: #c4e6c4;
              --pass-400: #99de9b;
              --pass-500: #69d670;
              --pass-600: #48c955;
              --pass-700: #3ca74b;
              --pass-800: #367a41;
              --pass-900: #2c5134;
              --pass-950: #1e3122;
              --pass-970: #172019;
              --pass-990: #121613;

              --check-50: #fcfcfa;
              --check-100: #f8f6f0;
              --check-200: #f3edda;
              --check-300: #f3e2b7;
              --check-400: #f8d27f;
              --check-500: #ffbc40;
              --check-600: #f9a218;
              --check-700: #cf8014;
              --check-800: #945d1c;
              --check-900: #5f3f1e;
              --check-950: #382717;
              --check-970: #231b13;
              --check-990: #181410;

              --fail-50: #fcfbfb;
              --fail-100: #f6f1f1;
              --fail-200: #f0dfde;
              --fail-300: #eac2c0;
              --fail-400: #e69191;
              --fail-500: #e25d61;
              --fail-600: #d73a44;
              --fail-700: #b2313e;
              --fail-800: #822e3a;
              --fail-900: #552830;
              --fail-950: #331c20;
              --fail-970: #211618;
              --fail-990: #171113;

              --crash-50: #f0edf0;
              --crash-100: #e4dce6;
              --crash-200: #d6c3da;
              --crash-300: #c6a2d0;
              --crash-400: #b378c7;
              --crash-500: #9d4dbd;
              --crash-600: #813fa0;
              --crash-700: #65397e;
              --crash-800: #4a305b;
              --crash-900: #32253c;
              --crash-950: #1f1924;
              --crash-970: #151218;
              --crash-990: #100e11;
          }

          * {
              padding: 0;
              margin: 0;
          }

          body {
              font-family: Arial, sans-serif;
              line-height: 1.5;
              margin: 0;
              padding: 40px 20px;
              background: var(--gray-200);
              color: var(--gray-970);

              margin: 0;
              font-family: "Segoe UI", "Inter", ui-sans-serif, system-ui, -apple-system, sans-serif;
              background: var(--gray-50);
              color: var(--gray-990);
              line-height: 1.55;

              background-size: 40px 40px;
              background-image: radial-gradient(circle, var(--gray-300) 1px, var(--gray-100) 1px);
          }

          h1 {
              margin-top: 0;
              margin-bottom: 8px;
              font-size: 1.5rem;
              font-weight: 700;
              background: var(--gray-50);
              padding: 5px 15px;
              border-radius: 6px;
              border: 1px solid var(--gray-300);
          }

          h2 {
              font-size: 1.25rem;
              font-weight: 600;
          }

          h2,
          h3,
          h4,
          h5,
          h6 {
            margin-top: 10px;
          }

          strong {
              font-weight: 600;
          }

          a {
              color: var(--info-700);
          }

          ol,
          ul {
              padding-left: 30px;
          }

          li {
              padding: 4px 10px;
              border: 1px solid var(--gray-400);
              border-bottom-width: 3px;
              margin-top: 10px;
              border-radius: 4px;
              box-shadow: 0 0 8px var(--gray-200);
              overflow-wrap: break-word;
          }

          img {
              border-radius: 4px;
              border: 1px solid var(--gray-300);
              margin: 5px 5px 5px 0;
          }

          button,
          input {
              font-family: "Segoe UI", "Inter", ui-sans-serif, system-ui, -apple-system, sans-serif;
          }

          button {
              background: var(--gray-800);
              color: var(--gray-50);
              padding: 5px 12px;
              border-radius: 6px;
              border: 1px solid var(--gray-900);
              font-weight: 500;
              margin: 2px 0;
          }

          button:hover {
              background: var(--gray-50);
              color: var(--gray-950);
          }

          code {
              background: var(--gray-50);
              padding: 1px 3px;
              border-radius: 3px;
          }

          iframe {
            border: none;
            width: 100%;
            height: 400px;
          }

          .content {
              max-width: 1300px;
              margin: 0 auto;
          }

          .headFlex {
            display: flex;
            justify-content: space-between;
            margin: 40px 0;
            flex-wrap: wrap;
          }

          .meta {
              margin-bottom: 24px;
              color: var(--gray-900);
          }

          .score-box h2 {
            margin:0 0 10px
          }

          .score-box {
            padding: 15px 15px;
            margin-bottom:24px;
            background: var(--gray-50);
            border-radius:6px;
            border: 1px solid var(--gray-200)
          }

          .summary {
              display: flex;
              gap: 10px;
              flex-wrap: wrap;
          }

          .summary-box {
              background: white;
              border: 1px solid var(--gray-300);
              border-radius: 8px;
              padding: 12px 16px;
              min-width: 120px;
              font-size: 1.25rem;
              text-align: center;
          }

          .summary-pass {
              background: var(--pass-100);
              color: var(--pass-970);
              border: 3px solid var(--pass-600);
          }

          .summary-check {
              background: var(--check-100);
              color: var(--check-970);
              border: 3px solid var(--check-600);
          }

          .summary-fail {
              background: var(--fail-100);
              color: var(--fail-970);
              border: 3px solid var(--fail-600);
          }

          .summary-crash {
              background: var(--crash-100);
              color: var(--crash-970);
              border: 3px solid var(--crash-600);
          }

          .box {
              background: white;
              border: 2px solid var(--gray-400);
              margin-bottom: 10px;
              box-shadow: 0 0 5px #0001;
              transition: all 0.2s;
          }

          details[open].box {
              margin-bottom: 30px;
              box-shadow: 0 0 5px #0003;
              transition: all 0.2s;
          }

          .box summary,
          .box-content {
              padding: 10px 10px 10px 16px;
          }

          .box-content summary {
              color: var(--info-700);
          }

          summary {
              background: #00000007;
          }

          details {
              border: 1px solid var(--gray-400);
              border-radius: 6px;
              margin-top: 5px;
          }

          summary {
              border-radius: 3px;
          }

          details[open]>summary {
              border-bottom: 1px solid var(--gray-400);
              border-radius: 3px 3px 0 0;
          }

          details>.box-content {
              height: 0;
              transition: all 0.3s;
          }

          details[open]>.box-content {
              height: auto;
              transition: all 0.3s;
          }

          .reqHr {
              border: none;
              border-top: 2px dashed var(--gray-500);
              margin: 10px 0;
          }

          summary:hover {
              background: #0001;
          }

          .box-header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 12px;
          }

          .box h2 {
              margin: 0;
              font-size: 18px;
          }

          .badge {
              display: inline-block;
              padding: 4px 10px;
              border-radius: 6px;
              font-size: 12px;
              font-weight: bold;
              letter-spacing: 0.03em;
          }

          .badge-pass {
              background: var(--pass-200);
              color: var(--pass-700);
          }

          .badge-check {
              background: var(--check-200);
              color: var(--check-700);
          }

          .badge-fail {
              background: var(--fail-200);
              color: var(--fail-700);
          }

          .badge-crash {
              background: var(--crash-200);
              color: var(--crash-700);
          }

          .box-pass {
              border-left: 15px solid var(--pass-600);
          }

          .box-check {
              border-left: 15px solid var(--check-600);
          }

          .box-fail {
              border-left: 15px solid var(--fail-600);
          }

          .box-crash {
              border-left: 15px solid var(--crash-600);
          }

          .box-pass .box-header {
              background: var(--pass-50);
              color: var(--pass-970);
          }

          .box-check .box-header {
              background: var(--check-50);
              color: var(--check-970);
          }

          .box-fail .box-header {
              background: var(--fail-50);
              color: var(--fail-970);
          }

          .box-crash .box-header {
              background: var(--crash-50);
              color: var(--crash-970);
          }

          .box-pass .box-header:hover {
              background: var(--pass-200);
          }

          .box-check .box-header:hover {
              background: var(--check-200);
          }

          .box-fail .box-header:hover {
              background: var(--fail-200);
          }

          .box-crash .box-header:hover {
              background: var(--crash-200);
          }

          code,
          pre {
              background: var(--gray-50);
              border: 1px solid var(--gray-200);
              border-radius: 4px;
          }

          code {
              padding: 2px 4px;
          }

          pre {
              padding: 12px;
              overflow: auto;
          }

          ul {
              padding-left: 20px;
          }

          td {
              padding: 10px;
          }

          .clonedElement {
              background: var(--gray-50);
              border-radius: 6px;
              border: 3px solid var(--gray-200);
              padding: 5px 10px;
              box-shadow: 5px 5px 15px var(--gray-200);
              margin: 0 10px 10px 0;
          }

          summary::marker,
          summary::-webkit-details-marker {
              list-style: none;
              display: none;
          }

          summary {
              list-style: none;
          }

          details>summary .toggleText {
              margin: 0;
              padding-left: 20px;
              position: relative;
          }

          /*https://symbolonly.com/arrow-symbols.html*/
          details>summary .toggleText::before {
              content: '⮞ ';
              /*⮞ᐅᐳ▶▸*/
              position: absolute;
              font-weight: 900;
              left: 0;
              top: 0;
              color: var(--gray-600);
              transition: all 0.2s;
          }

          details[open]>summary .toggleText::before {
              /*⮟ᐁᐯ▼▾*/
              /*content: '▶ ';
              position: absolute;
              left: 0;
              top: 0;
              color: var(--gray-600);*/
              top: 0.05rem;
              transform: rotate(90deg);
              transition: all 0.2s;
          }

          .inline-content {
              padding:10px;
          }

          .popupButton {
            margin-top: 5px;
          }

          details.reqirementDetails {
            border: 1px solid var(--gray-200);
          }

          .reqirementDetails summary {
            padding: 2px 8px;
            color: var(--gray-800);
          }

          summary,
          button {
            cursor: pointer;
          }
        </style>
      </head>
      <body>
        <div class="content">
          <small>Dies ist ein Hilfwerkzeug in einer frühen Fassung, garantiert keine Korrektheit der Ergebnisse und ersetzt keine vollständige Prüfung auf Barrierefreiheit.</small>
          <h1><i class="ti ti-accessible"></i> Barrierefreiheit Analyse Report</h1>

          <div class="headFlex">
            <div>
              <div class="meta">
                <div class="metaUrl"><strong>Seite/URL:</strong> <a href="${__bar_escapeHtml(location.href)}" target="_blank">${__bar_escapeHtml(location.href)}</a></div>
                <div class="metaDate"><strong>Erstellt:</strong> ${__bar_escapeHtml(new Date().toLocaleString())}</div>
                <div class="metaCount"><strong>Geprüfte Tests:</strong> ${results.length}</div>
              </div>
              
              <div class="score-box">
                <h2>Gesamtwertung: <span style="color:var(--${ratingColor}-black); background:var(--${ratingColor}-white); padding: 0 4px; border-radius: 6px">${ratingOutput}%</span></h2>
                <div class="summary">
                  ${summary.crash > 0 ? `
                  <div class="summary-box summary-crash">
                    Crash
                    <strong>${summary.crash}</strong>
                  </div>` : ''}
                  <div class="summary-box summary-fail">
                    Problem
                    <strong>${summary.fail}</strong>
                  </div>
                  <div class="summary-box summary-check">
                    Prüfen
                    <strong>${summary.check}</strong>
                  </div>
                  <div class="summary-box summary-pass">
                    Bestanden
                    <strong>${summary.pass}</strong>
                  </div>
                </div>
              </div>

              <button onclick="openBoxes()">⮟ Alle ausklappen</button>
              <button onclick="closeBoxes()">⮞ Alle zuklappen</button>
            </div>
            <div>
              <canvas id="summary-chart" width="500" height="300" style="max-width: 100%;"></canvas>
            </div>
          </div>

          ${results.map(r => `<details class="box box-${r.status}" id="${r.uuid}" ${STATUS_IS_OPENED[r.status] ? 'open' : ''}>
            <summary class="box-header">
              <h2 class="toggleText">${__bar_escapeHtml(r.title)}</h2>
              <span class="badge badge-${r.status}">${getBadgeLabel(r.status)}</span>
            </summary>
            <div class="box-content details-content">
              <div class="resultContent">
                ${r.content}
              </div>
              <hr class="reqHr">
              <details class="reqirementDetails">
                <summary>
                  <p class="toggleText">Weitere Infos zur Anforderung</p>
                </summary>
                <div class="inline-content details-content">
                  <div class="reqInfo">
                    <p><strong>${__bar_escapeHtml(r.reqInfo[0])}</strong><br>
                      ${__bar_escapeHtml(r.reqInfo[1])}<br>
                      <a class="reqLink" href="${__bar_escapeHtml(r.reqLink[0])}" target="_blank">${__bar_escapeHtml(r.reqLink[1])}</a><br>
                      <span class="reqId">Projektinterne ID: ${__bar_escapeHtml(r.id)}</span>
                    </p>
                    <button class="popupButton removeInPopup" onclick="openPopup(this, '${__bar_escapeHtml(r.title)}')">Ergebnisse in Popup öffnen</button>
                  </div>
                </div>
              </details>
            </div>
          </details>
        `).join("")}
        <p style="color: var(--gray-700); margin-top: 30px; font-size: 0.75rem"><strong>Corvin Breyer / 2026</strong><br>c.breyer@posteo.de<br>Version ${_VERSION}</p>
        </div>

        <script>
        const TEST_CLASS = "wcag-text-spacing-test";
        const STYLE_ID = "wcag-text-spacing-test-style";
        document.body.style.fontSize = 'unset'; //2144
        document.body.classList.remove(TEST_CLASS); //2148
        const style2148 = document.getElementById(STYLE_ID); //2148
        if (style2148) style2148.remove(); //2148

        function cssVar(s) {
            return getComputedStyle(document.documentElement).getPropertyValue(s);
        }

        function openPopup(button, docTitle) {
            const details = button.closest('details.box');
            const clone = details.cloneNode(true);
            clone.querySelectorAll('.removeInPopup').forEach(el => el.remove()); /*remove cloned popup button*/
            clone.setAttribute("open", "true");

            let styles = "";
            document.querySelectorAll("style").forEach(styleTag => {
              styles += styleTag.outerHTML;
            });

            const popup = window.open("", "_blank", "width=700,height=400");
            popup.document.write(\`
              <html>
                <head>
                  <title>\$\{docTitle\} – Popup</title>
                  \$\{styles\}
                </head>
                <body>
                  \$\{clone.outerHTML\}
                </body>
              </html>
            \`);

            popup.document.close();
          }
        </script>

        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <script>
          function openBoxes(scope = '') {
            document.querySelectorAll('details.box' + scope).forEach(el => el.setAttribute('open', ''));
          }
          
          function closeBoxes(scope = '') {
            document.querySelectorAll('details.box' + scope).forEach(el => el.removeAttribute('open'));
          }

          const ctx = document.getElementById('summary-chart').getContext('2d');
          const data = {
            labels: [${summary.crash > 0 ? `'Error',` : ''} 'Bestanden', 'Prüfen', 'Problem'],
            datasets: [{
              label: 'Testfälle',
              data: [${summary.crash > 0 ? `${summary.crash},` : ''} ${summary.pass}, ${summary.check}, ${summary.fail}],
              backgroundColor: [
                ${summary.crash > 0 ? `cssVar('--crash-600'),` : ''}
                cssVar('--pass-600'), // pass
                cssVar('--check-600'), // check
                cssVar('--fail-600') // fail
              ],
              borderColor: [
                ${summary.crash > 0 ? `'#ffffff00',` : ''}
                '#ffffff00',
                '#ffffff00',
                '#ffffff00',
              ],
              borderWidth: 2
            }]
          };

          const config = {
            type: 'doughnut',
            data: data,
            options: {
              responsive: false,
              plugins: {
                legend: {
                  position: 'right',
                },
                tooltip: {
                  enabled: true
                }
              }
            }
          };

          new Chart(ctx, config);
        </script>
      </body>
      </html>
    `;

    reportWindow.document.open();
    reportWindow.document.write(html);
    reportWindow.document.close();
  }

  function __bar_escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  /*function getRootVar(cssVar) {
    return window.getComputedStyle(document.body).getPropertyValue(cssVar);
  }*/

  async function __bar_init() {
    try {
      await ensureMainLoaded();
      const results = await runTests(selectedTests);
      if (RESULTS_SORT_FAILtoPASS) {
        results.sort((a, b) => {
          const order = { crash: 0, fail: 1, check: 2, pass: 3 };
          return order[a.status] - order[b.status];
        });
      }
      results.forEach(obj => obj.uuid = crypto.randomUUID());
      openReport(results);
    } catch (err) {
      console.error("Page analyzer failed:", err);
      alert("Page analyzer failed: " + (err.message || String(err)));
    }
    document.querySelectorAll('[data-scope="__bar318a5bb8aaf3e"]').forEach((el)=>{el.remove()}); //snipe remove prior execution files
  }

  __bar_init();
})();