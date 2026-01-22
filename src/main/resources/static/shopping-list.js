const form = document.getElementById('addForm');
const listEl = document.getElementById('list');
const emptyState = document.getElementById('emptyState');
const categoryChips = document.getElementById('categoryChips');
const imageInput = document.getElementById('imageInput');
const imageButton = document.getElementById('imageButton');
const imagePreview = document.getElementById('imagePreview');

const STORAGE_KEY = 'shopping-items';
const CATEGORIES = ['Clothing', 'Sneaker', 'Figure', 'Car', 'Lego'];

let items = [];
let selectedCategory = CATEGORIES[0];
let pendingImageData = null;

function saveToStorage() { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

function setChipState(container, activeCat, onSelect) {
  container.innerHTML = '';
  CATEGORIES.forEach(cat => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = `chip ${cat === activeCat ? 'active' : ''}`;
    chip.textContent = cat;
    chip.addEventListener('click', () => onSelect(cat));
    container.appendChild(chip);
  });
}

function updateFormCategory(cat) {
  selectedCategory = cat;
  setChipState(categoryChips, selectedCategory, updateFormCategory);
}

setChipState(categoryChips, selectedCategory, updateFormCategory);

function setImagePreview(dataUrl) {
  imagePreview.innerHTML = '';
  if (dataUrl) {
    const img = document.createElement('img');
    img.src = dataUrl;
    imagePreview.appendChild(img);
  } else {
    imagePreview.innerHTML = '<span class="text-[10px] text-white/50">No image</span>';
  }
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

imageButton.addEventListener('click', () => imageInput.click());
imageInput.addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const data = await fileToDataUrl(file);
  pendingImageData = data;
  setImagePreview(data);
});

async function fetchItemsFromServer() {
  try {
    const res = await fetch('/products');
    if (!res.ok) throw new Error('Failed to load');
    const data = await res.json();
    return (data || []).map(p => ({
      id: p.id ?? null,
      name: p.name,
      brand: p.brand,
      category: p.category,
      price: p.price,
      description: p.description,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      imageData: null,
      done: false
    }));
  } catch (e) {
    console.error('Load failed', e);
    return [];
  }
}

async function bootstrap() {
  const cached = loadFromStorage();
  if (cached && Array.isArray(cached)) {
    items = cached;
    render();
    return;
  }
  items = await fetchItemsFromServer();
  saveToStorage();
  render();
}

function badgeFor(cat) {
  const span = document.createElement('span');
  span.className = 'badge';
  span.textContent = cat || 'Unlabeled';
  return span;
}

