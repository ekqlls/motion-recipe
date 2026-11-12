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

    const desc = document.createElement("p");
    desc.textContent = r.description;
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
    card.append(tag, title, desc, code, copy);
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
    const fields = ["name", "category", "description", "code"];
    if (!Array.isArray(data) || !data.every(recipe =>
      recipe && fields.every(field => typeof recipe[field] === "string")
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
