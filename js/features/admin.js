(function () {
  const tableBody = document.getElementById('admin-records');
  if (!tableBody) return;

  let records = (window.CWU_COURSES || []).slice(0, 5).map((course) => ({
    title: course.title,
    category: course.category,
    status: 'Draft preview'
  }));
  let editingIndex = null;
  let pendingDelete = null;
  const search = document.getElementById('admin-search');
  const category = document.getElementById('admin-filter');
  const status = document.getElementById('admin-status');
  const editor = document.getElementById('admin-editor');
  const titleInput = document.getElementById('admin-course-title');
  const categoryInput = document.getElementById('admin-course-category');
  const editorTitle = document.getElementById('admin-editor-title');
  const saveButton = document.getElementById('admin-save');
  const viewPanel = document.getElementById('admin-view');
  let returnFocus = null;

  function setStatus(message, isError) {
    status.textContent = message;
    status.classList.toggle('error', Boolean(isError));
  }

  function actionButton(label, action, index) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'small-button';
    button.dataset.action = action;
    button.dataset.index = String(index);
    button.textContent = label;
    return button;
  }

  function render() {
    const query = search.value.trim().toLowerCase();
    const visibleRecords = records.map((record, index) => ({ record, index })).filter(({ record }) => (
      (!category.value || record.category === category.value)
      && `${record.title} ${record.category}`.toLowerCase().includes(query)
    ));
    tableBody.replaceChildren();
    visibleRecords.forEach(({ record, index }) => {
      const row = document.createElement('tr');
      [record.title, record.category, record.status].forEach((value) => {
        const cell = document.createElement('td');
        cell.textContent = value;
        row.append(cell);
      });
      const actions = document.createElement('td');
      const wrapper = document.createElement('div');
      wrapper.className = 'admin-actions';
      if (pendingDelete === index) {
        wrapper.append(
          actionButton('Confirm delete', 'confirm-delete', index),
          actionButton('Cancel', 'cancel-delete', index)
        );
      } else {
        wrapper.append(
          actionButton('View', 'view', index),
          actionButton('Edit', 'edit', index),
          actionButton('Delete', 'delete', index)
        );
      }
      actions.append(wrapper);
      row.append(actions);
      tableBody.append(row);
    });
    if (!visibleRecords.length) {
      const row = document.createElement('tr');
      const cell = document.createElement('td');
      cell.colSpan = 4;
      cell.textContent = 'No demo records match this filter.';
      row.append(cell);
      tableBody.append(row);
    }
  }

  function openEditor(record, index) {
    editingIndex = index;
    pendingDelete = null;
    viewPanel.hidden = true;
    editor.hidden = false;
    editorTitle.textContent = index === null ? 'Add demo course' : 'Edit demo course';
    saveButton.textContent = index === null ? 'Add course' : 'Save changes';
    titleInput.value = record ? record.title : '';
    categoryInput.value = record ? record.category : 'Cybersecurity';
    titleInput.focus();
    render();
  }

  document.getElementById('add-record').addEventListener('click', () => openEditor(null, null));
  document.getElementById('admin-cancel').addEventListener('click', () => {
    editor.reset();
    editor.hidden = true;
    editingIndex = null;
  });

  editor.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!editor.reportValidity()) return;
    const title = titleInput.value.trim();
    if (title.length < 3) {
      setStatus('Course title must contain at least three characters.', true);
      titleInput.focus();
      return;
    }

    if (editingIndex === null) {
      records.push({ title, category: categoryInput.value, status: 'Draft preview' });
      setStatus('Demo row added in memory only; it will be cleared when you leave or refresh.');
    } else {
      records[editingIndex] = { ...records[editingIndex], title, category: categoryInput.value };
      setStatus('Demo row edited in memory only.');
    }
    editor.reset();
    editor.hidden = true;
    editingIndex = null;
    render();
  });

  tableBody.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const index = Number(button.dataset.index);
    const record = records[index];
    if (!record) return;

    if (button.dataset.action === 'view') {
      returnFocus = button;
      document.getElementById('admin-view-title').textContent = record.title;
      document.getElementById('admin-view-category').textContent = record.category;
      document.getElementById('admin-view-status').textContent = record.status;
      viewPanel.hidden = false;
      viewPanel.querySelector('button').focus();
    } else if (button.dataset.action === 'edit') {
      openEditor(record, index);
    } else if (button.dataset.action === 'delete') {
      pendingDelete = index;
      setStatus(`Confirm deletion of "${record.title}" or cancel.`, false);
      render();
    } else if (button.dataset.action === 'confirm-delete' && pendingDelete === index) {
      records.splice(index, 1);
      pendingDelete = null;
      if (editingIndex === index) {
        editingIndex = null;
        editor.hidden = true;
      }
      setStatus('Demo row removed from this page only.');
      render();
    } else if (button.dataset.action === 'cancel-delete') {
      pendingDelete = null;
      setStatus('Deletion canceled.');
      render();
    }
  });

  document.getElementById('admin-view-close').addEventListener('click', () => {
    viewPanel.hidden = true;
    if (returnFocus && returnFocus.isConnected) returnFocus.focus();
  });
  search.addEventListener('input', render);
  category.addEventListener('change', render);
  render();
}());