function renderListItem(item, idx) {
  const li = document.createElement('li');
  li.className = 'item-row card flex items-start gap-4 px-4 py-3 rounded-[10px] transition duration-200 hover:border-[#E9FD87]/70';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = item.done;
  checkbox.className = 'mt-1 h-5 w-5 accent-[#E9FD87] border border-white/30 bg-transparent';
  checkbox.addEventListener('change', () => {
    items[idx].done = checkbox.checked;
    saveToStorage();
    render();
  });

  const preview = document.createElement('div');
  preview.className = 'image-pill shrink-0';
  if (item.imageData) {
    const img = document.createElement('img');
    img.src = item.imageData;
    preview.appendChild(img);
  } else {
    const fallback = document.createElement('div');
    fallback.className = 'text-[10px] text-white/50';
    fallback.textContent = 'No image';
    preview.appendChild(fallback);
  }

  const main = document.createElement('div');
  main.className = 'flex-1 space-y-2';

  if (item.editing) {
    const nameInput = document.createElement('input');
    nameInput.className = 'input-field w-full';
    nameInput.value = item.draftName ?? item.name;
    nameInput.placeholder = 'Item name';
    nameInput.addEventListener('input', (ev) => {
      items[idx].draftName = ev.target.value;
    });

    const chipsWrap = document.createElement('div');
    chipsWrap.className = 'flex flex-wrap gap-2';
    setChipState(chipsWrap, item.draftCategory ?? item.category, (cat) => {
      items[idx].draftCategory = cat;
      setChipState(chipsWrap, cat, () => {});
    });

    const editImageWrap = document.createElement('div');
    editImageWrap.className = 'flex items-center gap-3';
    const editPill = document.createElement('div');
    editPill.className = 'image-pill';
    const currentImage = item.draftImageData ?? item.imageData;
    if (currentImage) {
      const img = document.createElement('img');
      img.src = currentImage;
      editPill.appendChild(img);
    } else {
      const t = document.createElement('span');
      t.className = 'text-[10px] text-white/50';
      t.textContent = 'No image';
      editPill.appendChild(t);
    }
    const editFileInput = document.createElement('input');
    editFileInput.type = 'file';
    editFileInput.accept = 'image/*';
    editFileInput.className = 'hidden';
    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'inline-flex items-center justify-center rounded-none border border-white/20 px-4 py-2 text-xs tracking-[0.2em] text-white/80 hover:border-[#E9FD87] hover:text-[#E9FD87]';
    editBtn.textContent = 'CHOOSE IMAGE';
    editBtn.addEventListener('click', () => editFileInput.click());
    editFileInput.addEventListener('change', async (ev) => {
      const f = ev.target.files?.[0];
      if (!f) return;
      const data = await fileToDataUrl(f);
      items[idx].draftImageData = data;
      render();
    });
    editImageWrap.append(editPill, editFileInput, editBtn);

    const actionRow = document.createElement('div');
    actionRow.className = 'flex gap-2 pt-2';
    const saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.className = 'inline-flex items-center justify-center rounded-none border border-[#E9FD87]/70 bg-[#E9FD87] px-4 py-2 text-xs font-semibold tracking-[0.2em] text-black';
    saveBtn.textContent = 'SAVE';
    saveBtn.addEventListener('click', () => {
      const nextName = (item.draftName ?? item.name).trim();
      if (!nextName) return;
      items[idx] = {
        ...item,
        name: nextName,
        category: item.draftCategory ?? item.category,
        imageData: item.draftImageData ?? item.imageData ?? null,
        editing: false,
        draftName: undefined,
        draftCategory: undefined,
        draftImageData: undefined
      };
      saveToStorage();
      render();
    });
    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'inline-flex items-center justify-center rounded-none border border-white/20 px-4 py-2 text-xs tracking-[0.2em] text-white/70 hover:border-white/40';
    cancelBtn.textContent = 'CANCEL';
    cancelBtn.addEventListener('click', () => {
      items[idx].editing = false;
      items[idx].draftName = undefined;
      items[idx].draftCategory = undefined;
      items[idx].draftImageData = undefined;
      render();
    });
    actionRow.append(saveBtn, cancelBtn);

    main.append(nameInput, chipsWrap, editImageWrap, actionRow);
  } else {
    const topRow = document.createElement('div');
    topRow.className = 'flex items-center gap-3 flex-wrap';
    const title = document.createElement('div');
    title.textContent = item.name;
    title.className = `text-base text-white tracking-wide ${item.done ? 'line-through text-white/40' : ''}`;
    topRow.append(title, badgeFor(item.category));

    const meta = document.createElement('div');
    meta.className = 'text-xs text-white/50 mono';
    meta.textContent = `${item.brand || '—'} · $${Number(item.price || 0).toFixed(2)}`;

    const desc = document.createElement('div');
    desc.className = 'text-xs text-white/40';
    desc.textContent = item.description || '';

    main.append(topRow, meta, desc);
  }

  const actions = document.createElement('div');
  actions.className = 'item-actions flex items-center gap-2';
  const iconBase = 'p-2 border border-white/20 text-white/60 hover:text-[#E9FD87] hover:border-[#E9FD87] transition rounded-none';

  if (!item.editing) {
    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = iconBase;
    editBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.862 4.487z"/></svg>`;
    editBtn.addEventListener('click', () => {
      items = items.map((it, i) => i === idx ? { ...it, editing: true, draftName: it.name, draftCategory: it.category, draftImageData: it.imageData } : { ...it, editing: false, draftName: undefined, draftCategory: undefined, draftImageData: undefined });
      render();
    });
    actions.appendChild(editBtn);
  }

  // Delete button: if item has backend id, call DELETE /products/{id}; otherwise remove locally
  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = iconBase;
  deleteBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 7h12M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m-1 4v6m-4-6v6m-7 4h12a2 2 0 002-2V7H5v12a2 2 0 002 2z"/></svg>`;
  deleteBtn.addEventListener('click', async () => {
    // confirm deletion
    const ok = confirm('Delete this item?');
    if (!ok) return;

    // If item has an `id`, attempt backend deletion first
    if (item.id) {
      try {
        const res = await fetch(`/products/${item.id}`, { method: 'DELETE' });
        if (res.ok) {
          // remove locally
          items = items.filter((_, i) => i !== idx);
          saveToStorage();
          render();
          return;
        } else if (res.status === 404) {
          alert('Item not found on server; removing locally.');
          items = items.filter((_, i) => i !== idx);
          saveToStorage();
          render();
          return;
        } else {
          // other server error
          const text = await res.text();
          console.error('Delete failed', res.status, text);
          alert('Server error deleting item. See console.');
          return;
        }
      } catch (e) {
        console.warn('Backend unavailable, deleting locally', e);
        // fallback: delete locally
        items = items.filter((_, i) => i !== idx);
        saveToStorage();
        render();
        return;
      }
    }

    // No backend id: just delete locally
    items = items.filter((_, i) => i !== idx);
    saveToStorage();
    render();
  });

  actions.appendChild(deleteBtn);

  li.append(checkbox, preview, main, actions);
  return li;
}

