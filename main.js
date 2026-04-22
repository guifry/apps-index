const grid = document.getElementById("grid");
const countEl = document.getElementById("count");
const input = document.getElementById("q");
const chips = document.getElementById("platform-chips");

const GH_ICON = `<svg viewBox="0 0 16 16" fill="currentColor"><path fill-rule="evenodd" d="M8 0C3.58 0 0 3.58 0 8a8 8 0 0 0 5.47 7.59c.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>`;

const VERCEL_ICON = `<svg viewBox="0 0 76 65" fill="currentColor"><path d="M37.5274 0L75.0548 65H0L37.5274 0Z"/></svg>`;

async function main() {
  const sites = await fetch("./sites.json").then((r) => r.json());
  countEl.textContent = `${sites.length} projects`;

  const platforms = [...new Set(sites.map((s) => s.platform))];
  let activePlatform = null;

  for (const p of platforms) {
    const chip = document.createElement("button");
    chip.className = "chip";
    chip.textContent = p;
    chip.dataset.platform = p;
    chip.addEventListener("click", () => {
      activePlatform = activePlatform === p ? null : p;
      render();
    });
    chips.appendChild(chip);
  }

  function platformBadge(p) {
    const isVercel = p.toLowerCase().includes("vercel");
    const cls = isVercel ? "vercel" : "ghpages";
    const icon = isVercel ? VERCEL_ICON : GH_ICON;
    const label = isVercel ? "Vercel" : "GH Pages";
    return `<span class="badge ${cls}">${icon}${label}</span>`;
  }

  function render() {
    const q = input.value.trim().toLowerCase();
    const filtered = sites.filter((s) => {
      if (activePlatform && s.platform !== activePlatform) return false;
      if (!q) return true;
      const hay = [s.name, s.description, ...(s.tags || [])]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });

    for (const c of chips.children) {
      c.classList.toggle("active", c.dataset.platform === activePlatform);
    }

    grid.replaceChildren();
    if (filtered.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty";
      empty.textContent = "no match";
      grid.appendChild(empty);
      return;
    }

    const frag = document.createDocumentFragment();
    for (const s of filtered) {
      const card = document.createElement("a");
      card.className = "card";
      card.href = s.url;
      card.target = "_blank";
      card.rel = "noopener";
      card.setAttribute("aria-label", `${s.name} — open site`);

      const tags = (s.tags || [])
        .map((t) => `<span class="tag">${escapeHtml(t)}</span>`)
        .join("");

      card.innerHTML = `
        <div class="shot">
          <img src="./screenshots/${s.slug}.png" alt="${escapeAttr(
        s.name,
      )} screenshot" loading="lazy" />
        </div>
        <a class="repo-link" href="${s.repo}" target="_blank" rel="noopener"
           aria-label="${escapeAttr(s.name)} source on GitHub"
           onclick="event.stopPropagation()">${GH_ICON}</a>
        <div class="body">
          <div class="title-row">
            <h2 class="title">${escapeHtml(s.name)}</h2>
            ${platformBadge(s.platform)}
          </div>
          <p class="desc">${escapeHtml(s.description)}</p>
          ${tags ? `<div class="tags">${tags}</div>` : ""}
        </div>
      `;
      frag.appendChild(card);
    }
    grid.appendChild(frag);
  }

  input.addEventListener("input", render);
  document.addEventListener("keydown", (e) => {
    if (e.key === "/" && document.activeElement !== input) {
      e.preventDefault();
      input.focus();
      input.select();
    } else if (e.key === "Escape" && document.activeElement === input) {
      input.value = "";
      render();
    }
  });

  render();
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeAttr(s) {
  return escapeHtml(s).replaceAll('"', "&quot;");
}

main().catch((err) => {
  console.error(err);
  grid.innerHTML = `<div class="empty">failed to load: ${escapeHtml(
    err.message,
  )}</div>`;
});
