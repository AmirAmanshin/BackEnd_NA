const form = document.querySelector('.form-card form');

const bankName = document.getElementById('bank_name');
const accNum = document.getElementById('acc_num');
const cardNumber = document.getElementById('card_number');
const expDate = document.getElementById('exp_date');
const securityCode = document.getElementById('security_code');
const itemId = document.getElementById('item_id');

const reloadBtn = document.getElementById('reloadBtn');
const clearBtn = document.getElementById('clearBtn');
const deleteBtn = document.getElementById('deleteBtn');
const statusText = document.getElementById('statusText');
const itemsBody = document.getElementById('itemsBody');

function payloadFromForm() {
  return {
    bank_name: bankName.value.trim(),
    acc_num: accNum.value.trim(),
    card_number: cardNumber.value.trim(),
    exp_date: expDate.value.trim(),
    security_code: securityCode.value.trim()
  };
}

function fillForm(x) {
  bankName.value = x.bank_name || '';
  accNum.value = x.acc_num || '';
  cardNumber.value = x.card_number || '';
  expDate.value = x.exp_date || '';
  securityCode.value = x.security_code || '';
}

function resetSelection() {
  itemId.value = '';
  deleteBtn.disabled = true;
}

async function requestJson(url, options) {
  const res = await fetch(url, options);
  const text = await res.text();

  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch {}

  if (!res.ok) {
    const msg = (data && (data.error || data.message)) || text || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

async function loadItems() {
  statusText.textContent = 'Loading...';
  const list = await requestJson('/api/items');
  renderItems(Array.isArray(list) ? list : []);
  statusText.textContent = `${(Array.isArray(list) ? list.length : 0)} item(s)`;
}

function renderItems(list) {
  itemsBody.innerHTML = '';

  for (const it of list) {
    const tr = document.createElement('tr');

    const td1 = document.createElement('td'); td1.textContent = it.bank_name ?? '';
    const td2 = document.createElement('td'); td2.textContent = it.acc_num ?? '';
    const td3 = document.createElement('td'); td3.textContent = it.card_number ?? '';
    const td4 = document.createElement('td'); td4.textContent = it.exp_date ?? '';
    const td5 = document.createElement('td'); td5.textContent = it.security_code ?? '';

    const td6 = document.createElement('td');
    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'btn btn-outline-secondary btn-sm';
    editBtn.textContent = 'Edit';

    editBtn.addEventListener('click', () => {
      itemId.value = it._id;
      fillForm(it);
      deleteBtn.disabled = false;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    td6.appendChild(editBtn);

    tr.appendChild(td1);
    tr.appendChild(td2);
    tr.appendChild(td3);
    tr.appendChild(td4);
    tr.appendChild(td5);
    tr.appendChild(td6);

    itemsBody.appendChild(tr);
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const id = itemId.value.trim();
  const payload = payloadFromForm();

  try {
    if (id) {
      await requestJson(`/api/items/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } else {
      await requestJson('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }

    resetSelection();
    await loadItems();
  } catch (err) {
    alert(err.message || 'Error');
  }
});

reloadBtn.addEventListener('click', () => {
  loadItems().catch(err => alert(err.message || 'Error'));
});

clearBtn.addEventListener('click', () => {
  fillForm({});
  resetSelection();
});

deleteBtn.addEventListener('click', async () => {
  const id = itemId.value.trim();
  if (!id) return;

  try {
    await requestJson(`/api/items/${encodeURIComponent(id)}`, { method: 'DELETE' });
    fillForm({});
    resetSelection();
    await loadItems();
  } catch (err) {
    alert(err.message || 'Error');
  }
});

loadItems().catch(err => alert(err.message || 'Error'));
