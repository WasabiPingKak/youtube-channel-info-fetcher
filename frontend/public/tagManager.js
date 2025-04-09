// tagManager.js - 管理分類與關鍵字標籤

export const TagManager = (() => {
    const STORAGE_KEY = 'categoryKeywordMapping';
    let data = [];

    function loadFromStorage() {
      const raw = localStorage.getItem(STORAGE_KEY);
      data = raw ? JSON.parse(raw) : [];
    }

    function saveToStorage() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    function render() {
      const container = document.getElementById('tag-manager-container');
      container.innerHTML = '';

      data.forEach((entry, index) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'category-block';

        const header = document.createElement('div');
        header.innerHTML = `<strong>分類：</strong>
          <input type="text" class="category-name" value="${entry.category}" data-index="${index}" />
          <button class="delete-category" data-index="${index}">🗑️</button>`;

        const tagList = document.createElement('div');
        tagList.className = 'tag-list';
        entry.keywords.forEach((tag, tagIndex) => {
          const span = document.createElement('span');
          span.className = 'tag';
          span.innerHTML = `${tag} <button class="remove-tag" data-cat="${index}" data-tag="${tagIndex}">x</button>`;
          tagList.appendChild(span);
        });

        const addTagInput = document.createElement('input');
        addTagInput.className = 'add-tag-input';
        addTagInput.placeholder = '新增關鍵字後按 Enter';
        addTagInput.setAttribute('data-index', index);

        wrapper.appendChild(header);
        wrapper.appendChild(tagList);
        wrapper.appendChild(addTagInput);
        container.appendChild(wrapper);
      });
    }

    function bindEvents() {
      const container = document.getElementById('tag-manager-container');

      container.addEventListener('keydown', (e) => {
        if (e.target.classList.contains('add-tag-input') && e.key === 'Enter') {
          const index = e.target.getAttribute('data-index');
          const value = e.target.value.trim();
          if (value) {
            data[index].keywords.push(value);
            e.target.value = '';
            saveToStorage();
            render();
          }
        }
      });

      container.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-tag')) {
          const catIndex = e.target.getAttribute('data-cat');
          const tagIndex = e.target.getAttribute('data-tag');
          data[catIndex].keywords.splice(tagIndex, 1);
          saveToStorage();
          render();
        } else if (e.target.classList.contains('delete-category')) {
          const index = e.target.getAttribute('data-index');
          data.splice(index, 1);
          saveToStorage();
          render();
        }
      });

      document.getElementById('add-category').addEventListener('click', () => {
        data.push({ category: '新分類', keywords: [] });
        saveToStorage();
        render();
      });

      document.getElementById('save-category-data').addEventListener('click', () => {
        // category 名稱變更儲存
        document.querySelectorAll('.category-name').forEach(input => {
          const idx = input.getAttribute('data-index');
          data[idx].category = input.value.trim();
        });
        saveToStorage();
        alert('已儲存分類與關鍵字設定');
      });
    }

    function init() {
      loadFromStorage();
      render();
      bindEvents();
    }

    return { init };
  })();
