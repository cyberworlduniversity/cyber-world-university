(function () {
  const search = document.getElementById('material-search');
  const category = document.getElementById('material-category');
  const materials = Array.from(document.querySelectorAll('.material-card'));
  const count = document.getElementById('material-count');
  const empty = document.getElementById('materials-empty');
  if (!search || !category || !count || !empty) return;

  function filterMaterials() {
    const query = search.value.trim().toLowerCase();
    let visible = 0;
    materials.forEach((card) => {
      const matches = (!category.value || card.dataset.category === category.value)
        && card.textContent.toLowerCase().includes(query);
      card.hidden = !matches;
      if (matches) visible += 1;
    });
    count.textContent = `${visible} ${visible === 1 ? 'resource' : 'resources'} found.`;
    empty.hidden = visible !== 0;
  }

  search.addEventListener('input', filterMaterials);
  category.addEventListener('change', filterMaterials);
  filterMaterials();
}());
