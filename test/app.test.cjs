const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');
const data = JSON.parse(fs.readFileSync('expressions.json', 'utf8'));

class Element {
  constructor(tag) { this.tag = tag; this.children = []; this.attrs = {}; this.value = ''; this.textContent = ''; this.classList = { toggle() {} }; }
  append(...items) { this.children.push(...items); }
  appendChild(item) { this.append(item); }
  replaceChildren(...items) { this.children = items; }
  setAttribute(key, value) { this.attrs[key] = value; }
  addEventListener(event, callback) { this[event] = callback; }
}
function all(element) { return [element, ...element.children.filter(x => x instanceof Element).flatMap(all)]; }
function text(element) { return all(element).map(x => x.textContent).join(' '); }
async function boot(payload = data, ok = true) {
  const elements = Object.fromEntries(['search', 'filters', 'library'].map(id => [id, new Element(id)]));
  const copied = [];
  const context = vm.createContext({
    document: { getElementById: id => elements[id], createElement: tag => new Element(tag) },
    navigator: { clipboard: { writeText: async code => copied.push(code) } },
    fetch: async () => ({ ok, status: 500, json: async () => payload }), URL,
    console: { error() {} }
  });
  vm.runInContext(fs.readFileSync('app.js', 'utf8'), context);
  await new Promise(resolve => setImmediate(resolve));
  return { ...elements, copied, context };
}

test('all legacy recipes, code, guides and sources survive', () => {
  const original = JSON.parse(execFileSync('git', ['show', '1faf1886ec3a4bc95ca6772ffde03b3ce92f6fe2:expressions.json'], { encoding: 'utf8' }));
  assert.equal(data.length, original.length);
  original.forEach((recipe, i) => Object.keys(recipe).forEach(key => assert.deepEqual(data[i][key], recipe[key])));
});
test('Organic Wave renders once, labels both properties and copies each exact code', async () => {
  const ui = await boot();
  assert.equal(ui.library.children.length, data.length - 1);
  ui.search.value = 'Organic Wave Amount'; ui.search.input();
  assert.equal(ui.library.children.length, 1);
  const card = ui.library.children[0];
  assert.match(text(card), /Evolution · 필수/);
  assert.match(text(card), /Amount · 선택/);
  assert.match(text(card), /필수 효과/);
  assert.match(text(card), /권장 설정/);
  const buttons = all(card).filter(x => x.tag === 'button');
  assert.equal(buttons.length, 2);
  for (const button of buttons) await button.onclick();
  assert.deepEqual(ui.copied, data.filter(r => r.group === 'organic-wave').map(r => r.code));
  vm.runInContext('navigator.clipboard.writeText = async () => { throw Error("denied"); }', ui.context);
  await buttons[0].onclick();
  assert.equal(buttons[0].textContent, '복사 실패');
});
test('every category retains its recipes and toggles off; search combines with filters', async () => {
  const ui = await boot();
  for (const button of ui.filters.children) {
    button.onclick();
    assert.equal(button.attrs['aria-pressed'], 'true');
    const expected = data.filter(r => button.textContent === 'Etc'
      ? !r.category.split('·').some(c => ['Position','Scale','Rotation','Opacity','Effect'].includes(c.trim()))
      : r.category.split('·').map(c => c.trim()).includes(button.textContent));
    assert.equal(ui.library.children.length, expected.length - (button.textContent === 'Effect' ? 1 : 0));
    button.onclick();
    assert.equal(ui.library.children.length, data.length - 1);
  }
  ui.filters.children.find(x => x.textContent === 'Position').onclick();
  ui.search.value = 'Organic Wave'; ui.search.input();
  assert.match(text(ui.library), /검색 조건에 맞는 레시피가 없습니다/);
});
test('linked insect recipes and source-only cards remain available', async () => {
  const ui = await boot();
  ui.search.value = '벌레 속도 변형'; ui.search.input();
  assert.equal(ui.library.children.length, 3);
  for (const card of ui.library.children) assert.equal(all(card).filter(x => x.tag === 'pre').length, 3);
  ui.search.value = '비트마다'; ui.search.input();
  assert.ok(all(ui.library).some(x => x.tag === 'a'));
  assert.ok(all(ui.library).some(x => x.className === 'code-property'));
});
test('invalid metadata and network failure show load error', async () => {
  for (const ui of [await boot([{ ...data[0], requirement: 'maybe' }]), await boot(data, false)]) {
    assert.equal(ui.library.children[0].attrs.role, 'alert');
    assert.equal(ui.filters.children.length, 0);
  }
});
