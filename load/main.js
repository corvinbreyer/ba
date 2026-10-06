const COMPANY_NAME = 'Ernst Klett Verlag';

const tests = {
  imagesMissingAlt() {
    const images = [...__bar_all("img")];
    const missingAlt = images.filter(img => !img.hasAttribute("alt"));

    return {
      id: 'R1012',
      reqLink: ['https://bitvtest.de/pruefschritt/bitv-20-web/bitv-20-web-9-1-1-1b-alternativtexte-fuer-grafiken-und-objekte', 'Prüfschritt aufrufen'],
      reqInfo: ['Prüfschritt 9.1.1.1b', 'Alternativtexte für Grafiken und Objekte'],
      title: "Bilder ohne Alt-Tag",
      status: missingAlt.length === 0 ? "pass" : "fail",
      content: missingAlt.length === 0
        ? "Alle Bilder haben ein vorhandenes <code>alt</code>-Attribut."
        : `
          <p><strong>${missingAlt.length}</strong> Bild(er) besitzen kein <code>alt</code>-Attribut.</p>
          <ol>
            ${missingAlt.slice(0, 15).map((img, i) => `
              <li>Element: <code>${__bar_escapeHtml(img.outerHTML.slice(0, 200))}</code><br>
              Quelle: <a href="${__bar_escapeHtml(img.src)}" target="_blank">${__bar_escapeHtml(img.src.slice(0, 200))}</a><br>
              Position: <code>${getDomPath(img)}</code>${img.hasAttribute('src') ? `<br>
              <img src="${img.src}" height="100">` : ''}</li>
            `).join("")}
          </ol>
          ${missingAlt.length > 15 ? "<p>Es werden nur die ersten 15 Probleme angezeigt.</p>" : ""}
        `
    };
  },

  imagesEmptyAlt() {
    const images = [...__bar_all("img")];
    const emptyAltImages = images.filter(img => img.hasAttribute("alt") && img.getAttribute("alt").trim() === "");

    return {
      id: 'R1013',
      reqLink: ['https://bitvtest.de/pruefschritt/bitv-20-web/bitv-20-web-9-1-1-1c-leere-alt-attribute-fuer-layoutgrafiken', 'Prüfschritt aufrufen'],
      reqInfo: ['Prüfschritt 9.1.1.1c', 'Leere alt-Attribute für Layoutgrafiken'],
      title: "Bilder mit leerem Alt-Tag",
      status: emptyAltImages.length === 0 ? "pass" : "check",
      content: emptyAltImages.length === 0
        ? "<p>Alle Alt-Texte in Bildern sind befüllt.</p>"
        : `
          <p><strong>${emptyAltImages.length}</strong> ${emptyAltImages.length == 1 ? 'Bild hat' : 'Bilder haben'} einen leeren <code>alt</code>-Tag. ${emptyAltImages.length == 1 ? 'Dieses Bild darf' : 'Diese Bilder dürfen'} daher <strong>keinen wichtigen Informationsgehalt</strong> besitzen, da diese${emptyAltImages.length == 1 ? 's' : ''} als Schmuckbild${emptyAltImages.length == 1 ? '' : 'er'} interpretiert ${emptyAltImages.length == 1 ? 'wird' : 'werden'}.<br>Bitte kontrolliere, ob das so korrekt ist.</p>
          <ol>
            ${emptyAltImages.slice(0, 15).map((img, i) => `
              <li>Quelle: <a href="${__bar_escapeHtml(img.src)}" target="_blank">${__bar_escapeHtml(img.src.slice(0, 200))}</a><br>
              Element: <code>${__bar_escapeHtml(img.outerHTML.slice(0, 200))}</code><br>
              Position: <code>${getDomPath(img)}</code>${img.hasAttribute('src') ? `<br>
              <img src="${img.src}" height="100">` : ''}</li>
            `).join("")}
          </ol>
          ${emptyAltImages.length > 15 ? "<p>Es werden nur die ersten 15 Probleme angezeigt.</p>" : ""}
        `
    };
  },

  linksWithoutText() {
    const links = [...__bar_all("a")];

    const isHidden = (el) => {
      if (!el || el.nodeType !== Node.ELEMENT_NODE) return false;

      const style = window.getComputedStyle(el);

      return (
        el.hidden ||
        el.getAttribute("aria-hidden") === "true" ||
        style.display === "none" ||
        style.visibility === "hidden"
      );
    };

    const getVisibleText = (el) => {
      if (!el) return "";

      let text = "";

      const walk = (node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          text += node.textContent;
          return;
        }

        if (node.nodeType !== Node.ELEMENT_NODE) return;

        if (isHidden(node)) return;

        for (const child of node.childNodes) {
          walk(child);
        }
      };

      walk(el);

      return text.trim();
    };

    const getAriaLabelledByText = (el) => {
      const labelledBy = el.getAttribute("aria-labelledby");
      if (!labelledBy) return "";

      return labelledBy
        .split(/\s+/)
        .map(id => document.getElementById(id))
        .filter(Boolean)
        .map(labelEl => getVisibleText(labelEl) || labelEl.textContent.trim())
        .join(" ")
        .trim();
    };

    const getImageAltText = (el) => {
      return [...el.querySelectorAll("img, input[type='image']")]
        .filter(img => !isHidden(img))
        .map(img => img.getAttribute("alt"))
        .filter(alt => alt && alt.trim())
        .join(" ")
        .trim();
    };

    const getSvgTitleText = (el) => {
      return [...el.querySelectorAll("svg title")]
        .filter(title => !isHidden(title.closest("svg")))
        .map(title => title.textContent.trim())
        .filter(Boolean)
        .join(" ")
        .trim();
    };

    const getTitleAttributeText = (el) => {
      return (el.getAttribute("title") || "").trim();
    };

    const getAccessibleName = (a) => {
      // 1. aria-labelledby has high priority
      const labelledByText = getAriaLabelledByText(a);
      if (labelledByText) return labelledByText;

      // 2. aria-label
      const ariaLabel = (a.getAttribute("aria-label") || "").trim();
      if (ariaLabel) return ariaLabel;

      // 3. Visible text content
      const visibleText = getVisibleText(a);
      if (visibleText) return visibleText;

      // 4. Image alt text inside link
      const imageAltText = getImageAltText(a);
      if (imageAltText) return imageAltText;

      // 5. SVG title inside link
      const svgTitleText = getSvgTitleText(a);
      if (svgTitleText) return svgTitleText;

      // 6. title attribute fallback
      // Technically can contribute to accessible name,
      // but it is not ideal as the only label.
      const titleText = getTitleAttributeText(a);
      if (titleText) return titleText;

      return "";
    };

    const badLinks = links.filter(a => !getAccessibleName(a));

    return {
      id: 'R1244',
      reqLink: ['https://bitvtest.de/pruefschritt/bitv-20-web/bitv-20-web-9-2-4-4-aussagekraeftige-linktexte', 'Prüfschritt aufrufen'],
      reqInfo: ['Prüfschritt 9.2.4.4', 'Aussagekräftige Linktexte'],
      title: "Links ohne zugänglichen Namen",
      status: badLinks.length === 0 ? "pass" : "fail",
      content: badLinks.length === 0
        ? "<p>Keine Links ohne zugänglichen Namen gefunden.</p>"
        : `
          <p><strong>${badLinks.length}</strong> Link${badLinks.length == 1 ? '' : 's'} scheinen keinen zugänglichen Namen zu haben.</p>
          <p>Ein Link sollte üblicherweise einen sichtbaren Text haben. Links können auch mit Text-Alternativen versehen werden, wie beispielsweise <code>aria-label</code>, <code>aria-labelledby</code>, <code>alt</code>-Texten oder einem SVG <code>title</code>.</p>
          <ol>
            ${badLinks.slice(0, 20).map(a => `
              <li>
                Element: <code>${__bar_escapeHtml(a.outerHTML.slice(0, 200))}</code><br>
                Link zu: <a href="${__bar_escapeHtml(a.href)}" target="_blank">${__bar_escapeHtml(a.href.slice(0, 200))}</a><br>
                Position: <code>${getDomPath(a)}</code>
                <details class="clone">
                  <summary><p class="toggleText">Element anzeigen</p></summary>
                  <div class="inline-content details-content">
                    <div class="clonedElement">${cloneEl(a)}</div>
                  </div>
                </details>
              </li>
            `).join("")}
          </ol>
        `
    };
  },

  checkHeadings() {
    const headings = [...__bar_all("h1, h2, h3, h4, h5, h6")];
    const jumps = [];

    if (headings.length <= 0) {
      return {
        id: 'R1031',
        reqLink: ['https://bitvtest.de/pruefschritt/bitv-20-web/bitv-20-web-9-1-3-1a-html-strukturelemente-fuer-ueberschriften', 'Prüfschritt aufrufen'],
        reqInfo: ['Prüfschritt 9.1.3.1a', 'HTML-Strukturelemente für Überschriften'],
        title: "Sprünge in Überschriften",
        status: "check",
        content: `<p>Es wurden keine Überschriften oder ähnliche Elemente auf der Seite gefunden. Sollte es sich um eine inhaltsreiche Seite handeln, sollte dies vermieden werden.</p>`
      };
    }

    const head1s = [...__bar_all('h1')];
    let h1res = ['check', 'Es wurden keine H1 Überschriften auf der Seite gefunden. Dies verstößt nicht gegen die WCAG Richtlinien, ist aber auch nicht ideal oder empfohlen; vor allem, da andere Überschriften auf der Seite existieren.'];
    if (head1s.length == 1) h1res = ['pass', `Es wurde eine H1 Überschrift auf der Seite gefunden: <strong>${head1s[0].textContent}</strong>. Dies bildet das übliche Verhalten von Webseiten ab.`];
    if (head1s.length > 1) h1res = ['check', 'Es wurde mehr als eine H1 Überschrift auf der Seite gefunden. Dies verstößt nicht gegen die WCAG-Richtlinien, doch ist eine Seite mit nur einer H1 Überschrift häufig einfacher zu verstehen.'];

    for (let i = 1; i < headings.length; i++) {
      const previous = headings[i - 1];
      const current = headings[i];

      const previousLevel = Number(previous.tagName.substring(1));
      const currentLevel = Number(current.tagName.substring(1));

      if (currentLevel > previousLevel + 1) {
        jumps.push({
          from: previous,
          to: current,
          fromLevel: previousLevel,
          toLevel: currentLevel
        });
      }
    }

    let prevHLevel = +headings[0].tagName.substring(1);
    let headingList_content = (headings.length === 0)
        ? "<p>Keine Überschriften auf der Seite gefunden.</p>"
        : `
          <p><strong>${headings.length}</strong> Überschriften gefunden.</p>
          <ol>
            ${headings.map((el, i) => {
              const level = parseInt(el.tagName.substring(1), 10);
              const text = (el.textContent || "").trim() || "(no text)";
              const indent = (level - 1) * 16;
              const isJump = (level > (prevHLevel + 1));
              prevHLevel = level;

              return `
                <li style="margin-left:${indent}px" ${isJump ? 'class="highlight-temp"' : ''}>
                  <strong>&lt;h${level}&gt;</strong> ${__bar_escapeHtml(text)}
                </li>
              `;
            }).join("")}
          </ol>
        `;

    let headingJumps_content = (jumps.length === 0)
        ? "<p>Keine Sprünge in Überschriften gefunden.</p>"
        : `
          <p><strong>${jumps.length}</strong> Sprünge in Überschriften gefunden.</p>
          <ol>
            ${jumps.slice(0, 15).map((jump, i) => `
              <li>
                <strong>Sprung von &lt;h${jump.fromLevel}&gt; zu &lt;h${jump.toLevel}&gt;</strong><br>
                <strong>"${__bar_escapeHtml((jump.from.textContent || "").trim() || "[ohne Text]")}"</strong> zu <strong>"${__bar_escapeHtml((jump.to.textContent || "").trim() || "[ohne Text]")}"</strong><br>
                Position: <code>${__bar_escapeHtml(getDomPath(jump.to))}</code>
                <details class="clone">
                  <summary><p class="toggleText">Element anzeigen</p></summary>
                  <div class="inline-content details-content">
                    <div class="clonedElement">${cloneEl(jump.to)}</div>
                  </div>
                </details>
              </li>
            `).join("")}
          </ol>
          ${jumps.length > 15 ? "<p>Es werden nur die ersten 15 Probleme angezeigt.</p>" : ""}
        `;

    const invalidHeadings = [...document.querySelectorAll('*')]
      .filter(el => /^h\d+$/i.test(el.tagName))
      .filter(el => {
        const level = Number(el.tagName.slice(1));
        return level < 1 || level > 6;
      });

    let invalidHeadings_content = (invalidHeadings.length === 0)
        ? ''
        : `
          <p><strong>${invalidHeadings.length}</strong> invalide Überschriften gefunden.</p>
          <ol>
            ${invalidHeadings.slice(0, 15).map((el, i) => `
              <li>
                <strong>Ungültiges Element: &lt;${el.tagName.toLowerCase()}&gt;</strong><br>
                <strong>"${el.textContent}"</strong><br>
                Position: <code>${__bar_escapeHtml(getDomPath(el))}</code>
                <details class="clone">
                  <summary><p class="toggleText">Element anzeigen</p></summary>
                  <div class="inline-content details-content">
                    <div class="clonedElement">${cloneEl(el)}</div>
                  </div>
                </details>
              </li>
            `).join("")}
          </ol>
          ${invalidHeadings.length > 15 ? "<p>Es werden nur die ersten 15 Probleme angezeigt.</p>" : ""}
        `;

    let resStatus = jumps.length === 0 ? (headings.length === 0 ? "check" : "pass") : "fail"; //maybe the headings.length fork is obsolete but oh well
    if (resStatus == 'pass') resStatus = h1res[0]; //set status to "h1 check status" if "heading jumps check" passed

    return {
      id: 'R1031',
      reqLink: ['https://bitvtest.de/pruefschritt/bitv-20-web/bitv-20-web-9-1-3-1a-html-strukturelemente-fuer-ueberschriften', 'Prüfschritt aufrufen'],
      reqInfo: ['Prüfschritt 9.1.3.1a', 'HTML-Strukturelemente für Überschriften'],
      title: "Sprünge in Überschriften",
      status: resStatus,
      content: `<p>${h1res[1]}</p>
      ${invalidHeadings_content}
      ${headingJumps_content}
        <details>
          <summary><p class="toggleText">Alle ${headings.length} Überschriften anzeigen</code></p></summary>
          ${headingList_content}
        </details>
      `
    };
  },

  pruefeDokumenttitel() {
    const rawTitle = document.title || "";
    const titleText = rawTitle.trim();

    if (rawTitle == COMPANY_NAME) {
      return {
        id: 'R1242',
        reqLink: ['https://bitvtest.de/pruefschritt/bitv-20-web/bitv-20-web-9-2-4-2-sinnvolle-dokumenttitel', 'Prüfschritt aufrufen'],
        reqInfo: ['Prüfschritt 9.2.4.2', 'Sinnvolle Dokumenttitel'],
        title: "Sinnvoller Dokumenttitel",
        status: "fail",
        content: `<p>Dokumenttitel ist ausschließlich "${COMPANY_NAME}" und gibt daher keine Informationen über den Inhalt der Seite.</p>`
      };
    }

    let score = 100;
    const fehler = [];
    const hinweise = [];

    const isEmpty = !titleText;
    const hasEmojiOrDecoration = /[★☆✓✔✕✖✗✘✦✧❖❤🔥✨🎉🚀💫🌟⚡\u{1F300}-\u{1FAFF}]/u.test(titleText);
    const hasManySpecials = /[!?.\-_=~*#|:;·•<>]{4,}/.test(titleText);
    const hasRepeatedSpaces = /\s{2,}/.test(titleText);
    const looksGeneric = /^(unbenannt|untitled|document|dokument|page|seite|home|homepage|index|app)$/i.test(titleText);
    const looksLikeFile = /^(https?:\/\/|www\.|index\.(html?|php)|default\.(html?|php))/i.test(titleText) || /\.(html?|php|pdf|xml|json|txt)$/i.test(titleText);
    const allCaps = /^[^a-zäöüß]*[A-ZÄÖÜ]{5,}[^a-zäöüß]*$/.test(titleText);
    const words = titleText.split(/\s+/).filter(Boolean);

    if (isEmpty) {
      return {
        id: 'R1242',
        reqLink: ['https://bitvtest.de/pruefschritt/bitv-20-web/bitv-20-web-9-2-4-2-sinnvolle-dokumenttitel', 'Prüfschritt aufrufen'],
        reqInfo: ['Prüfschritt 9.2.4.2', 'Sinnvolle Dokumenttitel'],
        title: "Sinnvoller Dokumenttitel",
        status: "fail",
        content: "<p>Kein Dokumenttitel vorhanden.</p>"
      };
    }

    if (titleText.length < 5) {
      score -= 40;
      fehler.push("Titel ist sehr kurz.");
    }

    if (titleText.length > 80 && titleText.length <= 120) {
      score -= 10;
      hinweise.push("Titel ist relativ lang.");
    }

    if (titleText.length > 120) {
      score -= 25;
      fehler.push("Titel ist sehr lang.");
    }

    if (looksGeneric) {
      score -= 45;
      fehler.push("Titel ist zu generisch.");
    }

    if (looksLikeFile) {
      score -= 35;
      fehler.push("Titel wirkt wie eine URL oder Dateiname.");
    }

    if (hasEmojiOrDecoration) {
      score -= 10;
      hinweise.push("Titel enthält dekorative Zeichen oder Emojis.");
    }

    if (hasManySpecials) {
      score -= 15;
      hinweise.push("Titel enthält viele Sonderzeichen.");
    }

    if (hasRepeatedSpaces) {
      score -= 5;
      hinweise.push("Titel enthält Mehrfach-Leerzeichen.");
    }

    if (allCaps) {
      score -= 10;
      hinweise.push("Titel ist weitgehend in Großbuchstaben.");
    }

    if (words.length < 2 && titleText.length < 15) {
      score -= 10;
      hinweise.push("Titel könnte konkreter sein.");
    }

    score = Math.max(0, Math.min(100, score));

    let status = "pass";
    if (score < 50) {
      status = "fail";
    } else if (score < 85) {
      status = "check";
    }

    const parts = [`Gefundener Titel: "${titleText}".`, `Wertung: ${score}/100.`];
    if (fehler.length) { parts.push("Probleme: " + fehler.join(" ")); }
    if (hinweise.length) { parts.push("Hinweise: " + hinweise.join(" ")); }
    if (status === "pass") { parts.push("Der Titel wirkt sprechend, sinnvoll und sachlich formuliert."); }

    return {
      id: 'R1242',
      reqLink: ['https://bitvtest.de/pruefschritt/bitv-20-web/bitv-20-web-9-2-4-2-sinnvolle-dokumenttitel', 'Prüfschritt aufrufen'],
      reqInfo: ['Prüfschritt 9.2.4.2', 'Sinnvolle Dokumenttitel'],
      title: "Sinnvoller Dokumenttitel",
      status,
      content: `<p>${parts.join("<br>")}</p>`
    };
  },

  checkIds() {
    const visible = (el) => {
      if (!el || !el.isConnected) return false;
      if (el.hidden || el.getAttribute("aria-hidden") === "true") return false;

      const style = window.getComputedStyle(el);
      if (
        style.display === "none" ||
        style.visibility === "hidden" ||
        style.opacity === "0"
      ) {
        return false;
      }

      if (!el.offsetParent && style.position !== "fixed") return false;

      return true;
    };

    const elementsWithId = Array.from(__bar_all("[id]")).filter(visible);

    const idMap = new Map();
    const emptyElements = [];

    elementsWithId.forEach((el) => {
      const id = el.getAttribute("id") || "";

      if (!id.trim()) {
        emptyElements.push(el);
        return;
      }

      if (!idMap.has(id)) {
        idMap.set(id, []);
      }

      idMap.get(id).push(el);
    });

    const duplicateIds = Array.from(idMap.entries())
      .filter(([, elements]) => elements.length > 1);

    const issueCount = duplicateIds.length + emptyElements.length;

    let status = "pass";
    if (issueCount > 0) status = "fail";

    let content = "<p>Keine Probleme mit IDs gefunden.</p>";

    if (issueCount > 0) {
      content = "";
      content += `<p>Doppelte IDs: <strong>${duplicateIds.length}</strong><br>
      Leere IDs: <strong>${emptyElements.length}</strong></p>`;

      if (duplicateIds.length > 0) {
        content += duplicateIds.map(([key, elements]) => {
          return `
            <h4>Doppelte IDs: <code>#${key}</code></h4>
            <p>Es wurden ${elements.length} Elemente mit der gesetzten ID <code>#${key}</code> gefunden.</p>
            <details class="clone">
              <summary><p class="toggleText">Elemente anzeigen</p></summary>
              <div class="inline-content details-content">
                ${elements.map(el => `
                  <div class="clonedElement">${cloneEl(el)}</div>
                `).join("")}
              </div>
            </details>
          `;
        }).join("");
      }

      if (emptyElements.length > 0) {
        content += `
          <h4>Leere IDs</h4>
          <details class="clone">
            <summary><p class="toggleText">Elemente anzeigen</p></summary>
            <div class="inline-content details-content">
              ${emptyElements.map(el => `
                <div class="clonedElement">${cloneEl(el)}</div>
              `).join("")}
            </div>
          </details>
        `;
      }
    }

    return {
      id: 'R1411',
      reqLink: ['https://bitvtest.de/pruefschritt/bitv-20-web/bitv-20-web-9-4-1-1-korrekte-syntax', 'Prüfschritt aufrufen'],
      reqInfo: ['Prüfschritt 9.4.1.1', 'Korrekte Syntax'],
      title: "Elemente IDs",
      status,
      content
    };
  },

  checkDuplicateAttributes() {
    const visible = (el) => {
      if (!el || !el.isConnected) return false;
      if (el.hidden || el.getAttribute("aria-hidden") === "true") return false;

      const style = window.getComputedStyle(el);
      if (
        style.display === "none" ||
        style.visibility === "hidden" ||
        style.opacity === "0"
      ) {
        return false;
      }

      if (!el.offsetParent && style.position !== "fixed") return false;

      return true;
    };

    const allVisibleElements = Array.from(__bar_all("*")).filter(visible);
    const affectedElements = [];

    allVisibleElements.forEach((el) => {
      const names = Array.from(el.attributes).map((attr) => attr.name.toLowerCase());
      const counts = new Map();

      names.forEach((name) => {
        counts.set(name, (counts.get(name) || 0) + 1);
      });

      const duplicates = Array.from(counts.entries()).filter(([, count]) => count > 1);

      if (duplicates.length > 0) {
        affectedElements.push(el);
      }
    });

    let status = "pass";
    if (affectedElements.length > 0) status = "fail";

    let content = "<p>Keine doppelten Attribute gefunden.</p>";

    if (affectedElements.length > 0) {
      content = `<p>Elemente mit doppelten Attributen gefunden: ${affectedElements.length}.</p>`;
    }

    return {
      id: 'R1411',
      reqLink: ['https://bitvtest.de/pruefschritt/bitv-20-web/bitv-20-web-9-4-1-1-korrekte-syntax', 'Prüfschritt aufrufen'],
      reqInfo: ['Prüfschritt 9.4.1.1', 'Korrekte Syntax'],
      title: "Doppelte Attribute",
      status,
      content
    };
  },

  textFromCSS() {
    const normalizeContent = (value) => {
      try {
        value = String(value);
      } catch {
        return "";
      }

      if (value === "none" || value === '""' || value === "''") {
        return "";
      }

      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      return value.trim();
    };

    const results = [];

    __bar_all("*").forEach((el) => {
      let before = "";
      let after = "";

      try {
        before = normalizeContent(getComputedStyle(el, "::before").content);
      } catch {}

      try {
        after = normalizeContent(getComputedStyle(el, "::after").content);
      } catch {}

      const matches = [];

      if (before.length > 2) {
        matches.push(`::before = "${before}"`);
      }

      if (after.length > 2) {
        matches.push(`::after = "${after}"`);
      }

      if (matches.length > 0) {
        let selector = (el.tagName || "").toLowerCase();

        if (el.id) {
          selector += `#${el.id}`;
        }

        if (el.classList && el.classList.length) {
          selector += `.${Array.from(el.classList).slice(0, 4).join(".")}`;
        }

        results.push(
          `<strong>${selector || "(node)"}</strong><br>
          ${matches.join(" | ")}<br>
          Element: <code>${__bar_escapeHtml(getElTag(el))}</code>
          Position: <code>${__bar_escapeHtml(getDomPath(el))}</code>
          <details class="clone">
            <summary><p class="toggleText">Element anzeigen</code></p></summary>
            <div class="inline-content details-content">
              <div class="clonedElement">${cloneEl(el)}</div>
            </div>
          </details>
          `);
      }
    });

    if (results.length === 0) {
      return {
        id: 'R1034',
        reqLink: ['https://bitvtest.de/pruefschritt/bitv-20-web/bitv-20-web-9-1-3-1d-inhalt-gegliedert', 'Prüfschritt aufrufen'],
        reqInfo: ['Prüfschritt 9.1.3.1d', 'Inhalt gegliedert'],
        title: "CSS-Text in Pseudo-Elementen",
        status: "pass",
        content: '<p>Kein per CSS eingebundener Text über "::before" oder "::after" mit mehr als 2 Zeichen gefunden.</p>'
      };
    }

    return {
      id: 'R1034',
      reqLink: ['https://bitvtest.de/pruefschritt/bitv-20-web/bitv-20-web-9-1-3-1d-inhalt-gegliedert', 'Prüfschritt aufrufen'],
      reqInfo: ['Prüfschritt 9.1.3.1d', 'Inhalt gegliedert'],
      title: "CSS-Text in Pseudo-Elementen",
      status: "fail",
      content:
        `<p>Es wurde${results.length == 1 ? '' : 'n'} ${results.length} Element${results.length == 1 ? '' : 'e'} mit per CSS eingebundenem Text gefunden:</p>
        <ol>
          <li>
          ${results.join("</li><li>")}
          </li>
        </ol>`
    };
  },

  checkLandmarks() {
    const LANDMARK_SELECTORS = {
      header: 'header:not([role]), [role="banner"]',
      nav: 'nav:not([role]), [role="navigation"]',
      main: 'main:not([role]), [role="main"]',
      aside: 'aside:not([role]), [role="complementary"]',
      footer: 'footer:not([role]), [role="contentinfo"]'
    };

    function __bar_escapeHtml(value) {
      return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }

    function isHiddenFromAT(el) {
      return el.hidden || el.getAttribute("aria-hidden") === "true";
    }

    function isVisible(el) {
      if (!el || isHiddenFromAT(el)) return false;

      const style = window.getComputedStyle(el);

      if (
        style.display === "none" ||
        style.visibility === "hidden" ||
        style.visibility === "collapse"
      ) {
        return false;
      }

      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    }

    function isPageLevelHeaderOrFooter(el) {
      if (!el) return false;

      return !el.closest("article, aside, main, nav, section");
    }

    function getAccessibleName(el) {
      const ariaLabel = el.getAttribute("aria-label");
      if (ariaLabel && ariaLabel.trim()) return ariaLabel.trim();

      const labelledBy = el.getAttribute("aria-labelledby");
      if (labelledBy) {
        const text = labelledBy
          .split(/\s+/)
          .map((id) => __bar_g(id))
          .filter(Boolean)
          .map((node) => (node.textContent || "").trim())
          .filter(Boolean)
          .join(" ");

        if (text) return text;
      }

      return "";
    }

    function getLandmarkElements(type) {
      const elements = Array.from(__bar_all(LANDMARK_SELECTORS[type]));

      if (type === "header" || type === "footer") {
        return elements.filter((el) => {
          const explicitRole = el.getAttribute("role");
          if (explicitRole === "banner" || explicitRole === "contentinfo") {
            return true;
          }

          return isPageLevelHeaderOrFooter(el);
        });
      }

      return elements;
    }

    function hasFocusableTarget(el) {
      if (!el) return false;

      const tag = el.tagName.toLowerCase();
      const tabindex = el.getAttribute("tabindex");

      return (
        ["a", "button", "input", "select", "textarea"].includes(tag) ||
        tabindex !== null
      );
    }

    function getSkipLinks() {
      const links = Array.from(__bar_all('a[href^="#"]'));

      return links
        .map((link) => {
          const href = link.getAttribute("href");
          const id = href && href.length > 1 ? decodeURIComponent(href.slice(1)) : "";
          const target = id ? __bar_g(id) : null;
          const text = (link.textContent || "").trim();

          const looksLikeSkipLink =
            /skip|spring|springen|direkt|inhalt|content|hauptinhalt|main/i.test(text) ||
            /content|main|hauptinhalt|inhalt/i.test(id);

          return {
            link,
            text,
            href,
            target,
            targetVisible: target ? isVisible(target) : false,
            targetFocusable: target ? hasFocusableTarget(target) : false,
            looksLikeSkipLink
          };
        })
        .filter((item) => item.looksLikeSkipLink);
    }

    function getFramesWithoutTitle() {
      return Array.from(__bar_all("frame, iframe"))
        .filter(isVisible)
        .filter((frame) => {
          const title = frame.getAttribute("title");
          return !title || !title.trim();
        });
    }

    const details = Object.keys(LANDMARK_SELECTORS).map((type) => {
      const elements = getLandmarkElements(type);
      const visibleElements = elements.filter(isVisible);

      return {
        type,
        count: elements.length,
        visibleCount: visibleElements.length,
        namedCount:
          type === "nav" || type === "aside"
            ? visibleElements.filter((el) => getAccessibleName(el)).length
            : null,
        elements,
        visibleElements
      };
    });

    const byType = Object.fromEntries(details.map((item) => [item.type, item]));

    const skipLinks = getSkipLinks();
    const workingSkipLinks = skipLinks.filter((item) => item.target && item.targetVisible);
    const framesWithoutTitle = getFramesWithoutTitle();

    const messages = [];
    const notes = [];

    let status = "pass";

    const mainCount = byType.main.visibleCount;
    const navCount = byType.nav.visibleCount;
    const hasWorkingSkipLink = workingSkipLinks.length > 0;
    const hasMainLandmark = mainCount === 1;
    const hasAnyBypassMechanism = hasWorkingSkipLink || hasMainLandmark;

    // Harte Probleme
    if (mainCount > 1) {
      status = "fail";
      messages.push(`Mehrere sichtbare Hauptbereiche gefunden (${mainCount}). Es sollte in der Regel genau einen <code>main</code> bzw. <code>role="main"</code> geben.`);
    }

    if (byType.main.count > 0 && mainCount === 0) {
      status = "fail";
      messages.push(`<code>main</code> bzw. <code>role="main"</code> ist vorhanden, aber nicht sichtbar oder für assistive Technologien verborgen.`);
    }

    if (!hasAnyBypassMechanism) {
      status = "fail";
      messages.push(
        `Kein verlässlicher Mechanismus zum Umgehen wiederholter Blöcke gefunden: weder funktionierender Sprunglink noch sichtbarer <code>main</code>/<code>role="main"</code>.`
      );
    }

    // Wahrscheinliche Prüfpunkte / manuelle Prüfung
    if (status !== "fail") {
      if (!hasWorkingSkipLink) {
        status = "check";
        notes.push(
          `Kein funktionierender Sprunglink zum Hauptinhalt erkannt. Mit Landmarken kann diese Anforderung zwar erfüllt sein, ein sichtbarer/fokussierbarer Skiplink sollte aber manuell geprüft werden.`
        );
      }

      if (navCount === 0) {
        status = "check";
        notes.push(
          `Keine sichtbare Navigation-Landmarke gefunden. Das ist nicht automatisch ein Fehler, wenn die Seite keine wiederkehrende Navigation hat oder ein anderer Bypass-Mechanismus vorhanden ist.`
        );
      }

      if (navCount > 1 && byType.nav.namedCount < navCount) {
        status = "check";
        notes.push(
          `Mehrere sichtbare Navigationsbereiche gefunden, aber nicht alle sind eindeutig benannt. Mehrere <code>nav</code> bzw. <code>role="navigation"</code>-Bereiche sollten unterscheidbare Namen haben.`
        );
      }

      if (byType.aside.visibleCount > 1 && byType.aside.namedCount < byType.aside.visibleCount) {
        status = "check";
        notes.push(
          `Mehrere sichtbare ergänzende Bereiche gefunden, aber nicht alle sind eindeutig benannt.`
        );
      }

      if (byType.header.visibleCount === 0) {
        notes.push(`Kein seitenweiter <code>header</code>/<code>role="banner"</code> gefunden. Nicht automatisch ein Fehler.`);
        if (status === "pass") status = "check";
      }

      if (byType.footer.visibleCount === 0) {
        notes.push(`Kein seitenweiter <code>footer</code>/<code>role="contentinfo"</code> gefunden. Nicht automatisch ein Fehler.`);
        if (status === "pass") status = "check";
      }
    }

    // Frames / iframes: eher eigener Teilaspekt
    if (framesWithoutTitle.length > 0) {
      if (status === "pass") status = "check";
      notes.push(
        `${framesWithoutTitle.length} sichtbare(s) <code>iframe</code>/<code>frame</code>-Element(e) ohne <code>title</code>-Attribut gefunden.`
      );
    }

    if (skipLinks.length > 0 && workingSkipLinks.length === 0) {
      status = "fail";
      messages.push(
        `Sprunglink-Kandidat(en) gefunden, aber kein Ziel ist vorhanden und sichtbar.`
      );
    }

    const summaryList = details
      .map((item) => {
        const label = `<code>${__bar_escapeHtml(item.type)}</code>`;
        let base = `${label}: gefunden <strong>${item.count}</strong>, sichtbar <strong>${item.visibleCount}</strong>`;

        if (item.namedCount !== null && item.visibleCount > 1) {
          base += `, benannt <strong>${item.namedCount}</strong>`;
        }

        return base;
      })
      .join("<br>");

    const skipLinkSummary =
      `Sprunglink-Kandidaten: <strong>${skipLinks.length}</strong>, funktionierend: <strong>${workingSkipLinks.length}</strong>`;

    const frameSummary =
      `Sichtbare Frames/iFrames ohne Titel: <strong>${framesWithoutTitle.length}</strong>`;

    const allMessages = [...messages, ...notes];

    let msgOutHead = "Keine Probleme";
    if (status === "check") msgOutHead = "Manuell prüfen / Anmerkungen";
    if (status === "fail") msgOutHead = "Probleme";

    const msgOutput = allMessages.length
      ? `<h4>${msgOutHead}</h4><ul>${allMessages.map((msg) => `<li>${msg}</li>`).join("")}</ul>`
      : `<p>Es wurde ein plausibler Mechanismus zum Umgehen wiederholter Blöcke gefunden.</p>`;

    return {
      id: "R1241",
      reqLink: ['https://bitvtest.de/pruefschritt/bitv-20-web/bitv-20-web-9-2-4-1-bereiche-ueberspringbar', 'Prüfschritt aufrufen'],
      reqInfo: ['Prüfschritt 9.2.4.1', 'Bereiche überspringbar'],
      title: "Landmarken / Blöcke umgehen",
      status,
      content: `
        <p>${summaryList}<br>${skipLinkSummary}<br>${frameSummary}</p>
        ${msgOutput}
      `
    };
  },

  pruefeSichtbareTabellen() {
    function localTableElements(table, selector) {
      return Array.from(table.querySelectorAll(selector)).filter((el) => el.closest("table") === table);
    }

    function getAlpha(color) {
      if (!color) return 0;

      const value = String(color).trim().toLowerCase();

      if (value === "transparent") return 0;

      let match = value.match(/^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*([0-9.]+)\s*\)$/);
      if (match) return parseFloat(match[1]);

      if (/^rgb\(/.test(value)) return 1;

      match = value.match(/^hsla\(\s*[-0-9.]+\s*,\s*[-0-9.]+%\s*,\s*[-0-9.]+%\s*,\s*([0-9.]+)\s*\)$/);
      if (match) return parseFloat(match[1]);

      if (/^hsl\(/.test(value)) return 1;

      if (/^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value)) {
        if (value.length === 5) return parseInt(value[4] + value[4], 16) / 255;
        if (value.length === 9) return parseInt(value.slice(7, 9), 16) / 255;
        return 1;
      }

      return 1;
    }

    function hasVisibleBackground(el) {
      try {
        return getAlpha(getComputedStyle(el).backgroundColor) > 0;
      } catch {
        return false;
      }
    }

    function hasVisibleBorder(el) {
      try {
        const cs = getComputedStyle(el);
        const sides = ["Top", "Right", "Bottom", "Left"];

        return sides.some((side) => {
          const style = cs["border" + side + "Style"];
          const width = parseFloat(cs["border" + side + "Width"]) || 0;
          const color = cs["border" + side + "Color"];

          return style !== "none" && style !== "hidden" && width > 0 && getAlpha(color) > 0;
        });
      } catch {
        return false;
      }
    }

    function hasVisibleTableStyling(table) {
      const relevantElements = [
        table,
        ...localTableElements(table, "caption,thead,tbody,tfoot,tr,th,td")
      ];

      return relevantElements.some((el) => hasVisibleBackground(el) || hasVisibleBorder(el));
    }

    function nearestContext(el) {
      return el.closest("table,section,article,main,aside,div") || el.parentElement || el;
    }

    const issues = [];
    const tables = Array.from(__bar_all("table"));
    const visibleTables = tables.filter(hasVisibleTableStyling);

    visibleTables.forEach((table) => {
      const errors = [];

      const trs = localTableElements(table, "tr");
      const ths = localTableElements(table, "th");
      const tds = localTableElements(table, "td");

      if (!trs.length) errors.push("Keine <tr> vorhanden");
      if (!ths.length) errors.push("Keine <th> vorhanden");
      if (!tds.length) errors.push("Keine <td> vorhanden");

      Array.from(table.children).forEach((child) => {
        if (!/^(caption|colgroup|thead|tbody|tfoot|tr|script|template|style)$/i.test(child.tagName)) {
          errors.push(`<table> enthält ungültiges direktes Kindelement: <${child.tagName.toLowerCase()}>`);
        }
      });

      localTableElements(table, "tr").forEach((tr) => {
        const parent = tr.parentElement;
        const validParent = parent && /^(table|thead|tbody|tfoot)$/i.test(parent.tagName);

        if (!validParent) {
          errors.push("<tr> ist falsch verschachtelt (direktes Elternelement muss <table>, <thead>, <tbody> oder <tfoot> sein)");
        }

        const invalidChildren = Array.from(tr.children).filter((child) => {
          return !/^(td|th|script|template|style)$/i.test(child.tagName);
        });

        if (invalidChildren.length) {
          errors.push(
            `<tr> enthält ungültige direkte Kindelemente: ${invalidChildren
              .map((el) => `<${el.tagName.toLowerCase()}>`)
              .join(", ")}`
          );
        }

        const directCells = Array.from(tr.children).filter((child) => /^(td|th)$/i.test(child.tagName));

        if (!directCells.length) {
          errors.push("<tr> enthält keine direkten <td> oder <th> Elemente");
        }
      });

      localTableElements(table, "th,td").forEach((cell) => {
        const parent = cell.parentElement;

        if (!parent || parent.tagName.toLowerCase() !== "tr") {
          errors.push(`<${cell.tagName.toLowerCase()}> ist kein direktes Kind eines <tr>`);
        }

        const tr = cell.closest("tr");
        if (!tr || tr.closest("table") !== table) {
          errors.push(`<${cell.tagName.toLowerCase()}> ist falsch verschachtelt (nicht innerhalb eines <tr> dieser Tabelle)`);
        }
      });

      const uniqueErrors = [...new Set(errors)];

      if (uniqueErrors.length) {
        issues.push({
          el: table,
          label: getSelector(table),
          path: getDomPath(table),
          errors: uniqueErrors
        });
      }
    });

    const orphanIssuesRaw = [];

    Array.from(__bar_all("tr,th,td")).forEach((el) => {
      const tag = el.tagName.toLowerCase();
      const table = el.closest("table");

      if (!table) {
        let msg = "";

        if (tag === "tr") msg = "<tr> ist kein Kind eines <table>-Kontexts";
        if (tag === "th") msg = "<th> ist nicht innerhalb einer Tabelle verschachtelt";
        if (tag === "td") msg = "<td> ist nicht innerhalb einer Tabelle verschachtelt";

        orphanIssuesRaw.push({
          el: el,
          context: nearestContext(el),
          label: getSelector(el),
          path: getDomPath(el),
          message: msg
        });

        return;
      }

      if (tag === "tr") {
        const parent = el.parentElement;
        if (!parent || !/^(table|thead|tbody|tfoot)$/i.test(parent.tagName)) {
          orphanIssuesRaw.push({
            el: el,
            context: table,
            label: getSelector(el),
            path: getDomPath(el),
            message: "<tr> ist nicht direkt in <table>, <thead>, <tbody> oder <tfoot> verschachtelt"
          });
        }
      }

      if (tag === "th" || tag === "td") {
        const parent = el.parentElement;
        if (!parent || parent.tagName.toLowerCase() !== "tr") {
          orphanIssuesRaw.push({
            el: el,
            context: table,
            label: getSelector(el),
            path: getDomPath(el),
            message: `<${tag}> ist kein direktes Kind eines <tr>`
          });
        }
      }
    });

    const orphanMap = new Map();

    orphanIssuesRaw.forEach((item) => {
      const key = getDomPath(item.context);

      if (!orphanMap.has(key)) {
        orphanMap.set(key, {
          el: item.context,
          label: getSelector(item.context),
          path: getDomPath(item.context),
          errors: []
        });
      }

      orphanMap.get(key).errors.push(`${item.label}: ${item.message}`);
    });

    for (const entry of orphanMap.values()) {
      entry.errors = [...new Set(entry.errors)];
      issues.push(entry);
    }

    if (!issues.length) {
      return {
        id: 'R1035',
        reqLink: ['https://bitvtest.de/pruefschritt/bitv-20-web/bitv-20-web-9-1-3-1e-datentabellen-richtig-aufgebaut', 'Prüfschritt aufrufen'],
        reqInfo: ['Prüfschritt 9.1.3.1e', 'Datentabellen richtig aufgebaut'],
        title: "Struktur sichtbarer Tabellen prüfen",
        status: "pass",
        content: visibleTables.length
          ? `<p>Alle ${visibleTables.length} visuell gestalteten Tabellen sind korrekt aufgebaut und verschachtelt.</p>`
          : "<p>Keine visuell gestalteten Tabellen gefunden.</p>"
      };
    }

    const html = `
      <p>Geprüfte visuell gestaltete Tabellen: <strong>${visibleTables.length}</strong><br>
      Gefundene Probleme: <strong>${issues.length}</strong></p><ol>
        ${issues
          .map(
            (item, index) => `
              <li>
                <strong>${__bar_escapeHtml(item.label)}</strong><br>
                ${item.errors
                .map(
                  (err) => `${__bar_escapeHtml(err)}`
                )
                .join("<br>")}<br>
                Element: <code>${__bar_escapeHtml(getElTag(item.el))}</code>
                Position: <code>${__bar_escapeHtml(item.path)}</code>
                <details class="clone">
                  <summary><p class="toggleText">Element anzeigen</code></p></summary>
                  <div class="inline-content details-content">
                    <div class="clonedElement">${cloneEl(item.el)}</div>
                  </div>
                </details>
              </li>
            `
          )
        .join("")}</ol>
    `;

    return {
      id: 'R1035',
      reqLink: ['https://bitvtest.de/pruefschritt/bitv-20-web/bitv-20-web-9-1-3-1e-datentabellen-richtig-aufgebaut', 'Prüfschritt aufrufen'],
      reqInfo: ['Prüfschritt 9.1.3.1e', 'Datentabellen richtig aufgebaut'],
      title: "Struktur sichtbarer Tabellen prüfen",
      status: "fail",
      content: html
    };
  },

  pruefeTransparenteTabellen() {
    function localTableElements(table, selector) {
      return Array.from(table.querySelectorAll(selector)).filter((el) => el.closest("table") === table);
    }

    function getAlpha(color) {
      if (!color) return 0;

      const value = String(color).trim().toLowerCase();

      if (value === "transparent") return 0;

      let match = value.match(/^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*([0-9.]+)\s*\)$/);
      if (match) return parseFloat(match[1]);

      if (/^rgb\(/.test(value)) return 1;

      match = value.match(/^hsla\(\s*[-0-9.]+\s*,\s*[-0-9.]+%\s*,\s*[-0-9.]+%\s*,\s*([0-9.]+)\s*\)$/);
      if (match) return parseFloat(match[1]);

      if (/^hsl\(/.test(value)) return 1;

      if (/^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value)) {
        if (value.length === 5) return parseInt(value[4] + value[4], 16) / 255;
        if (value.length === 9) return parseInt(value.slice(7, 9), 16) / 255;
        return 1;
      }

      return 1;
    }

    function hasVisibleBackground(el) {
      try {
        return getAlpha(getComputedStyle(el).backgroundColor) > 0;
      } catch {
        return false;
      }
    }

    function hasVisibleBorder(el) {
      try {
        const cs = getComputedStyle(el);
        const sides = ["Top", "Right", "Bottom", "Left"];

        return sides.some((side) => {
          const style = cs["border" + side + "Style"];
          const width = parseFloat(cs["border" + side + "Width"]) || 0;
          const color = cs["border" + side + "Color"];

          return style !== "none" && style !== "hidden" && width > 0 && getAlpha(color) > 0;
        });
      } catch {
        return false;
      }
    }

    function hasVisibleTableStyling(table) {
      const relevantElements = [
        table,
        ...localTableElements(table, "caption,thead,tbody,tfoot,tr,th,td")
      ];

      return relevantElements.some((el) => hasVisibleBackground(el) || hasVisibleBorder(el));
    }

    const tables = Array.from(__bar_all("table"));
    const transparentTables = tables.filter((table) => !hasVisibleTableStyling(table));
    const issues = [];

    transparentTables.forEach((table) => {
      const errors = [];

      if (localTableElements(table, "th").length) {
        errors.push('Transparente Tabelle darf kein <th> besitzen');
      }

      if (localTableElements(table, "caption").length) {
        errors.push('Transparente Tabelle darf kein <caption> besitzen');
      }

      if (table.hasAttribute("summary")) {
        errors.push('Transparente Tabelle darf kein Attribut "summary" besitzen');
      }

      const headersElements = localTableElements(table, "[headers]");
      if (headersElements.length) {
        errors.push(
          `Transparente Tabelle darf kein Attribut "headers" besitzen (${headersElements
            .map((el) => getSelector(el))
            .join(", ")})`
        );
      }

      const idElements = [table, ...localTableElements(table, "[id]")].filter(
        (el, index, arr) => arr.indexOf(el) === index && el.hasAttribute("id")
      );

      if (idElements.length) {
        errors.push(
          `Transparente Tabelle darf kein Attribut "id" besitzen (${idElements
            .map((el) => getSelector(el))
            .join(", ")})`
        );
      }

      if (errors.length) {
        issues.push({
          el: table,
          label: getSelector(table),
          path: getDomPath(table),
          errors: [...new Set(errors)]
        });
      }
    });

    if (!issues.length) {
      return {
        id: 'R1037',
        reqLink: ['https://bitvtest.de/pruefschritt/bitv-20-web/bitv-20-web-9-1-3-1g-kein-strukturmarkup-fuer-layouttabellen', 'Prüfschritt aufrufen'],
        reqInfo: ['Prüfschritt 9.1.3.1g', 'Kein Strukturmarkup für Layouttabellen'],
        title: "Visuell transparente Tabellen prüfen",
        status: "pass",
        content: transparentTables.length
          ? `<p>Keine verbotenen Elemente oder Attribute in ${transparentTables.length} visuell transparenten Tabellen gefunden.</p>`
          : "<p>Keine visuell transparenten Tabellen gefunden.</p>"
      };
    }

    const html = `
      <p>Geprüfte visuell transparente Tabellen: <strong>${transparentTables.length}</strong><br>
      Gefundene Probleme: <strong>${issues.length}</strong></p><ol>
        ${issues
          .map(
            (item, index) => `
              <li>
                <strong>${__bar_escapeHtml(item.label)}</strong><br>
                ${item.errors
                .map(
                  (err) => `${__bar_escapeHtml(err)}`
                )
                .join("<br>")}<br>
                Element: <code>${__bar_escapeHtml(getElTag(item.el))}</code><br>
                Position: <code>${__bar_escapeHtml(item.path)}</code>
                <details class="clone">
                  <summary><p class="toggleText">Element anzeigen</code></p></summary>
                  <div class="inline-content details-content">
                    <div class="clonedElement">${cloneEl(item.el)}</div>
                  </div>
                </details>
              </li>
            `
          )
        .join("")}</ol>
    `;

    return {
      id: 'R1037',
      reqLink: ['https://bitvtest.de/pruefschritt/bitv-20-web/bitv-20-web-9-1-3-1g-kein-strukturmarkup-fuer-layouttabellen', 'Prüfschritt aufrufen'],
      reqInfo: ['Prüfschritt 9.1.3.1g', 'Kein Strukturmarkup für Layouttabellen'],
      title: "Visuell transparente Tabellen prüfen",
      status: "fail",
      content: html
    };
  },

  pruefeLangAttribut() {
    const htmlEl = document.documentElement;
    const hasLang = htmlEl && htmlEl.hasAttribute("lang");
    const langValue = hasLang ? String(htmlEl.getAttribute("lang") || "").trim() : "";

    let status = "pass";
    let content = "Das <code>&lt;html&gt;</code>-Element hat ein gesetztes und nicht-leeres <code>lang</code>-Attribut.";

    if (!htmlEl) {
      status = "fail";
      content = "Es konnte kein <code>&lt;html&gt;</code>-Element gefunden werden. Dies gehört zu den Grundbausteinen einer Seite und sollte immer vorhanden sein.";
    } else if (!hasLang) {
      status = "fail";
      content = `Attribut <code>lang</code> fehlt für das <code>&lt;html&gt;</code>-Element. Dies ist wichtig, damit beispielsweise Screenreader wissen, in welcher Sprache die Seite primär ist.`;
    } else if (!langValue) {
      status = "fail";
      content = `Das <code>&lt;html&gt;</code>-Element hat ein leeres <code>lang</code>-Attribut. Ein korrekt ausgefüllter Wert ist wichtig, damit beispielsweise Screenreader wissen, in welcher Sprache die Seite primär ist.`;
    }

    content = `<p>${content}</p>`;

    return {
      id: 'R1311',
      reqLink: ['https://bitvtest.de/pruefschritt/bitv-20-web/bitv-20-web-9-3-1-1-hauptsprache-angegeben', 'Prüfschritt aufrufen'],
      reqInfo: ['Prüfschritt 9.3.1.1', 'Hauptsprache angegeben'],
      title: "lang-Attribut prüfen",
      status,
      content
    };
  },

  pruefeLinksImFliesstext() {
    const textOf = el => (el && el.textContent || "").replace(/\s+/g, " ").trim();

    const isVisible = el => {
      if (!el || !el.isConnected) return false;
      const cs = getComputedStyle(el);
      if (
        cs.display === "none" ||
        cs.visibility === "hidden" ||
        cs.visibility === "collapse" ||
        parseFloat(cs.opacity) === 0
      ) {
        return false;
      }
      const r = el.getBoundingClientRect();
      return !!(r.width || r.height);
    };

    const parseColor = str => {
      if (!str) return null;
      const m = String(str).match(/rgba?\(([^)]+)\)/i);
      if (!m) return null;
      const parts = m[1].split(",").map(x => parseFloat(x.trim()));
      if (parts.length < 3 || parts.some(n => Number.isNaN(n))) return null;
      return {
        r: parts[0],
        g: parts[1],
        b: parts[2],
        a: parts.length > 3 && !Number.isNaN(parts[3]) ? parts[3] : 1
      };
    };

    const colorToStr = c => {
      if (!c) return "unbekannt";
      return `rgba(${Math.round(c.r)}, ${Math.round(c.g)}, ${Math.round(c.b)}, ${typeof c.a === "number" ? +c.a.toFixed(2) : 1})`;
    };

    const srgb = v => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };

    const relLum = c => {
      if (!c) return null;
      return 0.2126 * srgb(c.r) + 0.7152 * srgb(c.g) + 0.0722 * srgb(c.b);
    };

    const contrast = (c1, c2) => {
      const l1 = relLum(c1);
      const l2 = relLum(c2);
      if (l1 == null || l2 == null) return null;
      const hi = Math.max(l1, l2);
      const lo = Math.min(l1, l2);
      return (hi + 0.05) / (lo + 0.05);
    };

    const sameColor = (a, b) => {
      if (!a || !b) return false;
      return (
        Math.round(a.r) === Math.round(b.r) &&
        Math.round(a.g) === Math.round(b.g) &&
        Math.round(a.b) === Math.round(b.b) &&
        Math.abs((a.a ?? 1) - (b.a ?? 1)) < 0.02
      );
    };

    const px = n => Number.parseFloat(String(n || "").replace("px", "")) || 0;

    const normTextDec = cs => {
      const line = (cs.textDecorationLine || "").toLowerCase().trim();
      const style = (cs.textDecorationStyle || "").toLowerCase().trim();
      const thick = (cs.textDecorationThickness || "").toLowerCase().trim();
      return `${line}|${style}|${thick}`;
    };

    const hasVisibleBg = cs => {
      const c = parseColor(cs.backgroundColor);
      return !!(c && c.a > 0 && !(c.r === 0 && c.g === 0 && c.b === 0 && c.a === 0));
    };

    const hasVisibleBorderBottom = cs => {
      return (
        px(cs.borderBottomWidth) > 0 &&
        (cs.borderBottomStyle || "none") !== "none" &&
        !/rgba?\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0\s*\)/i.test(cs.borderBottomColor || "")
      );
    };

    const hasVisibleOutline = cs => {
      return px(cs.outlineWidth) > 0 && (cs.outlineStyle || "none") !== "none";
    };

    const hasVisibleShadow = cs => {
      return (cs.boxShadow || "none") !== "none" || (cs.textShadow || "none") !== "none";
    };

    const fontWeightNum = v => {
      const n = parseInt(v, 10);
      if (!Number.isNaN(n)) return n;
      const s = String(v || "").toLowerCase();
      if (s === "normal") return 400;
      if (s === "bold") return 700;
      return 400;
    };

    const isPotentialTextContainer = el => {
      if (!el || el.nodeType !== 1) return false;
      const tag = (el.tagName || "").toLowerCase();
      return /^(p|li|dd|dt|td|th|blockquote|figcaption|caption|article|section|main|div|span)$/i.test(tag);
    };

    const closestTextContainer = el => {
      let cur = el.parentElement;
      while (cur && cur !== document.body) {
        if (isPotentialTextContainer(cur)) return cur;
        cur = cur.parentElement;
      }
      return el.parentElement || document.body;
    };

    const hasBlockChild = el => {
      return Array.from(el.children || []).some(ch => {
        const d = getComputedStyle(ch).display;
        return ["block", "flex", "grid", "table", "list-item"].includes(d);
      });
    };

    const hasSiblingTextAround = el => {
      const p = el.parentNode;
      if (!p) return false;
      const nodes = Array.from(p.childNodes);
      const idx = nodes.indexOf(el);
      const isTextNodeWithContent = n =>
        n &&
        n.nodeType === 3 &&
        (n.textContent || "").replace(/\s+/g, " ").trim().length > 0;

      for (let i = idx - 1; i >= 0; i--) {
        if (isTextNodeWithContent(nodes[i])) return true;
      }
      for (let i = idx + 1; i < nodes.length; i++) {
        if (isTextNodeWithContent(nodes[i])) return true;
      }
      return false;
    };

    const looksLikeInlineTextLink = a => {
      if (!a || a.tagName.toLowerCase() !== "a") return false;
      if (!isVisible(a)) return false;

      const txt = textOf(a);
      if (!txt || txt.length < 2) return false;

      if (a.closest("nav, header, footer, .breadcrumb, [aria-label*='breadcrumb' i]")) return false;
      if (hasBlockChild(a)) return false;

      const cs = getComputedStyle(a);
      if (["button", "inline-flex", "flex", "grid", "table", "block"].includes(cs.display)) return false;

      if (a.querySelector("img,button,input,select,textarea")) return false;

      const container = closestTextContainer(a);
      const containerText = textOf(container);

      if (containerText.length < txt.length + 10) return false;
      if (!hasSiblingTextAround(a) && !(containerText.replace(txt, "").trim().length > 10)) return false;

      return true;
    };

    const analyzeLink = a => {
      const linkCs = getComputedStyle(a);
      const ctx = closestTextContainer(a);
      const ctxCs = getComputedStyle(ctx);

      const linkColor = parseColor(linkCs.color);
      const ctxColor = parseColor(ctxCs.color);

      const cues = [];

      const linkDec = normTextDec(linkCs);
      const ctxDec = normTextDec(ctxCs);

      const linkHasUnderline = (linkCs.textDecorationLine || "").toLowerCase().includes("underline");
      const ctxHasUnderline = (ctxCs.textDecorationLine || "").toLowerCase().includes("underline");

      if (linkHasUnderline && !ctxHasUnderline) cues.push("Unterstreichung");

      const fwLink = fontWeightNum(linkCs.fontWeight);
      const fwCtx = fontWeightNum(ctxCs.fontWeight);
      if (Math.abs(fwLink - fwCtx) >= 150) cues.push(`andere Schriftstärke (${fwCtx} → ${fwLink})`);

      if ((linkCs.fontStyle || "normal") !== (ctxCs.fontStyle || "normal")) {
        cues.push(`anderer Schriftstil (${ctxCs.fontStyle} → ${linkCs.fontStyle})`);
      }

      if ((linkCs.fontFamily || "").split(",")[0] !== (ctxCs.fontFamily || "").split(",")[0]) {
        cues.push("andere Schriftfamilie");
      }

      if (Math.abs(px(linkCs.fontSize) - px(ctxCs.fontSize)) >= 1) {
        cues.push(`andere Schriftgröße (${ctxCs.fontSize} → ${linkCs.fontSize})`);
      }

      if (hasVisibleBg(linkCs) && !sameColor(parseColor(linkCs.backgroundColor), parseColor(ctxCs.backgroundColor))) {
        cues.push("Hintergrund hervorgehoben");
      }

      if (hasVisibleBorderBottom(linkCs) && !hasVisibleBorderBottom(ctxCs)) {
        cues.push("sichtbare Unterkante/Border");
      }

      if (hasVisibleOutline(linkCs) && !hasVisibleOutline(ctxCs)) {
        cues.push("sichtbarer Outline");
      }

      if (hasVisibleShadow(linkCs) && !hasVisibleShadow(ctxCs)) {
        cues.push("sichtbarer Schatten");
      }

      if (linkDec !== ctxDec && !cues.includes("Unterstreichung")) {
        cues.push("abweichende Textdekoration");
      }

      const colorDiff = !sameColor(linkColor, ctxColor);
      const linkVsTextContrast = contrast(linkColor, ctxColor);

      let status = "pass";
      let reason = "";

      if (!colorDiff && cues.length === 0) {
        status = "fail";
        reason = "Kein klarer stilistischer Unterschied zum umgebenden Text gefunden.";
      } else if (colorDiff && cues.length === 0) {
        status = "fail";
        reason = `Link unterscheidet sich nur über Farbe vom umgebenden Text${linkVsTextContrast != null ? ` (Farbkontrast Link/Text: ${linkVsTextContrast.toFixed(2)}:1)` : ""}.`;
      } else {
        status = "pass";
        reason = `Zusätzliche visuelle Unterscheidung gefunden: ${cues.join(", ")}.`;
      }

      const diff = {
        color: {
          link: linkCs.color || "",
          context: ctxCs.color || ""
        },
        textDecoration: {
          link: linkCs.textDecorationLine || "",
          context: ctxCs.textDecorationLine || ""
        },
        textDecorationStyle: {
          link: linkCs.textDecorationStyle || "",
          context: ctxCs.textDecorationStyle || ""
        },
        textDecorationThickness: {
          link: linkCs.textDecorationThickness || "",
          context: ctxCs.textDecorationThickness || ""
        },
        fontWeight: {
          link: linkCs.fontWeight || "",
          context: ctxCs.fontWeight || ""
        },
        fontStyle: {
          link: linkCs.fontStyle || "",
          context: ctxCs.fontStyle || ""
        },
        fontSize: {
          link: linkCs.fontSize || "",
          context: ctxCs.fontSize || ""
        },
        fontFamily: {
          link: linkCs.fontFamily || "",
          context: ctxCs.fontFamily || ""
        },
        backgroundColor:
          hasVisibleBg(linkCs) || hasVisibleBg(ctxCs)
            ? {
                link: linkCs.backgroundColor || "",
                context: ctxCs.backgroundColor || ""
              }
            : null,
        borderBottom:
          hasVisibleBorderBottom(linkCs) || hasVisibleBorderBottom(ctxCs)
            ? {
                link: `${linkCs.borderBottomWidth} ${linkCs.borderBottomStyle} ${linkCs.borderBottomColor}`,
                context: `${ctxCs.borderBottomWidth} ${ctxCs.borderBottomStyle} ${ctxCs.borderBottomColor}`
              }
            : null,
        outline:
          hasVisibleOutline(linkCs) || hasVisibleOutline(ctxCs)
            ? {
                link: `${linkCs.outlineWidth} ${linkCs.outlineStyle} ${linkCs.outlineColor}`,
                context: `${ctxCs.outlineWidth} ${ctxCs.outlineStyle} ${ctxCs.outlineColor}`
              }
            : null,
        textShadow:
          (linkCs.textShadow || "none") !== "none" || (ctxCs.textShadow || "none") !== "none"
            ? {
                link: linkCs.textShadow || "",
                context: ctxCs.textShadow || ""
              }
            : null,
        boxShadow:
          (linkCs.boxShadow || "none") !== "none" || (ctxCs.boxShadow || "none") !== "none"
            ? {
                link: linkCs.boxShadow || "",
                context: ctxCs.boxShadow || ""
              }
            : null
      };

      return {
        el: a,
        text: textOf(a) || "(ohne Text)",
        path: getDomPath(a),
        status,
        reason,
        colorDiff,
        linkColor: colorToStr(linkColor),
        ctxColor: colorToStr(ctxColor),
        contrast: linkVsTextContrast,
        diff
      };
    };

    const renderDiffs = x => {
      const labels = {
        color: "Farbe",
        textDecoration: "Text Decoration",
        textDecorationStyle: "Text Decoration Style",
        textDecorationThickness: "Text Decoration Thickness",
        fontWeight: "Font Weight",
        fontStyle: "Font Style",
        fontSize: "Font Size",
        fontFamily: "Font Family",
        backgroundColor: "Hintergrund",
        borderBottom: "Border Bottom",
        outline: "Outline",
        textShadow: "Text Shadow",
        boxShadow: "Box Shadow"
      };

      let rows = Object.entries(x.diff)
      .filter(([, v]) => v && String(v.link) !== String(v.context))
      .map(([key, v]) => `
          <strong>${__bar_escapeHtml(labels[key] || key)}:</strong>
          Text = <code>${__bar_escapeHtml(v.context || "(leer)")}</code>
          → Link = <code>${__bar_escapeHtml(v.link || "(leer)")}</code>
      `)
      .join("<br>");

      let returnRows = false;
      if (rows) returnRows = true;
      rows = `<p>${rows}</p>`;
      return (returnRows ? rows : '');
    };

    const renderItem = (x, i) => {
      return `
        <li>
          <strong>${__bar_escapeHtml(x.text)}</strong><br>
          ${__bar_escapeHtml(x.reason)}<br>
          Link-Farbe: <code>${__bar_escapeHtml(x.linkColor)}</code> →
          Umgebender Text: <code>${__bar_escapeHtml(x.ctxColor)}</code>
          ${x.contrast != null ? ` → Kontrast Link/Text: <strong>${__bar_escapeHtml(x.contrast.toFixed(2))}:1</strong>` : ""}<br>
          Element: <code>${__bar_escapeHtml(getElTag(x.el))}</code><br>
          Position: <code>${__bar_escapeHtml(x.path)}</code>
          ${renderDiffs(x)}
          <details class="clone">
            <summary><p class="toggleText">Element anzeigen</code></p></summary>
            <div class="inline-content details-content">
              <div class="clonedElement">${cloneEl(x.el)}</div>
            </div>
          </details>
        </li>
      `;
    };

    const allLinks = Array.from(__bar_all("a[href]"));
    const inlineLinks = allLinks.filter(looksLikeInlineTextLink);
    const results = inlineLinks.map(analyzeLink);

    const fails = results.filter(x => x.status === "fail");

    let overallStatus = "pass";
    if (fails.length) overallStatus = "fail";

    const summaryHtml = `
      <p>Geprüft wurden als Inline-Link erkannte <strong>&lt;a href&gt;</strong>-Elemente im Fließtext.</p>
      <p>Alle gefundenen Links gesamt: <strong>${allLinks.length}</strong><br>
      Textlinks im Fließtext: <strong>${inlineLinks.length}</strong><br>
      Problematische Links: <strong>${fails.length}</strong></p>
    `;

    const failHtml = fails.length
      ? `<ol>
          ${fails.map(renderItem).join("")}
        </ol>`
      : "";

    const emptyHtml = !fails.length
      ? `<p>Es wurden keine problematischen Inline-Links im Fließtext gefunden.</p>`
      : "";

    return {
      id: 'R1141',
      reqLink: ['https://bitvtest.de/pruefschritt/bitv-20-web/bitv-20-web-9-1-4-1-ohne-farben-nutzbar', 'Prüfschritt aufrufen'],
      reqInfo: ['Prüfschritt 9.1.4.1', 'Ohne Farben nutzbar'],
      title: "Links sollen sich durch mehr als nur die Textfarbe von anderem Text abheben",
      status: overallStatus,
      content: `
        ${summaryHtml}
        ${emptyHtml}
        ${failHtml}
      `
    };
  },

  pruefeListenStruktur() {
    const strukturFehler = [];
    const fakeLists = [];
    const geseheneFakeLists = new Set();

    const bulletTextRe = /^\s*(?:[•◦▪‣⁃∙·●○■–—-]|\d+[.)]|[a-zA-Z][.)])\s+\S/;
    const bulletBeforeRe = /^(?:["'])?\s*(?:[•◦▪‣⁃∙·●○■–—-]|\d+[.)]|[a-zA-Z][.)])\s*(?:["'])?$/;

    function normalizeText(text) {
      return String(text || "").replace(/\s+/g, " ").trim();
    }

    function isHidden(el) {
      const style = window.getComputedStyle(el);
      return style.display === "none" || style.visibility === "hidden";
    }

    function getBeforeContent(el) {
      try {
        const content = window.getComputedStyle(el, "::before").content;
        if (!content || content === "none" || content === "normal") {
          return "";
        }
        return String(content).trim();
      } catch (e) {
        return "";
      }
    }

    function looksLikeFakeListItem(p) {
      const text = normalizeText(p.textContent);
      if (bulletTextRe.test(text)) {
        return true;
      }

      const beforeContent = getBeforeContent(p);
      if (beforeContent && bulletBeforeRe.test(beforeContent)) {
        return true;
      }

      return false;
    }

    function pushStrukturFehler(el, message) {
      strukturFehler.push({
        el: el,
        path: getDomPath(el),
        message
      });
    }

    function pushFakeList(container, items) {
      const examples = items
        .slice(0, 4)
        .map((el) => normalizeText(el.textContent))
        .filter(Boolean);

      const viaCssBefore = items.some((el) => bulletBeforeRe.test(getBeforeContent(el)));
      const key = `${getDomPath(container)}__${items.length}__${examples.join("||")}__${viaCssBefore}`;

      if (geseheneFakeLists.has(key)) {
        return;
      }

      geseheneFakeLists.add(key);

      fakeLists.push({
        /*el: container.firstElementChild,*/
        el: items[0],
        path: getDomPath(container),
        count: items.length,
        examples,
        viaCssBefore
      });
    }

    // Strukturprüfung für <ul> und <ol>
    __bar_all("ul, ol").forEach((list) => {
      const allowedChildTags = new Set(["LI", "SCRIPT", "TEMPLATE", "STYLE"]);
      const children = Array.from(list.children);

      const invalidChildren = children.filter((child) => !allowedChildTags.has(child.tagName));
      if (invalidChildren.length > 0) {
        pushStrukturFehler(
          list,
          `<${list.tagName.toLowerCase()}> enthält ungültige direkte Kindelemente: ${invalidChildren
            .map((el) => `<${el.tagName.toLowerCase()}>`)
            .join(", ")}`
        );
      }

      const directLiChildren = children.filter((child) => child.tagName === "LI");
      if (directLiChildren.length === 0) {
        pushStrukturFehler(
          list,
          `<${list.tagName.toLowerCase()}> enthält keine direkten <li>-Elemente`
        );
      }
    });

    // Strukturprüfung für <li>
    __bar_all("li").forEach((li) => {
      const parent = li.parentElement;
      if (!parent || !/^(UL|OL)$/.test(parent.tagName)) {
        pushStrukturFehler(
          li,
          `<li> ist falsch verschachtelt (erwartet direkt innerhalb von <ul> oder <ol>)`
        );
      }
    });

    // Erkennung möglicher Fake-Lists aus <p>-Elementen
    __bar_all("p").forEach((p) => {
      if (isHidden(p)) {
        return;
      }

      if (p.closest("li")) {
        return;
      }

      if (!looksLikeFakeListItem(p)) {
        return;
      }

      const parent = p.parentElement;
      if (!parent) {
        return;
      }

      const pSiblings = Array.from(parent.children).filter((el) => {
        return el.tagName === "P" && !isHidden(el) && !el.closest("li");
      });

      const currentIndex = pSiblings.indexOf(p);
      if (currentIndex === -1) {
        return;
      }

      let start = currentIndex;
      while (start > 0 && looksLikeFakeListItem(pSiblings[start - 1])) {
        start--;
      }

      // Nur einmal pro zusammenhängender Gruppe prüfen
      if (start !== currentIndex) {
        return;
      }

      let end = currentIndex;
      while (end + 1 < pSiblings.length && looksLikeFakeListItem(pSiblings[end + 1])) {
        end++;
      }

      const group = pSiblings.slice(start, end + 1);

      // Erst ab mindestens 2 aufeinanderfolgenden Absätzen als mögliche Fake-Liste werten
      if (group.length >= 2) {
        pushFakeList(parent, group);
      }
    });

    // 4) Status bestimmen
    let status = "pass";
    if (strukturFehler.length > 0) {
      status = "fail";
    } else if (fakeLists.length > 0) {
      status = "check";
    }

    // 5) Inhalt erzeugen
    let content = `
      <p>Geprüft wurden alle <code>&lt;ul&gt;</code>, <code>&lt;ol&gt;</code> und <code>&lt;li&gt;</code> auf grundlegende korrekte Verwendung und Verschachtelung. Zusätzlich wurden mögliche "Fake-Listen" gesucht, bei denen Aufzählungen mit <code>&lt;p&gt;</code>-Elementen statt echter Listen ausgezeichnet sind.</p>
      <p>
        Strukturfehler: <strong>${strukturFehler.length}</strong><br>
        Mögliche Fake-Listen: <strong>${fakeLists.length}</strong>
      </p>
    `;

    if (strukturFehler.length > 0) {
      content += `<h4>Strukturfehler</h4><ol>`;
      strukturFehler.forEach((entry) => {
        content += `
          <li>
            <strong>${__bar_escapeHtml(entry.message)}</strong><br>
            Element: <code>${__bar_escapeHtml(getElTag(entry.el))}</code><br>
            Position: <code>${__bar_escapeHtml(entry.path)}</code>
            <details class="clone">
              <summary><p class="toggleText">Element anzeigen</code></p></summary>
              <div class="inline-content details-content">
                <div class="clonedElement">${cloneEl(entry.el)}</div>
              </div>
            </details>
          </li>
        `;
      });
      content += `</ol>`;
    } else {
      content += `<p>Keine Strukturfehler bei <code>&lt;ul&gt;</code>, <code>&lt;ol&gt;</code> oder <code>&lt;li&gt;</code> gefunden.</p>`;
    }

    if (fakeLists.length > 0) {
      content += `<h4>Mögliche Fake-Listen</h4><ol>`;
      fakeLists.forEach((entry) => {
        const examplesHtml = entry.examples.length
          ? `Listeneinträge: ${entry.examples.map((ex) => `"${__bar_escapeHtml(ex)}"`).join(", ")}`
          : "(keine Listeneinträge gefunden)";

        const cssInfo = entry.viaCssBefore
          ? ` (Aufzählungszeichen offenbar über <code>::before</code>)`
          : "";

        content += `
          <li>
            <strong>${examplesHtml}</strong><br>
            ${entry.count} aufeinanderfolgende <code>&lt;p&gt;</code>-Elemente wirken wie eine Liste${cssInfo}<br>
            Position: <code>${__bar_escapeHtml(entry.path)}</code>
            <details class="clone">
              <summary><p class="toggleText">Element anzeigen</code></p></summary>
              <div class="inline-content details-content">
                <div class="clonedElement">${cloneEl(entry.el)}</div>
              </div>
            </details>
          </li>
        `;
      });
      content += `</ol>`;
    } else {
      content += `<p>Es wurden keine offensichtlichen Fake-Listen aus <code>&lt;p&gt;</code>-Elementen gefunden.</p>`;
    }

    return {
      id: 'R1032',
      reqLink: ['https://bitvtest.de/pruefschritt/bitv-20-web/bitv-20-web-9-1-3-1b-html-strukturelemente-fuer-listen', 'Prüfschritt aufrufen'],
      reqInfo: ['Prüfschritt 9.1.3.1b', 'HTML-Strukturelemente für Listen'],
      title: "Listenstruktur prüfen",
      status: status,
      content
    };
  },

  pruefeAutocompleteAttribute() {
    const selector = "input, textarea, select";
    const allElements = Array.from(__bar_all(selector));

    const ignoredInputTypes = new Set([
      "hidden",
      "submit",
      "reset",
      "button",
      "image",
      "file",
      "range",
      "color",
      "checkbox",
      "radio",
      "search"
    ]);

    const candidateInputTypes = new Set([
      "text",
      "email",
      "tel",
      "url",
      "password",
      "number",
      "date",
      "month",
      "week",
      "time",
      "datetime-local"
    ]);

    const validAutocompleteTokens = new Set([
      "name",
      "honorific-prefix",
      "given-name",
      "additional-name",
      "family-name",
      "honorific-suffix",
      "nickname",
      "username",
      "new-password",
      "current-password",
      "one-time-code",
      "organization-title",
      "organization",
      "street-address",
      "address-line1",
      "address-line2",
      "address-line3",
      "address-level4",
      "address-level3",
      "address-level2",
      "address-level1",
      "country",
      "country-name",
      "postal-code",
      "cc-name",
      "cc-given-name",
      "cc-additional-name",
      "cc-family-name",
      "cc-number",
      "cc-exp",
      "cc-exp-month",
      "cc-exp-year",
      "cc-csc",
      "cc-type",
      "transaction-currency",
      "transaction-amount",
      "language",
      "bday",
      "bday-day",
      "bday-month",
      "bday-year",
      "sex",
      "url",
      "photo",
      "tel",
      "tel-country-code",
      "tel-national",
      "tel-area-code",
      "tel-local",
      "tel-local-prefix",
      "tel-local-suffix",
      "tel-extension",
      "email",
      "impp"
    ]);

    const purposeRules = [
      {
        key: "email",
        expected: "email",
        typeHint: ["email"],
        patterns: [
          /\be-?mail\b/i,
          /\bemail\b/i,
          /\bmail\b/i
        ]
      },
      {
        key: "tel",
        expected: "tel",
        typeHint: ["tel"],
        patterns: [
          /\btelefon\b/i,
          /\bphone\b/i,
          /\btel\b/i,
          /\bmobile\b/i,
          /\bmobil\b/i,
          /\bhandy\b/i
        ]
      },
      {
        key: "given-name",
        expected: "given-name",
        patterns: [
          /\bvorname\b/i,
          /\bfirst.?name\b/i,
          /\bgiven.?name\b/i
        ]
      },
      {
        key: "family-name",
        expected: "family-name",
        patterns: [
          /\bnachname\b/i,
          /\blast.?name\b/i,
          /\bsurname\b/i,
          /\bfamily.?name\b/i
        ]
      },
      {
        key: "name",
        expected: "name",
        patterns: [
          /\bvoller?\s+name\b/i,
          /\bfull.?name\b/i,
          /\bname\b/i
        ]
      },
      {
        key: "username",
        expected: "username",
        patterns: [
          /\bbenutzername\b/i,
          /\busername\b/i,
          /\blogin\b/i,
          /\buser.?id\b/i
        ]
      },
      {
        key: "current-password",
        expected: "current-password",
        typeHint: ["password"],
        patterns: [
          /\bpasswort\b/i,
          /\bpassword\b/i
        ]
      },
      {
        key: "organization",
        expected: "organization",
        patterns: [
          /\bfirma\b/i,
          /\bunternehmen\b/i,
          /\bcompany\b/i,
          /\borganization\b/i,
          /\borganis(?:ation|ation)\b/i
        ]
      },
      {
        key: "street-address",
        expected: "street-address",
        patterns: [
          /\bstra(?:ß|ss)e\b/i,
          /\bstreet\b/i,
          /\baddress\b/i,
          /\badresse\b/i
        ]
      },
      {
        key: "address-level2",
        expected: "address-level2",
        patterns: [
          /\bort\b/i,
          /\bstadt\b/i,
          /\bcity\b/i,
          /\btown\b/i
        ]
      },
      {
        key: "postal-code",
        expected: "postal-code",
        patterns: [
          /\bplz\b/i,
          /\bzip\b/i,
          /\bpostal\b/i,
          /\bpostleitzahl\b/i
        ]
      },
      {
        key: "country-name",
        expected: "country-name",
        patterns: [
          /\bland\b/i,
          /\bcountry\b/i
        ]
      },
      {
        key: "cc-name",
        expected: "cc-name",
        patterns: [
          /\bkarteninhaber\b/i,
          /\bcardholder\b/i,
          /\bname on card\b/i
        ]
      },
      {
        key: "cc-number",
        expected: "cc-number",
        patterns: [
          /\bkreditkarte\b/i,
          /\bcard.?number\b/i,
          /\bkartennummer\b/i,
          /\bcc-?number\b/i
        ]
      },
      {
        key: "cc-exp",
        expected: "cc-exp",
        patterns: [
          /\bablaufdatum\b/i,
          /\bexpiry\b/i,
          /\bexpiration\b/i,
          /\bgültig bis\b/i
        ]
      },
      {
        key: "cc-csc",
        expected: "cc-csc",
        patterns: [
          /\bcvv\b/i,
          /\bcvc\b/i,
          /\bcsc\b/i,
          /\bsicherheitscode\b/i
        ]
      },
      {
        key: "bday",
        expected: "bday",
        patterns: [
          /\bgeburtsdatum\b/i,
          /\bdate of birth\b/i,
          /\bbirthday\b/i
        ]
      }
    ];

    const exclusionPatterns = [
      /\bi am human\b/i,
      /\bnot a robot\b/i,
      /\bcaptcha\b/i,
      /\bsecurity check\b/i,
      /\bsicherheitsabfrage\b/i,
      /\bsearch\b/i,
      /\bsuche\b/i,
      /\bfilter\b/i,
      /\bkommentar\b/i,
      /\bcomment\b/i,
      /\bnachricht\b/i,
      /\bmessage\b/i,
      /\bfeedback\b/i,
      /\bquantity\b/i,
      /\bmenge\b/i,
      /\bcoupon\b/i,
      /\bgutschein\b/i,
      /\bpromo\b/i,
      /\bvoucher\b/i,
      /\bkundennummer\b/i,
      (/\bcustomer.?number\b/i),
      (/\bclient.?id\b/i),
      (/\baccount.?number\b/i),
      (/\bvertragsnummer\b/i)
    ];

    function getFieldText(el) {
      const parts = [];

      const id = el.getAttribute("id");
      if (id) {
        try {
          const label = document.querySelector(`label[for="${CSS.escape(id)}"]`);
          if (label && label.textContent) parts.push(label.textContent);
        } catch (e) {}
      }

      const wrappingLabel = el.closest("label");
      if (wrappingLabel && wrappingLabel.textContent) {
        parts.push(wrappingLabel.textContent);
      }

      const ariaLabel = el.getAttribute("aria-label");
      if (ariaLabel) parts.push(ariaLabel);

      const ariaLabelledBy = el.getAttribute("aria-labelledby");
      if (ariaLabelledBy) {
        ariaLabelledBy.split(/\s+/).forEach(function (refId) {
          const ref = __bar_g(refId);
          if (ref && ref.textContent) parts.push(ref.textContent);
        });
      }

      const placeholder = el.getAttribute("placeholder");
      if (placeholder) parts.push(placeholder);

      const name = el.getAttribute("name");
      if (name) parts.push(name);

      if (id) parts.push(id);

      return parts.join(" ").replace(/\s+/g, " ").trim();
    }

    function isRelevantControl(el) {
      if (!el || el.disabled) return false;

      const tag = el.tagName.toLowerCase();

      if (tag === "select") return true;

      if (tag === "textarea") {
        return false;
      }

      if (tag === "input") {
        const type = (el.getAttribute("type") || "text").toLowerCase();
        if (ignoredInputTypes.has(type)) return false;
        return candidateInputTypes.has(type) || type === "";
      }

      return false;
    }

    function isExcludedByContext(el, fieldText) {
      if (!fieldText) return false;
      return exclusionPatterns.some(function (pattern) {
        return pattern.test(fieldText);
      });
    }

    function inferPurpose(el, fieldText) {
      const type = (el.getAttribute("type") || "").toLowerCase();

      for (const rule of purposeRules) {
        if (rule.typeHint && rule.typeHint.includes(type)) {
          return rule.expected;
        }
      }

      for (const rule of purposeRules) {
        if (rule.patterns.some(function (pattern) { return pattern.test(fieldText); })) {
          return rule.expected;
        }
      }

      return null;
    }

    function validateAutocompleteValue(value) {
      const normalized = String(value || "").trim().toLowerCase();

      if (!normalized) {
        return { valid: false, normalized: normalized, reason: "Leerer Wert" };
      }

      if (normalized === "on" || normalized === "off") {
        return { valid: true, normalized: normalized, reason: "" };
      }

      const tokens = normalized.split(/\s+/).filter(Boolean);
      let i = 0;

      if (tokens[i] && /^section-[a-z0-9_-]+$/i.test(tokens[i])) i++;
      if (tokens[i] === "shipping" || tokens[i] === "billing") i++;

      let remaining = tokens.slice(i);
      if (!remaining.length) {
        return { valid: false, normalized: normalized, reason: "Kein Feldzweck angegeben" };
      }

      if (remaining[remaining.length - 1] === "webauthn") {
        remaining = remaining.slice(0, -1);
      }

      const fieldToken = remaining.join(" ");

      if (!validAutocompleteTokens.has(fieldToken)) {
        return {
          valid: false,
          normalized: normalized,
          reason: `Unbekannter oder nicht unterstützter Wert "${fieldToken}"`
        };
      }

      return { valid: true, normalized: normalized, reason: "" };
    }

    function matchesExpectedPurpose(normalizedAutocomplete, expected) {
      if (!expected) return true;
      if (normalizedAutocomplete === "on" || normalizedAutocomplete === "off") return false;
      return normalizedAutocomplete === expected || normalizedAutocomplete.endsWith(" " + expected);
    }

    const inspected = [];
    const failures = [];
    const warnings = [];
    const excluded = [];

    allElements.forEach(function (el) {
      if (!isRelevantControl(el)) {
        return;
      }

      const fieldText = getFieldText(el);
      const path = getDomPath(el);

      if (isExcludedByContext(el, fieldText)) {
        excluded.push({
          path: path,
          reason: "Ausgenommen, da das Feld nach Beschriftung/Kontext nicht wie ein personenbezogenes Nutzerfeld wirkt."
        });
        return;
      }

      const expectedPurpose = inferPurpose(el, fieldText);

      if (!expectedPurpose) {
        excluded.push({
          path: path,
          reason: "Nicht geprüft, da kein eindeutiger personenbezogener Eingabezweck erkennbar ist."
        });
        return;
      }

      inspected.push({
        el: el,
        path: path,
        expectedPurpose: expectedPurpose,
        fieldText: fieldText
      });
    });

    inspected.forEach(function (entry) {
      const el = entry.el;
      const path = entry.path;
      const expectedPurpose = entry.expectedPurpose;
      const autocomplete = el.getAttribute("autocomplete");

      if (autocomplete === null) {
        failures.push({
          path: path,
          cloned: cloneEl(el),
          message: `Für dieses personenbezogene Feld fehlt ein autocomplete-Wert. Erwartet wäre z.B. "${expectedPurpose}".`
        });
        return;
      }

      const validation = validateAutocompleteValue(autocomplete);

      if (!validation.valid) {
        failures.push({
          path: path,
          cloned: cloneEl(el),
          message: `Ungültiger autocomplete-Wert "${autocomplete}" (${validation.reason}).`
        });
        return;
      }

      if (!matchesExpectedPurpose(validation.normalized, expectedPurpose)) {
        warnings.push({
          path: path,
          cloned: cloneEl(el),
          message: `autocomplete="${autocomplete}" ist vorhanden, passt aber vermutlich nicht zum erkannten Zweck "${expectedPurpose}".`
        });
        return;
      }
    });

    let status = "pass";

    if (failures.length > 0) {
      status = "fail";
    } else if (warnings.length > 0) {
      status = "check";
    }

    function renderList(items) {
      return `<ol>${items
        .map(
          (item) =>
          `<li><strong>${__bar_escapeHtml(item.message)}</strong><br>
            Position: <code>${__bar_escapeHtml(item.path)}</code><br>
            <details class="clone">
              <summary><p class="toggleText">Element anzeigen</p></summary>
              <div class="inline-content details-content">
                <div class="clonedElement">${item.cloned}</div>
              </div>
            </details>
          </li>`
        )
        .join("")}</ol>`;
    }

    let content = `
    <p>
      Geprüft wurden <strong>${inspected.length}</strong> wahrscheinlich personenbezogene Eingabefelder<br>
      Nicht einbezogen: <strong>${excluded.length}</strong> Felder ohne klaren Personenbezug oder mit erkanntem Sonderzweck.<br>
      Fehler: <strong>${failures.length}</strong><br>Hinweise: <strong>${warnings.length}</strong>
    </p>
    `;

    if (failures.length > 0) {
      content += "<h4>Fehler</h4>" + renderList(failures);
    }

    if (warnings.length > 0) {
      content += "<h4>Hinweise</h4>" + renderList(warnings);
    }

    if (failures.length === 0 && warnings.length === 0 && inspected.length > 0) {
      content += "<p>Für die erkannten personenbezogenen Eingabefelder wurden passende autocomplete-Angaben gefunden.</p>";
    }

    if (inspected.length === 0) {
      content += "<p>Es wurden keine eindeutig personenbezogenen Eingabefelder erkannt, die unter diese Prüfung fallen.</p>";
    }

    return {
      id: 'R2135',
      reqLink: ['https://bitvtest.de/pruefschritt/bitv-20-web/bitv-20-web-9-1-3-5-eingabefelder-zu-nutzerdaten-vermitteln-den-zweck', 'Prüfschritt aufrufen'],
      reqInfo: ['Prüfschritt 9.1.3.5', 'Eingabefelder zu Nutzerdaten vermitteln den Zweck'],
      title: "Autocomplete-Attribute prüfen",
      status: status,
      content: content
    };
  },

  pruefeLabelInName() {
    const elements = __bar_all(`
      button,
      a[href],
      input[type="button"],
      input[type="submit"],
      input[type="reset"]
    `);

    const issues = [];

    elements.forEach((el) => {
      const visibleText = (el.innerText || el.value || "").trim();

      let accessibleName = "";

      if (el.hasAttribute("aria-label")) {
        accessibleName = el.getAttribute("aria-label").trim();
      } else if (el.hasAttribute("aria-labelledby")) {
        const ids = el.getAttribute("aria-labelledby").split(/\s+/);
        accessibleName = ids
          .map((id) => __bar_g(id)?.innerText || "")
          .join(" ")
          .trim();
      } else if (el.alt) {
        accessibleName = el.alt.trim();
      } else {
        accessibleName = visibleText;
      }

      if (visibleText) {
        const visibleLower = visibleText.toLowerCase();
        const accessibleLower = accessibleName.toLowerCase();

        if (!accessibleLower.includes(visibleLower)) {
          issues.push({
            el: el,
            tagName: el.tagName.toLowerCase(),
            visibleText,
            accessibleName: accessibleName || "(leer)"
          });
        }
      }
    });

    if (issues.length === 0) {
      return {
        id: 'R1253',
        reqLink: ['https://bitvtest.de/pruefschritt/bitv-20-web/bitv-20-web-9-2-5-3-sichtbare-beschriftung-teil-des-zugaenglichen-namens', 'Prüfschritt aufrufen'],
        reqInfo: ['Prüfschritt 9.2.5.3', 'Sichtbare Beschriftung Teil des zugänglichen Namens'],
        title: "Sichtbare Beschriftung im Namen",
        status: "pass",
        content: "Es wurden keine Probleme mit zugänglichen Namen in Bedienelementen erkannt oder gefunden."
      };
    }

    const listItems = issues
      .map((issue) => `
        <li>
          <strong>Element:</strong> &lt;${issue.tagName}&gt;<br>
          <strong>Sichtbare Beschriftung:</strong> ${__bar_escapeHtml(issue.visibleText)}<br>
          <strong>Zugänglicher Name:</strong> ${__bar_escapeHtml(issue.accessibleName)}

          <details class="clone">
              <summary><p class="toggleText">Element anzeigen</p></summary>
              <div class="inline-content details-content">
                <div class="clonedElement">${cloneEl(issue.el)}</div>
              </div>
            </details>
        </li>
      `)
    .join("");

    return {
      id: 'R1253',
      reqLink: ['https://bitvtest.de/pruefschritt/bitv-20-web/bitv-20-web-9-2-5-3-sichtbare-beschriftung-teil-des-zugaenglichen-namens', 'Prüfschritt aufrufen'],
      reqInfo: ['Prüfschritt 9.2.5.3', 'Sichtbare Beschriftung Teil des zugänglichen Namens'],
      title: "Sichtbare Beschriftung im Namen",
      status: "fail",
      content: `
        <p>Es wurden ${issues.length} Probleme gefunden:</p>
        <ol>
          ${listItems}
        </ol>
      `
    };
  },

  pruefeFormularBeschriftungen() {
    const selector = [
      'input:not([type="hidden"]):not([type="submit"]):not([type="reset"]):not([type="button"]):not([type="image"])',
      'select',
      'textarea'
    ].join(',');

    const elements = Array.from(__bar_all(selector));

    function isElementVisible(el) {
      if (!el || !(el instanceof Element)) return false;

      const style = window.getComputedStyle(el);
      if (
        style.display === 'none' ||
        style.visibility === 'hidden' ||
        style.visibility === 'collapse' ||
        parseFloat(style.opacity) === 0
      ) {
        return false;
      }

      if (el.hidden || el.getAttribute('aria-hidden') === 'true') {
        return false;
      }

      const rects = el.getClientRects();
      return rects.length > 0;
    }

    function isTextNodeVisible(textNode) {
      if (!textNode || !textNode.textContent || !textNode.textContent.trim()) {
        return false;
      }

      const parent = textNode.parentElement;
      if (!parent || !isElementVisible(parent)) {
        return false;
      }

      const range = document.createRange();
      range.selectNodeContents(textNode);

      const rects = range.getClientRects();
      return rects.length > 0;
    }

    function getVisibleTextFromElement(el) {
      if (!el || !isElementVisible(el)) return '';

      const walker = document.createTreeWalker(
        el,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode(node) {
            return node.textContent.trim()
              ? NodeFilter.FILTER_ACCEPT
              : NodeFilter.FILTER_REJECT;
          }
        }
      );

      const parts = [];
      let node;

      while ((node = walker.nextNode())) {
        if (isTextNodeVisible(node)) {
          parts.push(node.textContent.trim());
        }
      }

      return parts.join(' ').replace(/\s+/g, ' ').trim();
    }

    function getLabelByFor(el) {
      if (!el.id) return null;

      const label = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
      if (!label) return null;

      const text = getVisibleTextFromElement(label);
      if (!text) return null;

      return {
        type: 'label[for]',
        text,
        source: label
      };
    }

    function getWrappingLabel(el) {
      const label = el.closest('label');
      if (!label) return null;

      const text = getVisibleTextFromElement(label);
      if (!text) return null;

      return {
        type: 'wrapping label',
        text,
        source: label
      };
    }

    function getAriaLabelledby(el) {
      const value = el.getAttribute('aria-labelledby');
      if (!value) return null;

      const ids = value.trim().split(/\s+/).filter(Boolean);
      const texts = [];
      const sources = [];

      ids.forEach((id) => {
        const ref = __bar_g(id);
        if (!ref) return;

        const text = getVisibleTextFromElement(ref);
        if (!text) return;

        texts.push(text);
        sources.push(ref);
      });

      if (!texts.length) return null;

      return {
        type: 'aria-labelledby',
        text: texts.join(' ').replace(/\s+/g, ' ').trim(),
        source: sources[0]
      };
    }

    function getNearbyVisibleText(el) {
      const candidates = [];

      if (el.parentElement) candidates.push(el.parentElement);

      const prev = el.previousElementSibling;
      if (prev) candidates.push(prev);

      let current = el.parentElement;
      let depth = 0;
      while (current && depth < 2) {
        const possible = current.querySelector('legend');
        if (possible) candidates.push(possible);
        current = current.parentElement;
        depth++;
      }

      for (const candidate of candidates) {
        const text = getVisibleTextFromElement(candidate);
        if (!text) continue;

        const cleaned = text.replace(/\s+/g, ' ').trim();
        if (cleaned && cleaned.length <= 200) {
          return {
            type: 'nearby text',
            text: cleaned,
            source: candidate
          };
        }
      }

      return null;
    }

    function getVisibleLabelInfo(el) {
      return (
        getLabelByFor(el) ||
        getWrappingLabel(el) ||
        getAriaLabelledby(el) ||
        getNearbyVisibleText(el)
      );
    }

    const relevantElements = elements.filter(isElementVisible);
    const issues = [];
    const warnings = [];
    const passes = [];

    relevantElements.forEach((el) => {
      const labelInfo = getVisibleLabelInfo(el);
      const domPath = getDomPath(el);

      if (!labelInfo) {
        issues.push(`
          <li>
            <strong>Fehlende Beschriftung</strong><br>
            Keine sichtbare Beschriftung gefunden.<br>
            Position: <code>${__bar_escapeHtml(domPath)}</code><br>
            <details class="clone">
              <summary><p class="toggleText">Element anzeigen</p></summary>
              <div class="inline-content details-content">
                <div class="clonedElement">${cloneEl(el)}</div>
              </div>
            </details>
          </li>
        `);
        return;
      }

      const hasProgrammaticAssociation =
        labelInfo.type === 'label[for]' ||
        labelInfo.type === 'wrapping label' ||
        labelInfo.type === 'aria-labelledby';

      if (!hasProgrammaticAssociation) {
        warnings.push(`
          <li>
            Beschriftung: <strong>"${__bar_escapeHtml(labelInfo.text)}"</strong><br>
            Es wurde nur sichtbarer Text in der Umgebung gefunden, aber keine eindeutige technische Zuordnung per <code>label</code> oder <code>aria-labelledby</code>.<br>
            Position: <code>${__bar_escapeHtml(domPath)}</code><br>
            <details class="clone">
              <summary><p class="toggleText">Element anzeigen</p></summary>
              <div class="inline-content details-content">
                <div class="clonedElement">${cloneEl(el)}</div>
              </div>
            </details>
          </li>
        `);
        return;
      }

      passes.push(`<li><code>${__bar_escapeHtml(domPath)}</code></li>`);
    });

    if (!relevantElements.length) {
      return {
        id: 'R1332',
        reqLink: ['https://bitvtest.de/pruefschritt/bitv-20-web/bitv-20-web-9-3-3-2-beschriftungen-von-formularelementen-vorhanden', 'Prüfschritt aufrufen'],
        reqInfo: ['Prüfschritt 9.3.3.2', 'Beschriftungen von Formularelementen vorhanden'],
        title: "Sichtbare Beschriftungen von Formularelementen",
        status: "pass",
        content: "<p>Es wurden keine sichtbaren relevanten Formularelemente gefunden.</p>"
      };
    }

    let status = "pass";
    if (issues.length) {
      status = "fail";
    } else if (warnings.length) {
      status = "check";
    }

    const summary = `
      <p>
        Geprüfte sichtbare Formularelemente: <strong>${relevantElements.length}</strong><br>
        Mit sichtbarer und technisch zugeordneter Beschriftung: <strong>${passes.length}</strong><br>
        Manuell prüfen: <strong>${warnings.length}</strong><br>
        Ohne erkennbare sichtbare Beschriftung: <strong>${issues.length}</strong>
      </p>
    `;

    const details = `
      ${issues.length ? `<h4>Nicht bestanden</h4><ol>${issues.join('')}</ol>` : ''}
      ${warnings.length ? `<h4>Manuell prüfen</h4><ol>${warnings.join('')}</ol>` : ''}
    `;

    return {
      id: 'R1332',
      reqLink: ['https://bitvtest.de/pruefschritt/bitv-20-web/bitv-20-web-9-3-3-2-beschriftungen-von-formularelementen-vorhanden', 'Prüfschritt aufrufen'],
      reqInfo: ['Prüfschritt 9.3.3.2', 'Beschriftungen von Formularelementen vorhanden'],
      title: "Sichtbare Beschriftungen von Formularelementen",
      status,
      content: summary + details
    };
  },

  pruefeBeschriftungenStrengWCAG() {
    const labelableSelector = [
      'input:not([type="hidden"])',
      'select',
      'textarea',
      'output',
      'progress',
      'meter'
    ].join(',');

    const formControlSelector = [
      'input:not([type="hidden"])',
      'select',
      'textarea'
    ].join(',');

    function isElementVisible(el) {
      if (!el || !(el instanceof Element)) return false;

      if (el.hidden || el.getAttribute('aria-hidden') === 'true') {
        return false;
      }

      const style = window.getComputedStyle(el);
      if (
        style.display === 'none' ||
        style.visibility === 'hidden' ||
        style.visibility === 'collapse' ||
        parseFloat(style.opacity) === 0
      ) {
        return false;
      }

      return el.getClientRects().length > 0;
    }

    function isTextNodeVisible(textNode) {
      if (!textNode || !textNode.textContent || !textNode.textContent.trim()) {
        return false;
      }

      const parent = textNode.parentElement;
      if (!parent || !isElementVisible(parent)) return false;

      try {
        const range = document.createRange();
        range.selectNodeContents(textNode);
        return range.getClientRects().length > 0;
      } catch (e) {
        return false;
      }
    }

    function getVisibleText(el) {
      if (!el || !isElementVisible(el)) return '';

      const walker = document.createTreeWalker(
        el,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode(node) {
            return node.textContent && node.textContent.trim()
              ? NodeFilter.FILTER_ACCEPT
              : NodeFilter.FILTER_REJECT;
          }
        }
      );

      const parts = [];
      let node;
      while ((node = walker.nextNode())) {
        if (isTextNodeVisible(node)) {
          parts.push(node.textContent.trim());
        }
      }

      return parts.join(' ').replace(/\s+/g, ' ').trim();
    }

    function isLabelableElement(el) {
      if (!el || !(el instanceof Element)) return false;
      if (!el.matches(labelableSelector)) return false;

      if (el.matches('input')) {
        const type = (el.getAttribute('type') || 'text').toLowerCase();
        return type !== 'hidden';
      }

      return true;
    }

    function isFormControl(el) {
      return !!(el && el.matches && el.matches(formControlSelector));
    }

    function getAssociatedControlForLabel(label) {
      const forId = label.getAttribute('for');
      if (forId) {
        const target = __bar_g(forId);
        return {
          mode: 'for',
          forId,
          target: target || null
        };
      }

      const nestedControls = Array.from(label.querySelectorAll(labelableSelector));
      if (nestedControls.length === 1) {
        return {
          mode: 'nested',
          target: nestedControls[0]
        };
      }

      if (nestedControls.length > 1) {
        return {
          mode: 'nested-multiple',
          target: null,
          nestedControls
        };
      }

      return {
        mode: 'none',
        target: null
      };
    }

    function getExplicitLabelsForControl(control) {
      if (!control.id) return [];
      return Array.from(__bar_all(`label[for="${CSS.escape(control.id)}"]`));
    }

    function getImplicitLabelsForControl(control) {
      return Array.from(__bar_all('label')).filter(label => {
        if (label.hasAttribute('for')) return false;
        return label.contains(control);
      });
    }

    function getAllLabelsForControl(control) {
      return [...getExplicitLabelsForControl(control), ...getImplicitLabelsForControl(control)];
    }

    function getAriaLabelledbyReferences(control) {
      const ids = (control.getAttribute('aria-labelledby') || '')
        .trim()
        .split(/\s+/)
        .filter(Boolean);

      return ids.map(id => __bar_g(id)).filter(Boolean);
    }

    function findNearestGroupContainer(el) {
      return (
        el.closest('.form-group, .field, .form-field, .mb-3, .row, .col, td, th, div, li') ||
        el.parentElement
      );
    }

    function findVisibleTextCandidatesNearControl(control) {
      const results = [];
      const seen = new Set();

      const group = findNearestGroupContainer(control);
      if (!group) return results;

      const candidates = Array.from(
        group.querySelectorAll([
          'label',
          'legend',
          '[id]',
          '.control-label',
          '.form-label',
          '.col-form-label',
          '[class*="label"]'
        ].join(','))
      );

      candidates.forEach(el => {
        if (el === control) return;
        if (!isElementVisible(el)) return;

        const text = getVisibleText(el);
        if (!text) return;

        const key = getDomPath(el);
        if (seen.has(key)) return;
        seen.add(key);

        results.push({
          el,
          text,
          domPath: key
        });
      });

      return results;
    }

    function isPotentialLabelLikeElement(el) {
      if (!el || !(el instanceof Element)) return false;
      if (!isElementVisible(el)) return false;
      if (el.tagName.toLowerCase() === 'label') return false;
      if (el.tagName.toLowerCase() === 'legend') return false;

      const text = getVisibleText(el);
      if (!text) return false;
      if (text.length > 120) return false;

      if (
        el.matches('.control-label, .form-label, .col-form-label, [class*="label"]')
      ) {
        return true;
      }

      return false;
    }

    const issues = [];
    const warnings = [];
    const passes = [];

    const allLabels = Array.from(__bar_all('label'));
    const visibleLabels = allLabels.filter(isElementVisible);
    const allControls = Array.from(__bar_all(formControlSelector)).filter(isElementVisible);
    const allFieldsets = Array.from(__bar_all('fieldset')).filter(isElementVisible);

    // 1) Labels selbst prüfen
    visibleLabels.forEach(label => {
      const text = getVisibleText(label);
      const labelDesc = getElTag(label);
      const labelPath = getDomPath(label);
      const assoc = getAssociatedControlForLabel(label);

      if (!text) {
        warnings.push(`
          <li>
            <strong><label ohne Textstrong><br>
            Sichtbares <code>label</code> ohne erkennbaren sichtbaren Text. Manuell prüfen.<br>
            Element: <code>${__bar_escapeHtml(labelDesc)}</code><br>
            Position: <code>${__bar_escapeHtml(labelPath)}</code>
              <details class="clone">
                <summary><p class="toggleText">Element anzeigen</p></summary>
                <div class="inline-content details-content">
                  <div class="clonedElement">${cloneEl(label)}</div>
                </div>
              </details>
          </li>
        `);
        return;
      }

      if (assoc.mode === 'for') {
        if (!assoc.target) {
          issues.push(`
            <li>
              Text: <strong>"${__bar_escapeHtml(text)}"</strong><br>
              <code>for="${__bar_escapeHtml(assoc.forId)}"</code> verweist auf kein existierendes Element.<br>
              Element: <code>${__bar_escapeHtml(labelDesc)}</code><br>
              Position: <code>${__bar_escapeHtml(labelPath)}</code>
              <details class="clone">
                <summary><p class="toggleText">Element anzeigen</p></summary>
                <div class="inline-content details-content">
                  <div class="clonedElement">${cloneEl(label)}</div>
                </div>
              </details>
            </li>
          `);
          return;
        }

        if (!isLabelableElement(assoc.target)) {
          issues.push(`
            <li>
              Text: <strong>"${__bar_escapeHtml(text)}"</strong><br>
              <code>for="${__bar_escapeHtml(assoc.forId)}"</code> verweist auf ${getElTag(assoc.target)}, aber dieses Element ist nicht beschriftbar.<br>
              Element: <code>${__bar_escapeHtml(labelDesc)}</code><br>
              Position: <code>${__bar_escapeHtml(labelPath)}</code>
              <details class="clone">
                <summary><p class="toggleText">Element anzeigen</p></summary>
                <div class="inline-content details-content">
                  <div class="clonedElement">${cloneEl(label)}</div>
                </div>
              </details>
            </li>
          `);
          return;
        }

        if (!isElementVisible(assoc.target)) {
          warnings.push(`
            <li>
              Text: <strong>"${__bar_escapeHtml(text)}"</strong><br>
              Das referenzierte Element ist nicht sichtbar. Manuell prüfen, ob die Zuordnung im Prüfumfang relevant ist.<br>
              Element: <code>${__bar_escapeHtml(labelDesc)}</code><br>
              Position: <code>${__bar_escapeHtml(labelPath)}</code>
              <details class="clone">
                <summary><p class="toggleText">Element anzeigen</p></summary>
                <div class="inline-content details-content">
                  <div class="clonedElement">${cloneEl(label)}</div>
                </div>
              </details>
            </li>
          `);
          return;
        }

        passes.push(`
          <li>
            ${labelDesc}<br>
            Pfad: <code>${__bar_escapeHtml(labelPath)}</code><br>
            Beschriftung "${__bar_escapeHtml(text)}" ist per <code>for</code> korrekt mit ${getElTag(assoc.target)} verknüpft.
          </li>
        `);
        return;
      }

      if (assoc.mode === 'nested') {
        if (!isLabelableElement(assoc.target)) {
          issues.push(`
            <li>
              Text: <strong>"${__bar_escapeHtml(text)}"</strong><br>
              Das umschlossene Element ist nicht beschriftbar.<br>
              Element: <code>${__bar_escapeHtml(labelDesc)}</code><br>
              Position: <code>${__bar_escapeHtml(labelPath)}</code>
              <details class="clone">
                <summary><p class="toggleText">Element anzeigen</p></summary>
                <div class="inline-content details-content">
                  <div class="clonedElement">${cloneEl(label)}</div>
                </div>
              </details>
            </li>
          `);
          return;
        }

        passes.push(`
          <li>
            ${labelDesc}<br>
            Pfad: <code>${__bar_escapeHtml(labelPath)}</code><br>
            Beschriftung "${__bar_escapeHtml(text)}" umschließt ${getElTag(assoc.target)} korrekt.
          </li>
        `);
        return;
      }

      if (assoc.mode === 'nested-multiple') {
        issues.push(`
          <li>
            Text: <strong>"${__bar_escapeHtml(text)}"</strong><br>
            Das <code>label</code> enthält mehrere Formular-/beschriftbare Elemente. Die Zuordnung ist nicht eindeutig.<br>
            Element: <code>${__bar_escapeHtml(labelDesc)}</code><br>
            Position: <code>${__bar_escapeHtml(labelPath)}</code>
            <details class="clone">
              <summary><p class="toggleText">Element anzeigen</p></summary>
              <div class="inline-content details-content">
                <div class="clonedElement">${cloneEl(label)}</div>
              </div>
            </details>
          </li>
        `);
        return;
      }

      issues.push(`
        <li>
          Text: <strong>"${__bar_escapeHtml(text)}"</strong><br>
          <code>label</code> hat weder ein gültiges <code>for</code>-Attribut noch umschließt es ein Formularfeld.<br>
          Element: <code>${__bar_escapeHtml(labelDesc)}</code><br>
          Position: <code>${__bar_escapeHtml(labelPath)}</code>
          <details class="clone">
            <summary><p class="toggleText">Element anzeigen</p></summary>
            <div class="inline-content details-content">
              <div class="clonedElement">${cloneEl(label)}</div>
            </div>
          </details>
        </li>
      `);
    });

    // 2) Mehrfachbeschriftungen pro Feld
    allControls.forEach(control => {
      const labels = getAllLabelsForControl(control).filter(isElementVisible);
      const visibleLabelTexts = labels
        .map(getVisibleText)
        .filter(Boolean);

      const ariaRefs = getAriaLabelledbyReferences(control)
        .filter(isElementVisible)
        .map(ref => ({
          el: ref,
          text: getVisibleText(ref)
        }))
        .filter(item => item.text);

      const controlDesc = getElTag(control);
      const controlPath = getDomPath(control);

      if (labels.length > 1) {
        warnings.push(`
          <li>
            <strong>Feld hat mehrere label-Elemente</strong>
            Dem Feld sind mehrere sichtbare <code>label</code>-Elemente zugeordnet (${labels.length}): "${__bar_escapeHtml(visibleLabelTexts.join('" / "'))}". Manuell prüfen, ob dies beabsichtigt und verständlich ist.<br>
            Element: <code>${__bar_escapeHtml(controlDesc)}</code><br>
            Position: <code>${__bar_escapeHtml(controlPath)}</code>
            <details class="clone">
              <summary><p class="toggleText">Element anzeigen</p></summary>
              <div class="inline-content details-content">
                <div class="clonedElement">${cloneEl(control)}</div>
              </div>
            </details>
          </li>
        `);
      }

      const nearbyCandidates = findVisibleTextCandidatesNearControl(control)
        .filter(item => item.el !== control);

      const distinctNearbyTexts = Array.from(new Set(nearbyCandidates.map(item => item.text)));
      const distinctProgrammaticTexts = Array.from(new Set([
        ...visibleLabelTexts,
        ...ariaRefs.map(x => x.text)
      ]));

      if (
        distinctProgrammaticTexts.length === 1 &&
        distinctNearbyTexts.length > 1
      ) {
        warnings.push(`
          <li>
            <strong>Mehrere mögliche Beschriftungen</strong><br>
            Im nahen Umfeld wurden mehrere sichtbare Beschriftungskandidaten gefunden (${distinctNearbyTexts.length}). Manuell prüfen, ob die sichtbare Beschriftung eindeutig ist.<br>
            Element: <code>${__bar_escapeHtml(controlDesc)}</code><br>
            Position: <code>${__bar_escapeHtml(controlPath)}</code>
            <details class="clone">
              <summary><p class="toggleText">Element anzeigen</p></summary>
              <div class="inline-content details-content">
                <div class="clonedElement">${cloneEl(control)}</div>
              </div>
            </details>
          </li>
        `);
      }
    });

    // 3) fieldset / legend prüfen
    allFieldsets.forEach(fieldset => {
      const controlsInFieldset = Array.from(fieldset.querySelectorAll(formControlSelector)).filter(isElementVisible);
      if (!controlsInFieldset.length) return;

      const legends = Array.from(fieldset.querySelectorAll(':scope > legend')).filter(isElementVisible);
      const visibleLegendsWithText = legends
        .map(legend => ({ legend, text: getVisibleText(legend) }))
        .filter(item => item.text);

      const fieldsetDesc = getElTag(fieldset);
      const fieldsetPath = getDomPath(fieldset);

      if (!visibleLegendsWithText.length) {
        warnings.push(`
          <li>
            <strong>Fehlendes legend-Element</strong><br>
            <code>fieldset</code> mit sichtbaren Formularfeldern, aber ohne sichtbares <code>legend</code>. Bei Gruppen gleichartiger Auswahlfelder kann das ein WCAG-relevantes Problem sein.<br>
            Element: <code>${__bar_escapeHtml(fieldsetDesc)}</code><br>
            Position: <code>${__bar_escapeHtml(fieldsetPath)}</code>
            <details class="clone">
              <summary><p class="toggleText">Element anzeigen</p></summary>
              <div class="inline-content details-content">
                <div class="clonedElement">${cloneEl(fieldset)}</div>
              </div>
            </details>
          </li>
        `);
        return;
      }

      if (visibleLegendsWithText.length > 1) {
        warnings.push(`
          <li>
            <strong>Mehrere <code>legend</code>-Elemente</strong><br>
            Mehrere sichtbare <code>legend</code>-Elemente gefunden. Manuell prüfen, ob die Gruppenbeschriftung eindeutig ist.<br>
            Element: <code>${__bar_escapeHtml(fieldsetDesc)}</code><br>
            Position: <code>${__bar_escapeHtml(fieldsetPath)}</code>
            <details class="clone">
              <summary><p class="toggleText">Element anzeigen</p></summary>
              <div class="inline-content details-content">
                <div class="clonedElement">${cloneEl(fieldset)}</div>
              </div>
            </details>
          </li>
        `);
        return;
      }

      passes.push(`
        <li>
          ${__bar_escapeHtml(fieldsetDesc)}<br>
          Pfad: <code>${__bar_escapeHtml(fieldsetPath)}</code><br>
          Gruppenbeschriftung per <code>legend</code>: "${__bar_escapeHtml(visibleLegendsWithText[0].text)}"
        </li>
      `);
    });

    // 4) label-ähnliche Elemente prüfen
    const potentialLabelLikeElements = Array.from(__bar_all([
      '.control-label',
      '.form-label',
      '.col-form-label',
      '[class*="label"]'
    ].join(',')))
      .filter(isPotentialLabelLikeElement);

    const seenPseudo = new Set();

    potentialLabelLikeElements.forEach(el => {
      const path = getDomPath(el);
      if (seenPseudo.has(path)) return;
      seenPseudo.add(path);

      const text = getVisibleText(el);
      const desc = getElTag(el);

      const hasOwnFor = el.hasAttribute('for');
      const isReferencedByAria = !!(
        el.id &&
        document.querySelector(`[aria-labelledby~="${CSS.escape(el.id)}"]`)
      );
      const parentLabel = el.closest('label');
      const sameGroup = findNearestGroupContainer(el);
      const nearbyControls = sameGroup
        ? Array.from(sameGroup.querySelectorAll(formControlSelector)).filter(isElementVisible)
        : [];

      if (parentLabel) return;
      if (hasOwnFor) return;
      if (isReferencedByAria) return;
      if (!nearbyControls.length) return;

      const realLabelInGroup = sameGroup.querySelector('label, legend');
      if (realLabelInGroup) return;

      warnings.push(`
        <li>
          Beschriftung: <strong>"${__bar_escapeHtml(text)}"</strong><br>
          Dieses Element wirkt wie eine sichtbare Beschriftung für ein Formularfeld, ist aber nicht programmatisch als <code>label</code> oder per <code>aria-labelledby</code> mit einem Feld verknüpft.<br>
          Element: <code>${__bar_escapeHtml(desc)}</code><br>
          Position: <code>${__bar_escapeHtml(path)}</code>
          <details class="clone">
            <summary><p class="toggleText">Element anzeigen</p></summary>
            <div class="inline-content details-content">
              <div class="clonedElement">${cloneEl(el)}</div>
            </div>
          </details>
        </li>
      `);
    });

    const checkedCount = visibleLabels.length + allFieldsets.length + potentialLabelLikeElements.length;

    let status = 'pass';
    if (issues.length) {
      status = 'fail';
    } else if (warnings.length) {
      status = 'check';
    }

    const summary = `
      <p>
        Fehlerhafte Zuordnungen: <strong>${issues.length}</strong><br>
        Manuell prüfen: <strong>${warnings.length}</strong>
      </p>
      <p>
        Geprüft wurden sichtbare <code>label</code>-, <code>fieldset</code>/<code>legend</code>- und label-ähnliche Elemente. Die Auswertung ist streng und für WCAG-Prüfungen gedacht, ersetzt aber keine manuelle Fachprüfung.
      </p>
    `;

    const details = `
      ${issues.length ? `<h4>Nicht bestanden</h4><ol>${issues.join('')}</ol>` : ''}
      ${warnings.length ? `<h4>Manuell prüfen</h4><ol>${warnings.join('')}</ol>` : ''}
    `;

    return {
      id: 'R1038',
      reqLink: ['https://bitvtest.de/pruefschritt/bitv-20-web/bitv-20-web-9-1-3-1h-beschriftung-von-formularelementen-programmatisch-ermittelbar', 'Prüfschritt aufrufen'],
      reqInfo: ['Prüfschritt 9.1.3.1h', 'Beschriftung von Formularelementen programmatisch ermittelbar'],
      title: "Beschriftungen und Gruppierungsbeschriftungen von Formularfeldern",
      status,
      content: summary + details
    };
  },

  checkThScope() {
    const validScopes = ["row", "col", "rowgroup", "colgroup"];
    const thElements = __bar_all("th");
    const results = [];
    let pass = 0, check = 0, fail = 0;

    if (thElements.length <= 0) {
      return {
        id: 'R1036',
        reqLink: ['https://bitvtest.de/pruefschritt/bitv-20-web/bitv-20-web-9-1-3-1f-zuordnung-von-tabellenzellen', 'Prüfschritt aufrufen'],
        reqInfo: ['Prüfschritt 9.1.3.1f', 'Zuordnung von Tabellenzellen'],
        title: "Prüfe th scopes",
        status: "pass",
        content: `
          <p>Es wurden keine &lt;th&gt;-Elemente auf der Seite gefunden.</p>
        `
      };
    }

    thElements.forEach((th, index) => {
      const scope = th.getAttribute("scope");
      
      if (!scope) {
        results.push({
          el: th,
          index,
          valid: false,
          message: "Fehlendes scope-Attribut"
        }); check += 1;
      } else if (!validScopes.includes(scope.toLowerCase())) {
        results.push({
          el: th,
          index,
          valid: false,
          message: `Ungültiger scope-Attributwert: "${scope}"`
        }); check += 1;
      } else {
        pass += 1;
      }
    });

    const issues = results
      .map((issue) => `
        <li>
          <strong>${issue.message}</strong><br>
          Element: <code>${__bar_escapeHtml(getElTag(issue.el))}</code><br>
          Position: <code>${__bar_escapeHtml(getDomPath(issue.el))}</code>

          <details class="clone">
            <summary><p class="toggleText">Element anzeigen</p></summary>
            <div class="inline-content details-content">
              <div class="clonedElement">${cloneEl(issue.el, issue.el.closest('table'))}</div>
            </div>
          </details>
        </li>
      `)
    .join("");

    return {
      id: 'R1036',
      reqLink: ['https://bitvtest.de/pruefschritt/bitv-20-web/bitv-20-web-9-1-3-1f-zuordnung-von-tabellenzellen', 'Prüfschritt aufrufen'],
      reqInfo: ['Prüfschritt 9.1.3.1f', 'Zuordnung von Tabellenzellen'],
      title: "Prüfe th scopes",
      status: fail > 0 ? "fail" : (check > 0 ? "check" : "pass"),
      content: `
        <p>Gefundene &lt;th&gt;-Elemente: <strong>${thElements.length}</strong><br>
          Korrekt verwendet: <strong>${pass}</strong><br>
          Nicht eindeutig: <strong>${check}</strong><br>
          Problematisch: <strong>${fail}</strong></p>
        <ol>
          ${issues}
        </ol>
      `
    };
  },

  checkHorizontalScroll320() {
    return new Promise((resolve) => {
      let localFile = (location.protocol === "file:");
      let noOrigin = (window.location.origin === "null");
      
      if (localFile || noOrigin) {
        resolve({
          id: "R2146",
          reqLink: ["https://bitvtest.de/pruefschritt/bitv-20-web/bitv-20-web-9-1-4-10-inhalte-brechen-um", "Prüfschritt aufrufen"],
          reqInfo: ["Prüfschritt 9.1.4.10", "Inhalte brechen um"],
          title: "Horizontaler Überlauf bei 320px",
          status: "check",
          content: localFile ? `
            <p>Dieser Test kann nicht bei lokalen HTML-Dateien ausgeführt werden (<code>file://</code>).<br>
            Browser verbieten den Zugriff zu Größe/Inhalt von Popups in lokalen Dateien, weil der Ursprung der Datei <code>null</code> ist.<br>
            Bitte führe den Test mit einer gehosteten Seite erneut durch.
            ` : `
            <p>Der Ursprung der Datei ist <code>null</code>.<br>
            Browser verbieten den Zugriff zu Größe/Inhalt von Popups in Seiten, weil der Ursprung der Seite <code>null</code> ist.<br>
            Dieser Test konnte nicht ausgeführt werden.</p>
            ` 
        });
        return;
      }

      const url = location.href;
      const p = window.open(url, "mobile320probe", "width=320,height=700,resizable=yes,scrollbars=yes");

      if (!p) {
        resolve({
          id: "R2146",
          reqLink: ["https://bitvtest.de/pruefschritt/bitv-20-web/bitv-20-web-9-1-4-10-inhalte-brechen-um", "Prüfschritt aufrufen"],
          reqInfo: ["Prüfschritt 9.1.4.10", "Inhalte brechen um"],
          title: "Horizontaler Überlauf bei 320px",
          status: "check",
          content: "Popup konnte nicht geöffnet werden. Bitte erlaube Popups und führe den Test danach erneut aus."
        });
        return;
      }

      const done = () => {
        try {
          const de = p.document.documentElement;
          const body = p.document.body;

          const clientWidth = de.clientWidth;
          const scrollWidth = Math.max(
            de.scrollWidth,
            body ? body.scrollWidth : 0
          );

          const overflow = scrollWidth > clientWidth;

          try {
            p.close();
          } catch (_) {}

          resolve({
            id: "R2146",
            reqLink: ["https://bitvtest.de/pruefschritt/bitv-20-web/bitv-20-web-9-1-4-10-inhalte-brechen-um", "Prüfschritt aufrufen"],
            reqInfo: ["Prüfschritt 9.1.4.10", "Inhalte brechen um"],
            title: "Horizontaler Überlauf bei 320px",
            status: overflow ? "fail" : "pass",
            content: overflow ? `<p>Die Seite läuft bei 320px Breite horizontal über und ist daher scrollbar.</p>
            <p>Erkannte Viewport-Breite: <code>${clientWidth}px</code><br>
              Dokument Scroll-Breite: <code>${scrollWidth}px</code>
            </p>
            <p>Ein horizontaler Überlauf wurde erkannt, da die Scroll-Breite größer ist als die Viewport-Breite.</p>` :
            `<p>Kein horizontaler Überlauf wurde bei einer Fensterbreite von 320px erkannt.
            <p>Erkannte Viewport-Breite: <code>${clientWidth}px</code><br>
              Dokument Scroll-Breite: <code>${scrollWidth}px</code>
            </p>`
          });
        } catch (e) {
          try {
            p.close();
          } catch (_) {}

          resolve({
            id: "R2146",
            reqLink: ["https://bitvtest.de/pruefschritt/bitv-20-web/bitv-20-web-9-1-4-10-inhalte-brechen-um", "Prüfschritt aufrufen"],
            reqInfo: ["Prüfschritt 9.1.4.10", "Inhalte brechen um"],
            title: "Horizontaler Überlauf bei 320px",
            status: "crash",
            content: `Test abgebrochen: ${__bar_escapeHtml(e && e.message ? e.message : e)}`
          });
        }
      };

      p.addEventListener("load", () => setTimeout(done, 400));
    });
  },

  pruefeTextKontrast() {
    const MIN_NORMAL_TEXT = 4.5;
    const MIN_LARGE_TEXT = 3.0;

    function parseRgb(color) {
      if (!color || color === "transparent") return null;
      const match = color.match(/rgba?\(([^)]+)\)/i);
      if (!match) return null;

      const parts = match[1].split(",").map(v => parseFloat(v.trim()));
      return {
        r: parts[0],
        g: parts[1],
        b: parts[2],
        a: parts.length >= 4 ? parts[3] : 1
      };
    }

    function blendOver(fg, bg) {
      const alpha = fg.a == null ? 1 : fg.a;
      return {
        r: fg.r * alpha + bg.r * (1 - alpha),
        g: fg.g * alpha + bg.g * (1 - alpha),
        b: fg.b * alpha + bg.b * (1 - alpha),
        a: 1
      };
    }

    function relativeLuminance(rgb) {
      function channel(v) {
        v = v / 255;
        return v <= 0.03928
          ? v / 12.92
          : Math.pow((v + 0.055) / 1.055, 2.4);
      }

      return (
        0.2126 * channel(rgb.r) +
        0.7152 * channel(rgb.g) +
        0.0722 * channel(rgb.b)
      );
    }

    function contrastRatio(color1, color2) {
      const l1 = relativeLuminance(color1);
      const l2 = relativeLuminance(color2);
      const lighter = Math.max(l1, l2);
      const darker = Math.min(l1, l2);
      return (lighter + 0.05) / (darker + 0.05);
    }

    function getEffectiveBackgroundColor(el) {
      let current = el;

      while (current && current !== document.documentElement) {
        const bg = parseRgb(getComputedStyle(current).backgroundColor);

        if (bg && bg.a > 0) {
          if (bg.a < 1) {
            return blendOver(bg, { r: 255, g: 255, b: 255, a: 1 });
          }
          return bg;
        }

        current = current.parentElement;
      }

      return { r: 255, g: 255, b: 255, a: 1 };
    }

    function isVisible(el) {
      const style = getComputedStyle(el);
      const rect = el.getBoundingClientRect();

      return (
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        parseFloat(style.opacity) > 0 &&
        rect.width > 0 &&
        rect.height > 0
      );
    }

    function hasOwnVisibleText(el) {
      return Array.from(el.childNodes)
        .filter(node => node.nodeType === Node.TEXT_NODE)
        .some(node => node.textContent.trim().length > 0);
    }

    function isLargeText(style) {
      const fontSize = parseFloat(style.fontSize);
      const fontWeight = parseInt(style.fontWeight, 10) || 400;
      return fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700);
    }

    function rgbToHex(rgb) {
      const toHex = value =>
        Math.round(value).toString(16).padStart(2, "0").toUpperCase();

      return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
    }

    function simulateColorVisionDeficiency(rgb, type) {
      const matrices = {
        protanopia: [
          [0.567, 0.433, 0.000],
          [0.558, 0.442, 0.000],
          [0.000, 0.242, 0.758]
        ],
        deuteranopia: [
          [0.625, 0.375, 0.000],
          [0.700, 0.300, 0.000],
          [0.000, 0.300, 0.700]
        ],
        tritanopia: [
          [0.950, 0.050, 0.000],
          [0.000, 0.433, 0.567],
          [0.000, 0.475, 0.525]
        ]
      };

      const m = matrices[type];

      return {
        r: Math.min(255, Math.max(0, rgb.r * m[0][0] + rgb.g * m[0][1] + rgb.b * m[0][2])),
        g: Math.min(255, Math.max(0, rgb.r * m[1][0] + rgb.g * m[1][1] + rgb.b * m[1][2])),
        b: Math.min(255, Math.max(0, rgb.r * m[2][0] + rgb.g * m[2][1] + rgb.b * m[2][2])),
        a: 1
      };
    }

    function getColorDeficiencyResults(foreground, background) {
      return ["protanopia", "deuteranopia", "tritanopia"].map(type => {
        const simulatedFg = simulateColorVisionDeficiency(foreground, type);
        const simulatedBg = simulateColorVisionDeficiency(background, type);

        return {
          type,
          ratio: Number(contrastRatio(simulatedFg, simulatedBg).toFixed(2))
        };
      });
    }

    const candidates = Array.from(document.body.querySelectorAll("*"))
      .filter(isVisible)
      .filter(hasOwnVisibleText);

    const failures = [];
    const warnings = [];
    let checked = 0;

    candidates.forEach(el => {
      const style = getComputedStyle(el);
      const textColor = parseRgb(style.color);
      const bgColor = getEffectiveBackgroundColor(el);

      if (!textColor || !bgColor) return;

      const foreground = textColor.a < 1 ? blendOver(textColor, bgColor) : textColor;
      const ratio = Number(contrastRatio(foreground, bgColor).toFixed(2));
      const requiredRatio = isLargeText(style) ? MIN_LARGE_TEXT : MIN_NORMAL_TEXT;
      const cvdResults = getColorDeficiencyResults(foreground, bgColor);

      const passesWcag = ratio >= requiredRatio;
      const passesCvd = cvdResults.every(r => r.ratio >= requiredRatio);

      checked++;

      const item = {
        element: el,
        path: getDomPath(el),
        text: el.innerText.trim().replace(/\s+/g, " ").slice(0, 120),
        contrast: ratio,
        required: requiredRatio,
        textColor: rgbToHex(foreground),
        backgroundColor: rgbToHex(bgColor),
        cvdResults
      };

      if (!passesWcag) {
        failures.push(item);
      } else if (!passesCvd) {
        warnings.push(item);
      }
    });

    const failureHtml = failures.map(item => `<li>
        Text: <strong>${__bar_escapeHtml(item.text)}</strong><br>
        Kontrast: <div style="width: 1rem; height: 1rem; position:relative; margin: 0 0.35rem; display: inline-block; background: ${__bar_escapeHtml(item.backgroundColor)};outline: 1px solid #0008; transform: translateY(0.12rem)"><span style="color:${__bar_escapeHtml(item.textColor)};position:absolute;transform:translate(-50%,-50%);top:50%;left:50%">A</span></div><strong>${item.contrast}:1</strong>,
        erforderlich: <strong>${item.required}:1</strong><br>
        Textfarbe: <div style="width: 1rem; height: 1rem; margin: 0 0.35rem; display: inline-block; background: ${__bar_escapeHtml(item.textColor)};outline: 1px solid #0008; transform: translateY(0.12rem)"></div>${__bar_escapeHtml(item.textColor)},
        Hintergrund: <div style="width: 1rem; height: 1rem; margin: 0 0.35rem; display: inline-block; background: ${__bar_escapeHtml(item.backgroundColor)};outline: 1px solid #0008; transform: translateY(0.12rem)"></div>${__bar_escapeHtml(item.backgroundColor)}<br>
        Element: <code>${__bar_escapeHtml(getElTag(item.element))}</code><br>
        Position: <code>${__bar_escapeHtml(item.path)}</code>
        <details class="clone">
          <summary><p class="toggleText">Element anzeigen</p></summary>
          <div class="inline-content details-content">
            <div class="clonedElement">${cloneEl(item.element)}</div>
          </div>
        </details>
      </li>
    `).join("");

    const warningHtml = warnings.map(item => {
      const simulatedText = item.cvdResults
        .map(r => `${r.type}: ${r.ratio}:1`)
        .join(", ");

      return `<li>
          Text: <strong>${__bar_escapeHtml(item.text)}</strong><br>
          Erforderlicher Kontrast: <strong>${item.required}:1</strong><br>
          Simulierte Kontraste: ${__bar_escapeHtml(simulatedText)}<br>
          Hinweis: Der WCAG-Kontrast ist ausreichend, aber eine vereinfachte Farbfehlsichtigkeits-Simulation ist potenziell auffällig.<br>
          Element: <code>${__bar_escapeHtml(getElTag(item.element))}</code><br>
          Position: <code>${__bar_escapeHtml(item.path)}</code>
          <details class="clone">
            <summary><p class="toggleText">Element anzeigen</p></summary>
            <div class="inline-content details-content">
              <div class="clonedElement">${cloneEl(item.element)}</div>
            </div>
          </details>
        </li>
      `;
    }).join("");

    let status = "pass";
    let content = `
      <p>Geprüfte Textelemente: <strong>${checked}</strong></p>
      <p>Keine Kontrastprobleme gefunden.</p>
    `;

    if (warnings.length > 0) {
      status = "neutral";
      content = `
        <p>Geprüfte Textelemente: <strong>${checked}</strong></p>
        <p>Keine WCAG-Kontrastfehler gefunden, aber <strong>${warnings.length}</strong> potenziell problematische Farbkombinationen.</p>
        <ul>${warningHtml}</ul>
      `;
    }

    if (failures.length > 0) {
      status = "fail";
      content = `
        <p>Geprüfte Textelemente: <strong>${checked}</strong><br>
        Das Script prüft Kontrast rechnerisch. Ob Inhalte wirklich für alle Farbfehlsichtigkeiten verständlich sind, kann automatisiert nur angenähert werden.</p>
        <p><strong>${failures.length}</strong> Textelemente unterschreiten den erforderlichen Helligkeitskontrast.</p>
        ${warnings.length > 0 ? `<p>Zusätzlich: <strong>${warnings.length}</strong> potenziell problematische Farbkombinationen.</p>` : ""}
        <h4>Kontrastfehler</h4>
        <ul>${failureHtml}</ul>
        ${warnings.length > 0 ? `<h4>Hinweise Farbfehlsichtigkeit</h4><ul>${warningHtml}</ul>` : ""}
      `;
    }

    return {
      id: 'R2143',
      reqLink: ['https://bitvtest.de/pruefschritt/bitv-20-web/bitv-20-web-9-1-4-3-kontraste-von-texten-ausreichend', 'Prüfschritt aufrufen'],
      reqInfo: ['Prüfschritt 9.1.4.3', 'Kontraste von Texten ausreichend'],
      title: "Text-Kontrast und Farbfehlsichtigkeit",
      status: status,
      content: content
    };
  },

  pruefeTextVergroesserung200() {
    const originalHtmlFontSize = document.documentElement.style.fontSize;
    const originalBodyFontSize = document.body.style.fontSize;

    const issues = [];
    const checkedElements = [];

    function isVisible(el) {
      if (!el || !(el instanceof HTMLElement)) return false;

      const style = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();

      return (
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        style.opacity !== "0" &&
        rect.width > 0 &&
        rect.height > 0
      );
    }

    function hasMeaningfulText(el) {
      if (!el || !el.innerText) return false;

      const text = el.innerText.trim();

      return text.length > 0;
    }

    function getTextPreview(el) {
      const text = (el.innerText || "").trim().replace(/\s+/g, " ");
      return __bar_escapeHtml(text.length > 120 ? text.slice(0, 120) + "…" : text);
    }

    function pxToNumber(value) {
      const parsed = parseFloat(value);
      return Number.isFinite(parsed) ? parsed : 0;
    }

    function hasFixedHeight(style) {
      const height = style.height;
      const maxHeight = style.maxHeight;

      const fixedHeight =
        height &&
        height !== "auto" &&
        height !== "none" &&
        height.endsWith("px");

      const fixedMaxHeight =
        maxHeight &&
        maxHeight !== "none" &&
        maxHeight.endsWith("px");

      return fixedHeight || fixedMaxHeight;
    }

    function hasClippingOverflow(style) {
      return (
        style.overflow === "hidden" ||
        style.overflowX === "hidden" ||
        style.overflowY === "hidden" ||
        style.textOverflow === "ellipsis"
      );
    }

    function elementHasOverflow(el) {
      const tolerance = 2;

      return (
        el.scrollWidth > el.clientWidth + tolerance ||
        el.scrollHeight > el.clientHeight + tolerance
      );
    }

    function isTextLikelyCutOff(el, style) {
      if (!hasMeaningfulText(el)) return false;

      const overflow = elementHasOverflow(el);
      const clipping = hasClippingOverflow(style);
      const fixedHeight = hasFixedHeight(style);

      return overflow && (clipping || fixedHeight);
    }

    function isFontSizeAbsolutePx(style) {
      return style.fontSize && style.fontSize.endsWith("px");
    }

    function collectIssue(el, type, severity, message) {
      issues.push({
        element: el,
        type,
        severity,
        path: getDomPath(el),
        text: getTextPreview(el),
        message
      });
    }

    function scanPage(phase) {
      const elements = Array.from(document.body.querySelectorAll("*"));

      elements.forEach((el) => {
        if (!isVisible(el)) return;
        if (!hasMeaningfulText(el)) return;

        const style = window.getComputedStyle(el);

        checkedElements.push(el);

        if (isTextLikelyCutOff(el, style)) {
          collectIssue(
            el,
            "text-cut-off",
            "fail",
            `Nach Textvergrößerung auf 200% wirkt Text abgeschnitten oder nicht vollständig sichtbar.`
          );
        }

        if (hasClippingOverflow(style) && elementHasOverflow(el)) {
          collectIssue(
            el,
            "overflow-hidden",
            "fail",
            `Element hat überlaufenden Inhalt und verwendet overflow:hidden, overflow-x:hidden, overflow-y:hidden oder text-overflow:ellipsis.`
          );
        }

        if (hasFixedHeight(style) && elementHasOverflow(el)) {
          collectIssue(
            el,
            "fixed-height-overflow",
            "fail",
            `Element hat eine feste Höhe oder max-height in px, und der Inhalt läuft über.`
          );
        }

        if (
          phase === "after-resize" &&
          isFontSizeAbsolutePx(style) &&
          pxToNumber(style.fontSize) < 12
        ) {
          collectIssue(
            el,
            "very-small-text",
            "check",
            `Text ist nach der Vergrößerung weiterhin sehr klein. Prüfen, ob eigene CSS-Regeln die Skalierung verhindern.`
          );
        }
      });
    }

    function uniqueIssues(items) {
      const seen = new Set();

      return items.filter((issue) => {
        const key = issue.type + "|" + issue.path + "|" + issue.message;

        if (seen.has(key)) return false;

        seen.add(key);
        return true;
      });
    }

    try {
      // Ausgangszustand prüfen
      scanPage("before-resize");

      // Textvergrößerung simulieren
      document.documentElement.style.fontSize = "200%";
      document.body.style.fontSize = "200%";

      // Layout-Neuberechnung erzwingen
      document.body.offsetHeight;

      // Zustand nach Vergrößerung prüfen
      scanPage("after-resize");

      const finalIssues = uniqueIssues(issues);

      const failIssues = finalIssues.filter((issue) => issue.severity === "fail");
      const checkIssues = finalIssues.filter((issue) => issue.severity === "check");

      let status = "pass";

      if (failIssues.length > 0) {
        status = "fail";
      } else if (checkIssues.length > 0) {
        status = "check";
      }

      let content = "";

      if (status === "pass") {
        content = `
          <p><strong>Keine offensichtlichen Probleme gefunden.</strong></p>
          <p>Es wurden ${checkedElements.length} sichtbare Textelemente geprüft. Die Seite zeigt bei simulierter Textvergrößerung auf 200% keine klar erkennbaren abgeschnittenen oder überlaufenden Textbereiche.</p>
          <p>Hinweis: Die Prüfung ersetzt keinen manuellen Test. Bitte zusätzlich prüfen, ob alle Inhalte und Funktionen bei 200% Textgröße bedienbar bleiben.</p>
        `;
      } else {
        const maxShown = 15;

        const issueList = finalIssues.slice(0, maxShown).map((issue) => {
          return `
            <li>
              <strong>${__bar_escapeHtml(issue.severity)}: ${__bar_escapeHtml(issue.type)}</strong><br>
              ${__bar_escapeHtml(issue.message)}<br>
              Position: <code>${__bar_escapeHtml(issue.path)}</code><br>
              <em>Text:</em> ${issue.text || "<em>kein Textauszug verfügbar</em>"}
              <details class="clone">
                <summary><p class="toggleText">Element anzeigen</p></summary>
                <div class="inline-content details-content">
                  <div class="clonedElement">${cloneEl(issue.element)}</div>
                </div>
              </details>
            </li>
          `;
        }).join("");

        content = `
          <p><strong>${failIssues.length}</strong> potenzielle Fehler gefunden.<br>
          <strong>${checkIssues.length}</strong> manuell zu prüfende Hinweise gefunden.</p>

          <p>Die Seite wurde mit simulierter Textvergrößerung auf 200% geprüft.<br>
          Besonders kritisch sind Elemente mit abgeschnittenem Text, fester Höhe, verstecktem Overflow oder Ellipsen.</p>
          <p>Dennoch sollte manuell geprüft werden: Sind alle Texte vollständig lesbar? Bleiben Buttons, Formulare, Navigation, etc. vollständig erreichbar und nutzbar?

          <ol>
            ${issueList}
          </ol>

          ${
            finalIssues.length > maxShown
              ? `<p>Es werden nur die ersten ${maxShown} von ${finalIssues.length} Treffern angezeigt.</p>`
              : ""
          }
        `;
      }

      return {
        id: 'R2144',
        reqLink: ['https://bitvtest.de/pruefschritt/bitv-20-web/bitv-20-web-9-1-4-4-text-auf-200-vergroesserbar', 'Prüfschritt aufrufen'],
        reqInfo: ['Prüfschritt 9.1.4.4', 'Text auf 200% vergrößerbar'],
        title: "Text auf 200% vergrößerbar",
        status,
        content
      };
    } finally {
      // Originalzustand wiederherstellen
      document.documentElement.style.fontSize = originalHtmlFontSize;
      document.body.style.fontSize = originalBodyFontSize;
    }
  },

  pruefeTextabstaendeAnpassbar() {
    const TEST_CLASS = "wcag-text-spacing-test";
    const STYLE_ID = "wcag-text-spacing-test-style";

    const results = [];
    const warnings = [];
    const maxReportedItems = 30;

    function isVisible(el) {
      if (!el || !(el instanceof Element)) return false;

      const style = window.getComputedStyle(el);
      if (
        style.display === "none" ||
        style.visibility === "hidden" ||
        style.opacity === "0"
      ) {
        return false;
      }

      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    }

    function hasRelevantText(el) {
      if (!el || !el.innerText) return false;

      const text = el.innerText.replace(/\s+/g, " ").trim();
      if (text.length < 2) return false;

      const tag = el.tagName.toLowerCase();

      // Elemente mit relevantem sichtbaren Text
      const textTags = [
        "p", "span", "a", "button", "label", "li", "td", "th",
        "div", "section", "article", "header", "footer", "main",
        "h1", "h2", "h3", "h4", "h5", "h6", "blockquote",
        "figcaption", "summary"
      ];

      return textTags.includes(tag);
    }

    function getTextElements() {
      return Array.from(document.body.querySelectorAll("*"))
        .filter(el => isVisible(el) && hasRelevantText(el));
    }

    function getProblemSnippet(el) {
      const text = (el.innerText || "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 120);

      return `
        <li>
          <strong>${__bar_escapeHtml(getDomPath(el))}</strong><br>
          <code>${__bar_escapeHtml(text)}</code>
        </li>
      `;
    }

    function rectsOverlap(a, b) {
      return !(
        a.right <= b.left ||
        a.left >= b.right ||
        a.bottom <= b.top ||
        a.top >= b.bottom
      );
    }

    function getOriginalState(elements) {
      return elements.map(el => {
        const rect = el.getBoundingClientRect();
        return {
          el,
          rect,
          scrollWidth: el.scrollWidth,
          scrollHeight: el.scrollHeight,
          clientWidth: el.clientWidth,
          clientHeight: el.clientHeight,
          overflowX: window.getComputedStyle(el).overflowX,
          overflowY: window.getComputedStyle(el).overflowY
        };
      });
    }

    function injectTextSpacingStyles() {
      const style = document.createElement("style");
      style.id = STYLE_ID;

      /*
        WCAG 1.4.12 Text Spacing:
        - line-height: mindestens 1.5-fach
        - paragraph spacing: mindestens 2-fach der Schriftgröße
        - letter-spacing: mindestens 0.12-fach der Schriftgröße
        - word-spacing: mindestens 0.16-fach der Schriftgröße
      */
      style.textContent = `
        body.${TEST_CLASS},
        body.${TEST_CLASS} *:not(script):not(style):not(noscript):not(svg):not(svg *) {
          line-height: 1.5 !important;
          letter-spacing: 0.12em !important;
          word-spacing: 0.16em !important;
        }

        body.${TEST_CLASS} p,
        body.${TEST_CLASS} li,
        body.${TEST_CLASS} blockquote,
        body.${TEST_CLASS} figcaption,
        body.${TEST_CLASS} dd,
        body.${TEST_CLASS} dt {
          margin-bottom: 2em !important;
        }
      `;

      document.head.appendChild(style);
      document.body.classList.add(TEST_CLASS);
    }

    function removeTextSpacingStyles() {
      document.body.classList.remove(TEST_CLASS);
      const style = document.getElementById(STYLE_ID);
      if (style) style.remove();
    }

    function detectClipping(elements) {
      const clipped = [];

      elements.forEach(el => {
        if (!isVisible(el)) return;

        const style = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();

        const clipsX =
          ["hidden", "clip"].includes(style.overflowX) &&
          el.scrollWidth > el.clientWidth + 2;

        const clipsY =
          ["hidden", "clip"].includes(style.overflowY) &&
          el.scrollHeight > el.clientHeight + 2;

        const fixedHeightWithOverflow =
          rect.height > 0 &&
          el.scrollHeight > el.clientHeight + 2 &&
          ["hidden", "clip"].includes(style.overflowY);

        if (clipsX || clipsY || fixedHeightWithOverflow) {
          clipped.push(el);
        }
      });

      return clipped;
    }

    function detectHorizontalPageScroll() {
      return document.documentElement.scrollWidth > window.innerWidth + 5;
    }

    function detectSuspiciousFixedSizes(elements) {
      const suspicious = [];

      elements.forEach(el => {
        const style = window.getComputedStyle(el);

        const hasFixedHeight =
          style.height &&
          style.height !== "auto" &&
          style.height !== "0px";

        const hasMaxHeight =
          style.maxHeight &&
          style.maxHeight !== "none" &&
          style.maxHeight !== "0px";

        const hasHiddenOverflow =
          ["hidden", "clip"].includes(style.overflow) ||
          ["hidden", "clip"].includes(style.overflowY) ||
          ["hidden", "clip"].includes(style.overflowX);

        if ((hasFixedHeight || hasMaxHeight) && hasHiddenOverflow) {
          suspicious.push(el);
        }
      });

      return suspicious;
    }

    function detectOverlaps(elements) {
      const overlaps = [];

      const candidates = elements
        .filter(isVisible)
        .map(el => ({
          el,
          rect: el.getBoundingClientRect()
        }))
        .filter(item => item.rect.width > 0 && item.rect.height > 0);

      for (let i = 0; i < candidates.length; i++) {
        for (let j = i + 1; j < candidates.length; j++) {
          const a = candidates[i];
          const b = candidates[j];

          // Parent/Child-Überschneidungen sind normal und sollen ignoriert werden.
          if (a.el.contains(b.el) || b.el.contains(a.el)) continue;

          if (!rectsOverlap(a.rect, b.rect)) continue;

          const overlapWidth =
            Math.min(a.rect.right, b.rect.right) -
            Math.max(a.rect.left, b.rect.left);

          const overlapHeight =
            Math.min(a.rect.bottom, b.rect.bottom) -
            Math.max(a.rect.top, b.rect.top);

          if (overlapWidth > 4 && overlapHeight > 4) {
            overlaps.push([a.el, b.el]);
          }

          if (overlaps.length >= maxReportedItems) return overlaps;
        }
      }

      return overlaps;
    }

    function formatElementList(title, elements) {
      if (!elements.length) return "";

      return `
        <h3>${__bar_escapeHtml(title)}</h3>
        <ul>
          ${elements.slice(0, maxReportedItems).map(getProblemSnippet).join("")}
        </ul>
        ${
          elements.length > maxReportedItems
            ? `<p>Weitere ${elements.length - maxReportedItems} Elemente wurden nicht angezeigt.</p>`
            : ""
        }
      `;
    }

    function formatOverlapList(overlaps) {
      if (!overlaps.length) return "";

      return `
        <h3>Mögliche Überlappungen nach Textabstands-Anpassung</h3>
        <ul>
          ${overlaps.slice(0, maxReportedItems).map(pair => {
            const a = pair[0];
            const b = pair[1];

            return `
              <li>
                <strong>${__bar_escapeHtml(getDomPath(a))}</strong><br>
                überlappt möglicherweise mit<br>
                <strong>${__bar_escapeHtml(getDomPath(b))}</strong>
              </li>
            `;
          }).join("")}
        </ul>
        ${
          overlaps.length > maxReportedItems
            ? `<p>Weitere ${overlaps.length - maxReportedItems} Überlappungen wurden nicht angezeigt.</p>`
            : ""
        }
      `;
    }

    try {
      if (!document.body) {
        return {
          id: 'R2148',
          reqLink: ['https://bitvtest.de/pruefschritt/bitv-20-web/bitv-20-web-9-1-3-5-eingabefelder-zu-nutzerdaten-vermitteln-den-zweck', 'Prüfschritt aufrufen'],
          reqInfo: ['Prüfschritt 9.1.4.12', 'Textabstände anpassbar'],
          title: "Textabstände anpassbar",
          status: "check",
          content: "Die Prüfung konnte nicht ausgeführt werden, da kein <code>body</code>-Element gefunden wurde."
        };
      }

      const textElementsBefore = getTextElements();

      if (!textElementsBefore.length) {
        return {
          id: 'R2148',
          reqLink: ['https://bitvtest.de/pruefschritt/bitv-20-web/bitv-20-web-9-1-3-5-eingabefelder-zu-nutzerdaten-vermitteln-den-zweck', 'Prüfschritt aufrufen'],
          reqInfo: ['Prüfschritt 9.1.4.12', 'Textabstände anpassbar'],
          title: "Textabstände anpassbar",
          status: "check",
          content: "Es wurden keine sichtbaren Textelemente gefunden. Bitte manuell prüfen."
        };
      }

      const originalState = getOriginalState(textElementsBefore);
      const suspiciousFixedSizesBefore = detectSuspiciousFixedSizes(textElementsBefore);

      injectTextSpacingStyles();

      // Layout neu berechnen lassen
      document.body.offsetHeight;

      const textElementsAfter = getTextElements();

      const clippedAfter = detectClipping(textElementsAfter);
      const overlapsAfter = detectOverlaps(textElementsAfter);
      const hasHorizontalScrollAfter = detectHorizontalPageScroll();

      removeTextSpacingStyles();

      const problemCount =
        clippedAfter.length +
        overlapsAfter.length +
        suspiciousFixedSizesBefore.length +
        (hasHorizontalScrollAfter ? 1 : 0);

      if (suspiciousFixedSizesBefore.length) {
        warnings.push(`
          <p>
            Es wurden Elemente mit fester Höhe oder maximaler Höhe und verstecktem Overflow gefunden.
            Solche Container sind häufig problematisch, wenn Textabstände durch Nutzer:innen erhöht werden.
          </p>
        `);
      }

      if (hasHorizontalScrollAfter) {
        warnings.push(`
          <p>
            Nach Anwendung der WCAG-Textabstände entsteht horizontales Scrollen auf Seitenebene.
            Das kann auf abgeschnittene oder nicht umbrechende Inhalte hinweisen.
          </p>
        `);
      }

      let status = "pass";

      if (problemCount > 0) {
        status = "check";
      }

      let content = `
        <p>
          Die Seite wurde mit folgenden Textabständen und Einstellungen geprüft:<br>
          <code>line-height: 1.5</code>, <code>letter-spacing: 0.12em</code>, <code>word-spacing: 0.16em</code>, <code>margin-bottom: 2em</code>
        </p>
        <p>
          Geprüfte sichtbare Textelemente: <strong>${textElementsBefore.length}</strong>
        </p>
      `;

      if (status === "pass") {
        content += `
          <p>
            Es wurden keine offensichtlichen Probleme durch angepasste Textabstände erkannt.
            Eine manuelle Sichtprüfung ist dennoch empfohlen, da Überlappungen und abgeschnittene Inhalte nicht immer zuverlässig automatisiert erkannt werden können.
          </p>
        `;
      } else {
        content += `
          <p>
            Es wurden mögliche Probleme gefunden. Bitte die folgenden Stellen manuell prüfen.
            Nicht jede Auffälligkeit ist automatisch ein WCAG-Verstoß.
          </p>
        `;

        content += warnings.join("");

        content += formatElementList(
          "Möglicherweise abgeschnittener Text nach Textabstands-Anpassung",
          clippedAfter
        );

        content += formatElementList(
          "Elemente mit fester Höhe / verstecktem Overflow",
          suspiciousFixedSizesBefore
        );

        content += formatOverlapList(overlapsAfter);
      }

      return {
        id: 'R2148',
        reqLink: ['https://bitvtest.de/pruefschritt/bitv-20-web/bitv-20-web-9-1-3-5-eingabefelder-zu-nutzerdaten-vermitteln-den-zweck', 'Prüfschritt aufrufen'],
        reqInfo: ['Prüfschritt 9.1.4.12', 'Textabstände anpassbar'],
        title: "Textabstände anpassbar",
        status: status,
        content: content
      };

    } catch (error) {
      removeTextSpacingStyles();

      return {
        id: 'R2148',
        reqLink: ['https://bitvtest.de/pruefschritt/bitv-20-web/bitv-20-web-9-1-3-5-eingabefelder-zu-nutzerdaten-vermitteln-den-zweck', 'Prüfschritt aufrufen'],
        reqInfo: ['Prüfschritt 9.1.4.12', 'Textabstände anpassbar'],
        title: "Textabstände anpassbar",
        status: "check",
        content: `
          <p>Die Prüfung konnte nicht vollständig ausgeführt werden.</p>
          <p><strong>Fehler:</strong> ${__bar_escapeHtml(error.message || String(error))}</p>
        `
      };
    }
  }

};

