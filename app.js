const search = document.getElementById("search");
const filters = document.getElementById("filters");
const library = document.getElementById("library");
const transformProperties = ["Position", "Scale", "Rotation", "Opacity"];
const filterCategories = [...transformProperties, "Etc"];
let recipes = [];
let selectedCategory = null;

function createFilters() {
  for (const category of filterCategories) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = category;
    button.setAttribute("aria-pressed", "false");
    button.onclick = () => {
      selectedCategory = selectedCategory === category ? null : category;
      for (const filter of filters.children) {
        const isActive = filter.textContent === selectedCategory;
        filter.classList.toggle("active", isActive);
        filter.setAttribute("aria-pressed", String(isActive));
      }
      render();
    };
    filters.appendChild(button);
  }
}

function matchesCategory(recipe) {
  if (selectedCategory === null) return true;

  const categories = recipe.category.split("·").map(category => category.trim());
  if (selectedCategory === "Etc") {
    return !categories.some(category => transformProperties.includes(category));
  }
  return categories.includes(selectedCategory);
}

function appendSourceLink(title, recipeName, url) {
  const source = new URL(url).hostname;
  const label = `${source} 참고 자료 (새 탭)`;
  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.className = "tag";
  link.textContent = "↗";
  link.title = label;
  link.setAttribute("aria-label", `${recipeName} — ${label}`);
  title.append(" ", link);
}

function isHttpsUrl(url) {
  return typeof url === "string" && URL.canParse(url) && new URL(url).protocol === "https:";
}

function isGuide(guide) {
  return guide &&
    ["property", "preparation", "check"].every(field => typeof guide[field] === "string") &&
    Array.isArray(guide.steps) && guide.steps.length > 0 &&
    guide.steps.every(step => typeof step === "string");
}

function createGuide(guide) {
  const details = document.createElement("details");
  const summary = document.createElement("summary");
  summary.textContent = "적용 방법";
  details.append(summary);

  for (const [label, value] of [["적용할 속성", guide.property], ["먼저 준비할 것", guide.preparation]]) {
    const paragraph = document.createElement("p");
    const heading = document.createElement("strong");
    heading.textContent = label;
    paragraph.append(heading, " · ", value);
    details.append(paragraph);
  }

  const steps = document.createElement("ol");
  for (const step of guide.steps) {
    const item = document.createElement("li");
    item.textContent = step;
    steps.append(item);
  }
  const check = document.createElement("p");
  check.textContent = guide.check;
  details.append(steps, check);
  return details;
}

function render() {
  const query = search.value.toLowerCase();
  library.replaceChildren();
  recipes.filter(r =>
    matchesCategory(r) &&
    (r.name + r.description + r.category).toLowerCase().includes(query)
  ).forEach(r => {
    const card = document.createElement("div");
    card.className = "card";
    const tag = document.createElement("div");
    tag.className = "tag";
    tag.textContent = r.category;
    const title = document.createElement("h2");
    title.textContent = r.name;
    for (const url of [r.sourceUrl, ...(r.additionalSourceUrls ?? [])]) {
      if (url) appendSourceLink(title, r.name, url);
    }

    const desc = document.createElement("p");
    desc.textContent = r.description;
    card.append(tag, title, desc);
    if (r.guide) card.append(createGuide(r.guide));
    if (r.code) {
      const code = document.createElement("pre");
      code.textContent = r.code;
      const copy = document.createElement("button");
      copy.textContent = "코드 복사";
      copy.onclick = async () => {
        try {
          await navigator.clipboard.writeText(r.code);
          copy.textContent = "복사 완료!";
        } catch {
          copy.textContent = "복사 실패";
        }
      };
      card.append(code, copy);
    }
    library.appendChild(card);
  });
}
async function loadRecipes() {
  try {
    const response = await fetch('./expressions.json');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    const fields = ["name", "category", "description"];
    if (!Array.isArray(data) || !data.every(recipe =>
      recipe &&
      fields.every(field => typeof recipe[field] === "string") &&
      (recipe.code === undefined || typeof recipe.code === "string") &&
      (recipe.guide === undefined || isGuide(recipe.guide)) &&
      (recipe.sourceUrl === undefined || isHttpsUrl(recipe.sourceUrl)) &&
      (recipe.additionalSourceUrls === undefined ||
        (Array.isArray(recipe.additionalSourceUrls) && recipe.additionalSourceUrls.every(isHttpsUrl))) &&
      (recipe.code || recipe.sourceUrl || recipe.additionalSourceUrls?.length)
    )) {
      throw new Error("Invalid expressions.json format");
    }
    recipes = data;
    createFilters();
    search.disabled = false;
    render();
  } catch (error) {
    console.error("Failed to load expressions.json", error);
    const message = document.createElement("p");
    message.setAttribute("role", "alert");
    message.textContent = "익스프레션을 불러오지 못했습니다. 페이지를 새로고침해 주세요.";
    library.replaceChildren(message);
  }
}

search.addEventListener("input", render);
loadRecipes();