// Try to create item on server; updates item id on success
async function createOnServer(itemIndex) {
  const item = items[itemIndex];
  try {
    const payload = {
      id: null,
      name: item.name,
      brand: item.brand,
      category: item.category,
      price: Number(item.price || 0),
      description: item.description || '',
      createdAt: null,
      updatedAt: null,
      imageFileName: null
    };
    const res = await fetch('/products/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('create failed');
    const created = await res.json();
    // update local item with server id and timestamps
    items[itemIndex].id = created.id ?? items[itemIndex].id;
    items[itemIndex].createdAt = created.createdAt ?? items[itemIndex].createdAt;
    items[itemIndex].updatedAt = created.updatedAt ?? items[itemIndex].updatedAt;
    saveToStorage();
    render();
  } catch (e) {
    console.warn('Could not create item on server, kept local only', e);
  }
}

function render() {
  listEl.innerHTML = '';
  if (items.length === 0) {
    emptyState.classList.remove('hidden');
    return;
  }
  emptyState.classList.add('hidden');

  items.forEach((item, idx) => {
    listEl.appendChild(renderListItem(item, idx));
  });
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(form);
  const name = fd.get('name')?.trim();
  if (!name) return;
  const newItem = {
    id: null,
    name,
    brand: fd.get('brand')?.toString() || '',
    category: selectedCategory,
    price: Number(fd.get('price') || 0),
    description: fd.get('description')?.toString() || '',
    imageData: pendingImageData,
    done: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  items.unshift(newItem);
  saveToStorage();

  // attempt to create on server; update id if successful
  createOnServer(0);

  form.reset();
  pendingImageData = null;
  setImagePreview(null);
  updateFormCategory(CATEGORIES[0]);
  render();
});

form.addEventListener('reset', () => {
  pendingImageData = null;
  setImagePreview(null);
  updateFormCategory(CATEGORIES[0]);
});

bootstrap();
