(function () {
  const MAIN_JS_URL = "https://cb52251b-2cfb-4286-a986-1754ac127ea5.github.io/01a0ef2e-8b00-7c81-ae26-31e608146e19/load/main.js?t="+Date.now();

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
    /* 1244 */ "linksWithoutText",
    /* 1031 */ "checkHeadings",
    /* 1242 */ "pruefeDokumenttitel",
    /* 1411 */ "checkIds",
    /* 1411 */ "checkDuplicateAttributes",
    /* 1034 */ "textFromCSS",
    /* 1241 */ "checkLandmarks",
    /* 1035 */ "pruefeSichtbareTabellen",
    /* 1037 */ "pruefeTransparenteTabellen",
    /* 1311 */ "pruefeLangAttribut",
    /* 1141 */ "pruefeLinksImFliesstext",
    /* 1032 */ "pruefeListenStruktur",
    /* 2135 */ "pruefeAutocompleteAttribute",
    /* 1253 */ "pruefeLabelInName",
    /* 1332 */ "pruefeFormularBeschriftungen",
    /* 1038 */ "pruefeBeschriftungenStrengWCAG",
    /* 1036 */ "checkThScope",
    /* 2146 */ "checkHorizontalScroll320",
    /* 2143 */ "pruefeTextKontrast",
    /* 2144 */ "pruefeTextVergroesserung200",
    /* 2148 */ "pruefeTextabstaendeAnpassbar"
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
        <meta charset="UTF-8" />
        <title>Barrierefreiheit Analyse Report</title>
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
          <h1>Barrierefreiheit Analyse Report</h1>

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
        <p style="color: var(--gray-700); margin-top: 30px; font-size: 0.75rem"><strong>Corvin Breyer / 2026</strong><br>c.breyer@posteo.de<br>v.01a0ef2e-8b00-7235-9aa8-02e45fd2eeb5</p>
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