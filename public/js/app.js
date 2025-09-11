class CharacterSelector {
    constructor() {
        this.selectedChars = [];
        this.allChars = []; // 用于存储从API获取的所有汉字
        this.maxSelection = 10;
        this.init(); // 启动初始化流程
    }

    async init() {
        this.initializeElements();
        const ok = await this.fetchCharacters();
        if (!ok) {
            // 失败时仅隐藏加载层并停止后续渲染，避免清空错误提示
            this.hideLoader();
            return;
        }
        this.renderCharGrid();
        this.bindEvents();
        this.restoreState(); // 确保在绑定事件后调用
        this.updateUI();
        this.applyPagination();
        this.hideLoader(); // 所有任务完成后隐藏加载动画
    }

    initializeElements() {
        this.loader = document.getElementById('loader-overlay');
        this.selectedDisplay = document.getElementById('selected-display');
        this.selectedCount = document.getElementById('selected-count');
        this.clearAllBtn = document.getElementById('clear-all');
        this.printDirectBtn = document.getElementById('print-direct');
        this.searchInput = document.getElementById('search-input');
        this.gridSizeSelect = document.getElementById('grid-size');
        this.charGrid = document.getElementById('char-grid');
        this.filterButtons = document.querySelectorAll('.filter-btn');
        this.customInput = document.getElementById('custom-input');
        this.addCustomBtn = document.getElementById('add-custom');
        this.useAnimalsCheckbox = document.getElementById('use-animals');
        this.pagination = { page: 1, pageSize: 100 };
        this.prevPageBtn = document.getElementById('prev-page');
        this.nextPageBtn = document.getElementById('next-page');
        this.pageInfo = document.getElementById('page-info');
    }

    hideLoader() {
        if (this.loader) {
            this.loader.classList.add('hidden');
        }
    }

    async fetchCharacters() {
        try {
            const response = await fetch('/api/chars', { headers: { 'Accept': 'application/json' } });
            if (!response.ok) throw new Error('Failed to fetch characters: ' + response.status);
            const data = await response.json();
            if (!Array.isArray(data) || data.length === 0) {
                throw new Error('Empty or invalid character data');
            }
            this.allChars = data;
            return true;
        } catch (error) {
            console.error('Error fetching characters:', error);
            this.allChars = [];
            if (this.charGrid) {
                this.charGrid.innerHTML = '<p style="color: red; text-align: center;">汉字加载失败或数据为空，请刷新页面或稍后重试。</p>';
            }
            return false;
        }
    }

    renderCharGrid() {
        this.charGrid.innerHTML = ''; // 清空容器
        const fragment = document.createDocumentFragment();
        this.allChars.forEach((char, index) => {
            const item = document.createElement('div');
            item.className = 'char-item';
            item.dataset.char = char;
            item.dataset.index = index;
            item.textContent = char;
            fragment.appendChild(item);
        });
        this.charGrid.appendChild(fragment);
        // 重新获取动态生成的DOM元素
        this.charItems = this.charGrid.querySelectorAll('.char-item');
    }

    bindEvents() {
        this.charGrid.addEventListener('click', (e) => {
            const item = e.target.closest('.char-item');
            if (!item || item.classList.contains('disabled') || item.classList.contains('hidden')) return;
            this.toggleCharacter(item.dataset.char);
        });

        this.clearAllBtn.addEventListener('click', () => this.clearAll());
        this.printDirectBtn.addEventListener('click', () => this.printDirect());
        
        if (this.gridSizeSelect) {
            this.gridSizeSelect.addEventListener('change', () => this.persistState());
        }

        this.searchInput.addEventListener('input', (e) => {
            this.filterCharacters(e.target.value);
            this.pagination.page = 1;
            this.applyPagination();
        });

        this.filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setActiveFilter(e.target);
                this.applyFilter(e.target.dataset.filter);
                this.pagination.page = 1;
                this.applyPagination();
            });
        });

        this.selectedDisplay.addEventListener('click', (e) => {
            if (e.target.classList.contains('selected-char')) {
                this.removeCharacter(e.target.textContent);
            }
        });

        if (this.addCustomBtn && this.customInput) {
            this.addCustomBtn.addEventListener('click', () => this.addCustomCharacters());
            this.customInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.addCustomCharacters();
                }
            });
        }

        if (this.useAnimalsCheckbox) {
            this.useAnimalsCheckbox.addEventListener('change', () => this.persistState());
        }

        if (this.prevPageBtn && this.nextPageBtn) {
            this.prevPageBtn.addEventListener('click', () => this.goToPage(this.pagination.page - 1));
            this.nextPageBtn.addEventListener('click', () => this.goToPage(this.pagination.page + 1));
        }
    }

    toggleCharacter(char) {
        if (this.selectedChars.some(c => c.char === char)) {
            this.removeCharacter(char);
        } else {
            this.addCharacter(char);
        }
    }

    addCharacter(char) {
        if (this.selectedChars.length >= this.maxSelection) {
            // 优化提示方式，避免使用 alert
            this.showToast('最多只能选择' + this.maxSelection + '个汉字');
            return;
        }
        
        if (!this.selectedChars.some(c => c.char === char)) {
            this.selectedChars.push({ char, lines: 1 });
            this.updateUI();
            this.persistState();
        }
    }

    removeCharacter(char) {
        const index = this.selectedChars.findIndex(c => c.char === char);
        if (index > -1) {
            this.selectedChars.splice(index, 1);
            this.updateUI();
            this.persistState();
        }
    }

    clearAll() {
        this.selectedChars = [];
        this.updateUI();
        this.persistState();
    }

    updateUI() {
        this.selectedCount.textContent = this.selectedChars.length;

        this.selectedDisplay.innerHTML = '';
        this.selectedChars.forEach(item => {
            const wrap = document.createElement('div');
            wrap.className = 'selected-char-wrap';
            const charElement = document.createElement('div');
            charElement.className = 'selected-char';
            charElement.textContent = item.char;
            charElement.title = '点击移除';
            wrap.appendChild(charElement);
            this.selectedDisplay.appendChild(wrap);
        });

        this.charItems.forEach(item => {
            const char = item.dataset.char;
            const isSelected = this.selectedChars.some(c => c.char === char);
            item.classList.toggle('selected', isSelected);
            const isMaxed = this.selectedChars.length >= this.maxSelection;
            item.classList.toggle('disabled', isMaxed && !isSelected);
        });

        this.printDirectBtn.disabled = this.selectedChars.length === 0;
    }

    filterCharacters(searchTerm) {
        const term = searchTerm.toLowerCase().trim();
        this.charItems.forEach(item => {
            const char = item.dataset.char;
            const isMatch = term === '' || char.includes(term);
            item.classList.toggle('hidden', !isMatch);
        });
    }

    setActiveFilter(activeBtn) {
        this.filterButtons.forEach(btn => btn.classList.remove('active'));
        activeBtn.classList.add('active');
    }

    applyFilter(filterType) {
        const basicLimit = 100;
        const commonLimit = 500;

        this.charItems.forEach((item, index) => {
            let isVisible = true;
            switch(filterType) {
                case 'basic':
                    if (index >= basicLimit) isVisible = false;
                    break;
                case 'common':
                    if (index < basicLimit || index >= commonLimit) isVisible = false;
                    break;
                case 'all':
                default:
                    break;
            }
            item.classList.toggle('hidden', !isVisible);
        });

        if (this.searchInput.value.trim()) {
            this.filterCharacters(this.searchInput.value);
        }
    }

    applyPagination() {
        const visible = Array.from(this.charItems).filter(el => !el.classList.contains('hidden'));
        const total = visible.length;
        const pageSize = this.pagination.pageSize;
        const totalPages = Math.max(1, Math.ceil(total / pageSize));
        
        if (this.pagination.page > totalPages) this.pagination.page = totalPages;
        if (this.pagination.page < 1) this.pagination.page = 1;
        
        const start = (this.pagination.page - 1) * pageSize;
        const end = start + pageSize;

        this.charItems.forEach(el => el.classList.remove('page-hidden'));
        visible.forEach((el, i) => {
            el.classList.toggle('page-hidden', i < start || i >= end);
        });

        if (this.pageInfo) {
            this.pageInfo.textContent = `第 ${this.pagination.page}/${totalPages} 页（共 ${total} 个字）`;
        }
        if (this.prevPageBtn) this.prevPageBtn.disabled = this.pagination.page <= 1;
        if (this.nextPageBtn) this.nextPageBtn.disabled = this.pagination.page >= totalPages;
    }

    goToPage(page) {
        this.pagination.page = page;
        this.applyPagination();
    }

    async printDirect() {
        if (this.selectedChars.length === 0) {
            this.showToast('请先选择汉字');
            return;
        }

        const data = {
            selectedChars: this.selectedChars,
            gridSize: this.gridSizeSelect ? this.gridSizeSelect.value : 'medium',
            useAnimals: this.useAnimalsCheckbox ? this.useAnimalsCheckbox.checked : true,
        };

        try {
            const response = await fetch('/print', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!response.ok) throw new Error(`Server responded with status ${response.status}`);

            const html = await response.text();
            const printWindow = window.open('', '_blank');
            printWindow.document.write(html);
            printWindow.document.close();
            
            // 等待资源加载完成再打印
            printWindow.onload = () => {
                printWindow.print();
                // 延迟关闭以确保打印对话框正常弹出
                setTimeout(() => printWindow.close(), 500);
            };

        } catch (error) {
            console.error('Printing failed:', error);
            this.showToast('生成打印页失败，请稍后重试。');
        }
    }

    persistState() {
        // 功能已移除
    }

    restoreState() {
        // 功能已移除，保持默认状态
        this.selectedChars = [];
    }

    addCustomCharacters() {
        const val = ((this.customInput && this.customInput.value) || '').trim();
        if (!val) return;
        
        const chars = Array.from(val.replace(/[
\s,.;，。、《》〈〉\-_/|\\]+/g, ''));
        let addedCount = 0;
        
        for (const ch of chars) {
            if (this.selectedChars.length >= this.maxSelection) break;
            if (!ch || !/^[\u4E00-\u9FFFa-zA-Z0-9.,;，。、《》〈〉\-_/|\\]$/u.test(ch)) continue;
            
            if (!this.selectedChars.some(c => c.char === ch)) {
                this.selectedChars.push({ char: ch, lines: 1 });
                addedCount++;
            }
        }

        if (addedCount === 0) {
            this.showToast('没有可添加的新字（可能已满或重复）');
        }
        
        this.customInput.value = '';
        this.updateUI();
        this.persistState();
    }

    // 优化：使用页面内提示代替 alert
    showToast(message) {
        let toast = document.querySelector('.toast-notification');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'toast-notification';
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new CharacterSelector();
});
