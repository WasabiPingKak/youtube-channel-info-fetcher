export const TagManager = (() => {
  const STORAGE_KEY = 'categoryKeywordMapping';
  let data = [];
  let videos = [];

  function loadFromStorage() {
    const raw = localStorage.getItem(STORAGE_KEY);
    data = raw ? JSON.parse(raw) : [];
  }

  function saveToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function setVideoData(videoList) {
    videos = videoList || [];
    console.log("📦 接收影片資料（類型）:", videos.map(v => v["影片類型"]));
  }

  function getMatchedVideos(keywords) {
    return videos.filter(v =>
      keywords.some(kw => v.標題 && v.標題.toLowerCase().includes(kw.toLowerCase()))
    );
  }

  function render() {
    const container = document.getElementById('tag-manager-container');
    container.innerHTML = '';

    data.forEach((entry, index) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'category-block';

      const header = document.createElement('div');
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'category-name';
      input.value = entry.category;
      input.setAttribute('data-index', index);

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'delete-category';
      deleteBtn.setAttribute('data-index', index);
      deleteBtn.textContent = '🗑️';

      header.innerHTML = '<strong>分類：</strong>';
      header.appendChild(input);
      header.appendChild(deleteBtn);

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

      const matched = getMatchedVideos(entry.keywords);
      console.log("🧩 分類:", entry.category, "關鍵字:", entry.keywords, "命中數:", matched.length);

      const preview = document.createElement('div');
      preview.className = 'preview-block';
      if (entry.keywords.length === 0) {
        preview.textContent = '⚠️ 尚未設定關鍵字';
      } else if (matched.length === 0) {
        preview.textContent = '❌ 無命中影片';
      } else {
        preview.innerHTML = `🎯 命中 ${matched.length} 部影片： <button class='toggle-preview'>👁️ 顯示清單</button>`;
        const ul = document.createElement('ul');
        ul.className = 'preview-list';
        ul.style.display = 'none';
        matched.forEach(v => {
          const li = document.createElement('li');
          li.textContent = v.標題;
          ul.appendChild(li);
        });
        preview.appendChild(ul);
        preview.querySelector('.toggle-preview').addEventListener('click', () => {
          ul.style.display = ul.style.display === 'none' ? 'block' : 'none';
          preview.querySelector('.toggle-preview').textContent = ul.style.display === 'none' ? '👁️ 顯示清單' : '🙈 收合清單';
        });
      }

      wrapper.appendChild(header);
      wrapper.appendChild(tagList);
      wrapper.appendChild(addTagInput);
      wrapper.appendChild(preview);
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
      document.querySelectorAll('.category-name').forEach(input => {
        const idx = input.getAttribute('data-index');
        data[idx].category = input.value.trim();
      });
      saveToStorage();
      render();
      alert('已儲存分類與關鍵字設定');
    });
  }

  function init() {
    loadFromStorage();
    render();
    bindEvents();
  }

  return { init, setVideoData };
})();