const __bar_g = elId => document.getElementById(elId);
const __bar_all = cssSel => document.querySelectorAll(cssSel);

function __bar_escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function cloneEl(el, container = null) {
  /*return el.parentElement.outerHTML;*/
  el.classList.add("highlight-temp");
  let parent = el.parentElement;
  if (container) parent = container;
  const html = parent.outerHTML;
  el.classList.remove("highlight-temp");
  /*return html;*/
  const iframe = document.createElement("iframe");
  iframe.srcdoc = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          * {
            font-family: Arial, sans-serif;
          }
            
          body {
            margin: 16px;
          }

          .highlight-temp {
              border: 3px solid #ff00c8 !important;
              outline-offset: 3px !important;
              box-shadow: 0 0 10px #ff00c877;
              border-radius: 4px;
          }
        </style>
      </head>
      <body>
        ${html}
      </body>
    </html>
  `;

  return iframe.outerHTML;
}

function getSelector(el) {
  if (!el) return "(node)";
  let s = (el.tagName || "").toLowerCase();

  if (el.classList && el.classList.length) {
    s += "." + Array.from(el.classList).slice(0, 6).join(".");
  }

  if (el.id) {
    s += "#" + el.id;
  }

  return (s || "(node)");
}

function getElTag(el) {
  const openingTag = el.cloneNode(false).outerHTML;
  return openingTag.slice(0, openingTag.indexOf('</'));
}

function getDomPath(el, container = null) {
  const parts = [];
  let current = el;
  let depth = 0;
  

  while (current && current.nodeType === 1 && depth < 6) {
    let part = current.tagName.toLowerCase();

    if (current.id) {
      part += `#${current.id}`;
      parts.unshift(part);
      break;
    }

    if (current.classList && current.classList.length) {
      part += "." + [...current.classList].slice(0, 3).join(".");
    }

    let parent = current.parentElement;
    if (container) parent = container;
    
    if (parent) {
      const sameTagSiblings = [...parent.children].filter(
        sibling => sibling.tagName === current.tagName
      );

      if (sameTagSiblings.length > 1) {
        part += `:nth-of-type(${sameTagSiblings.indexOf(current) + 1})`;
      }
    }

    parts.unshift(part);
    current = parent;
    depth++;
  }

  return parts.join(" > ");
}

window.PageAnalyzerTests = tests;