class CharacterSelector {
    constructor() {
        this.selectedChars = [];
        this.maxSelection = 10;
        this.initializeElements();
        this.restoreState();
        this.bindEvents();
        this.updateUI();
    }

    initializeElements() {
        this.selectedDisplay = document.getElementById('selected-display');
        this.selectedCount = document.getElementById('selected-count');
        this.clearAllBtn = document.getElementById('clear-all');
        this.printDirectBtn = document.getElementById('print-direct');
        this.searchInput = document.getElementById('search-input');
        this.gridSizeSelect = document.getElementById('grid-size');
        this.charGrid = document.getElementById('char-grid');
        this.filterButtons = document.querySelectorAll('.filter-btn');
        this.charItems = document.querySelectorAll('.char-item');
        this.customInput = document.getElementById('custom-input');
        this.addCustomBtn = document.getElementById('add-custom');
        this.useAnimalsCheckbox = document.getElementById('use-animals');
    }

    bindEvents() {
        // 汉字选择事件（事件委托）
        this.charGrid.addEventListener('click', (e) => {
            const item = e.target.closest('.char-item');
            if (!item || item.classList.contains('disabled') || item.classList.contains('hidden')) return;
            const char = item.dataset.char;
            this.toggleCharacter(char);
        });

        // 清空所有按钮
        this.clearAllBtn.addEventListener('click', () => {
            this.clearAll();
        });

        // 直接打印按钮
        this.printDirectBtn.addEventListener('click', () => {
            this.printDirect();
        });

        // 字号变化（影响每行米字格数量）
        if (this.gridSizeSelect) {
            this.gridSizeSelect.addEventListener('change', () => {
                this.persistState();
            });
        }

        // 搜索功能
        this.searchInput.addEventListener('input', (e) => {
            this.filterCharacters(e.target.value);
        });

        // 筛选按钮
        this.filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setActiveFilter(e.target);
                this.applyFilter(e.target.dataset.filter);
            });
        });

        // 点击已选择的汉字来移除
        this.selectedDisplay.addEventListener('click', (e) => {
            if (e.target.classList.contains('selected-char')) {
                const char = e.target.textContent;
                this.removeCharacter(char);
            }
        });

        // 取消多行练字：不再提供每字行数选择

        // 自定义输入：点击按钮或按回车添加
        if (this.addCustomBtn && this.customInput) {
            this.addCustomBtn.addEventListener('click', () => this.addCustomCharacters());
            this.customInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.addCustomCharacters();
                }
            });
        }

        // 顶部装饰选项
        if (this.useAnimalsCheckbox) {
            this.useAnimalsCheckbox.addEventListener('change', () => this.persistState());
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
            alert(`最多只能选择${this.maxSelection}个汉字`);
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
        // 更新计数
        this.selectedCount.textContent = this.selectedChars.length;

        // 更新已选择显示区域
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

        // 更新汉字网格状态
        this.charItems.forEach(item => {
            const char = item.dataset.char;
            if (this.selectedChars.some(c => c.char === char)) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }

            // 禁用状态
            if (this.selectedChars.length >= this.maxSelection && !this.selectedChars.some(c => c.char === char)) {
                item.classList.add('disabled');
            } else {
                item.classList.remove('disabled');
            }
        });

        // 更新按钮状态
        const hasSelection = this.selectedChars.length > 0;
        this.printDirectBtn.disabled = !hasSelection;
    }

    filterCharacters(searchTerm) {
        const term = searchTerm.toLowerCase().trim();
        this.charItems.forEach(item => {
            const char = item.dataset.char;
            if (term === '' || char.includes(term)) {
                item.classList.remove('hidden');
            } else {
                item.classList.add('hidden');
            }
        });
    }

    setActiveFilter(activeBtn) {
        this.filterButtons.forEach(btn => btn.classList.remove('active'));
        activeBtn.classList.add('active');
    }

    applyFilter(filterType) {
        this.charItems.forEach((item, index) => {
            item.classList.remove('hidden');
            
            switch(filterType) {
                case 'basic':
                    if (index >= 100) item.classList.add('hidden');
                    break;
                case 'common':
                    if (index < 100 || index >= 500) item.classList.add('hidden');
                    break;
                case 'all':
                default:
                    // 显示所有
                    break;
            }
        });

        // 如果有搜索词，重新应用搜索过滤
        if (this.searchInput.value.trim()) {
            this.filterCharacters(this.searchInput.value);
        }
    }


    async printDirect() {
        if (this.selectedChars.length === 0) {
            alert('请先选择汉字');
            return;
        }

        const printWindow = window.open('', '_blank');
        const html = this.generatePrintHTML();
        
        printWindow.document.write(html);
        printWindow.document.close();
        
        printWindow.onload = () => {
            printWindow.print();
            printWindow.close();
        };
    }

    persistState() {
        // 不再持久化：刷新页面即清空选择与选项
        try {
            localStorage.removeItem('selectedChars_v2');
            localStorage.removeItem('selectedChars');
            localStorage.removeItem('gridSize');
            localStorage.removeItem('useAnimals');
        } catch (_) { /* ignore */ }
    }

    restoreState() {
        // 刷新即重置：清空本地存储并使用默认值
        try {
            localStorage.removeItem('selectedChars_v2');
            localStorage.removeItem('selectedChars');
            localStorage.removeItem('gridSize');
            localStorage.removeItem('useAnimals');
        } catch (_) { /* ignore */ }
        this.selectedChars = [];
        // gridSize 和 useAnimals 不从本地恢复，保持页面默认
    }

    // 将自定义输入的字逐个加入选择
    addCustomCharacters() {
        const val = (this.customInput?.value || '').trim();
        if (!val) return;
        // 提取字符（去空白和常见分隔符），逐字符处理
        const chars = Array.from(val.replace(/[\s,.;，。、《》〈〉\-_/|\\]+/g, ''));
        let added = 0;
        for (const ch of chars) {
            if (this.selectedChars.length >= this.maxSelection) break;
            if (!ch) continue;
            // 过滤非常规字符（保留中日韩及常用符号），避免奇怪空白
            if (/^[\p{sc=Han}\p{N}\p{L}\p{P}]$/u.test(ch)) {
                if (!this.selectedChars.some(c => c.char === ch)) {
                    this.selectedChars.push({ char: ch, lines: 1 });
                    added++;
                }
            }
        }
        if (added === 0) {
            alert('没有可添加的新字（可能已满或重复）');
        }
        this.customInput.value = '';
        this.updateUI();
        this.persistState();
    }

    generatePrintHTML() {
        const charsPerRow = 1; // 一行一个字
        const size = this.gridSizeSelect ? this.gridSizeSelect.value : 'medium';
        const cfg = size === 'large' ? { gridPx: 100, perLine: 6 } : size === 'small' ? { gridPx: 60, perLine: 10 } : { gridPx: 80, perLine: 8 };
        const gridPx = cfg.gridPx;
        const practicePerLine = cfg.perLine;

        // 每个字单独一行
        const rows = [];
        for (let i = 0; i < this.selectedChars.length; i += charsPerRow) {
            rows.push(this.selectedChars.slice(i, i + charsPerRow));
        }
        
        const rowsHTML = rows.map((chars, rowIndex) => `
            <div class="char-row" style="margin-bottom: ${charsPerRow === 1 ? '15px' : charsPerRow === 2 ? '10px' : '8px'};">
                ${chars.map((item, charIndex) => `
                    <div class="char-section">
                        <div class="char-info" style="width:${gridPx}px;">
                            <div class="grid-container reference">
                                <div class="char-example" style="font-size:${Math.round(gridPx*0.8)}px;">${item.char}</div>
                                <svg class="grid" width="${gridPx}" height="${gridPx}" viewBox="0 0 100 100">
                                    <rect x="0" y="0" width="100" height="100" fill="none" stroke="#444" stroke-width="1.6"/>
                                    <line x1="50" y1="0" x2="50" y2="100" stroke="#aaa" stroke-width="0.9" stroke-dasharray="4,2"/>
                                    <line x1="0" y1="50" x2="100" y2="50" stroke="#aaa" stroke-width="0.9" stroke-dasharray="4,2"/>
                                    <line x1="0" y1="0" x2="100" y2="100" stroke="#ccc" stroke-width="0.7" stroke-dasharray="2,2"/>
                                    <line x1="0" y1="100" x2="100" y2="0" stroke="#ccc" stroke-width="0.7" stroke-dasharray="2,2"/>
                                </svg>
                            </div>
                            
                        </div>
                        <div class="practice-grids">
                            <div class="practice-row">
                                ${Array(practicePerLine).fill(0).map((_, i) => `
                                    <div class="practice-item">
                                        <svg class="grid" width="${gridPx}" height="${gridPx}" viewBox="0 0 100 100">
                                            <rect x="0" y="0" width="100" height="100" fill="none" stroke="#444" stroke-width="1.6"/>
                                            <line x1="50" y1="0" x2="50" y2="100" stroke="#aaa" stroke-width="0.9" stroke-dasharray="4,2" opacity="0.95"/>
                                            <line x1="0" y1="50" x2="100" y2="50" stroke="#aaa" stroke-width="0.9" stroke-dasharray="4,2" opacity="0.95"/>
                                            <line x1="0" y1="0" x2="100" y2="100" stroke="#ccc" stroke-width="0.7" stroke-dasharray="2,2" opacity="0.8"/>
                                            <line x1="0" y1="100" x2="100" y2="0" stroke="#ccc" stroke-width="0.7" stroke-dasharray="2,2" opacity="0.8"/>
                                        </svg>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `).join('');

        const currentDate = new Date().toLocaleDateString('zh-CN');
        const useAnimals = this.useAnimalsCheckbox ? !!this.useAnimalsCheckbox.checked : true;
        const animals = ['🐼','🐰','🐯','🦊','🐱','🐶','🐨','🦁','🐷','🐵'];
        // 安全生成页眉（避免转义导致的属性异常）
        const headerInnerSafe = useAnimals
            ? `<div class=\"animal-row\" aria-label=\"decorative animals\">${animals.map(a => '<span class=\"animal\">' + a + '</span>').join('')}</div>`
            : `<h1>楷书练习字帖</h1>`;
        const headerInner = useAnimals
            ? `<div class="animal-row" aria-label="decorative animals">${animals.map(a => `<span class=\"animal\">${a}</span>`).join('')}</div>`
            : `<h1>楷书练习字帖</h1>`;

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>楷书练习字帖</title>
                <style>
                    @page {
                        margin: 15mm;
                        size: A4;
                    }
                    
                    body {
                        font-family: 'Microsoft YaHei', 'SimSun', serif;
                        margin: 0;
                        padding: 24px 24px 36px;
                        background: #ffffff;
                        color: #222;
                        min-height: 100vh;
                    }
                    
                    .header {
                        padding: 6px 0 16px;
                        text-align: center;
                        margin-bottom: 8px;
                        border-bottom: 2px solid #eee;
                    }
                    
                    .header h1 {
                        color: #111;
                        font-size: 1.6em;
                        margin: 0;
                        font-weight: 600;
                        letter-spacing: 0.05em;
                    }
                    /* 可爱动物装饰（替代标题） */
                    .animal-row {
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        gap: 10px;
                        padding: 2px 0 4px;
                        line-height: 1;
                    }
                    .animal-row .animal {
                        font-size: 1.6em;
                        transform: translateY(0);
                    }
                    
                    .info-bar {
                        padding: 6px 0 14px;
                        margin-bottom: 8px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }
                    
                    .student-info {
                        display: flex;
                        gap: 30px;
                        align-items: center;
                    }
                    
                    .info-item {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        font-size: 0.95em;
                        color: #333;
                        font-weight: 500;
                    }
                    
                    .info-label { color: #666; font-weight: normal; }
                    
                    .info-value {
                        border-bottom: 1px solid #aaa;
                        min-width: 120px;
                        text-align: center;
                        padding: 2px 8px;
                    }
                    
                    .char-row {
                        display: flex;
                        align-items: flex-start;
                        margin-bottom: 12px;
                        padding: 8px 0;
                        page-break-inside: avoid;
                        gap: 20px;
                        border-bottom: 1px dashed #eee;
                    }
                    
                    .char-section {
                        display: flex;
                        align-items: flex-start;
                        gap: 8px;
                        flex: 1;
                    }
                    
                    .char-info {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        min-width: 0;
                    }
                    
                    .char-number {
                        background: linear-gradient(45deg, #ff6b9d, #c44569);
                        color: white;
                        border-radius: 50%;
                        width: 25px;
                        height: 25px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: bold;
                        font-size: 0.9em;
                        margin-top: 6px;
                        box-shadow: 0 2px 5px rgba(255,107,157,0.3);
                    }
                    
                    .grid-container.reference {
                        position: relative;
                        margin-bottom: 5px;
                    }
                    
                    .char-example {
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        font-size: 60px;
                        color: #111;
                        z-index: 2;
                        font-weight: 500;
                        font-family: 'Kaiti SC','KaiTi','STKaiti','DFKai-SB','Kaiti','KaiTi_GB2312', serif;
                        text-shadow: none;
                    }
                    
                    .char-label {
                        color: #e74c3c;
                        font-size: 0.7em;
                        font-weight: bold;
                        background: rgba(231,76,60,0.1);
                        padding: 2px 6px;
                        border-radius: 6px;
                    }
                    
                    .practice-grids { display: flex; flex-direction: column; gap: 8px; flex: 1; }
                    .practice-row { display: flex; flex-wrap: nowrap; gap: 8px; align-items: center; }
                    
                    .practice-item {
                        position: relative;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                    }
                    
                    .grid {
                        display: block;
                        border-radius: 2px;
                        box-shadow: none;
                    }
                    
                    .footer { display: none; }
                    
                    .rating-section {
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        gap: 20px;
                        margin-bottom: 15px;
                    }
                    
                    .rating-item {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        font-size: 1.1em;
                        color: #2c3e50;
                    }
                    
                    .star-rating {
                        display: flex;
                        gap: 5px;
                    }
                    
                    .star {
                        font-size: 1.5em;
                        color: #f39c12;
                        cursor: pointer;
                        transition: transform 0.2s;
                    }
                    
                    .star:hover {
                        transform: scale(1.2);
                    }
                    
                    .encouragement {
                        color: #e74c3c;
                        font-size: 1.1em;
                        font-weight: bold;
                        margin: 10px 0;
                    }
                    
                    @media print {
                        body { background: white !important; -webkit-print-color-adjust: exact; color-adjust: exact; }
                        .char-row { break-inside: avoid; margin-bottom: 14px; }
                    }
                </style>
            </head>
            <body>
                <div class="header">${headerInnerSafe}</div>
                
                <div class="info-bar">
                    <div class="student-info">
                        <div class="info-item">
                            <span class="info-label">👶 姓名:</span>
                            <div class="info-value"></div>
                        </div>
                        <div class="info-item">
                            <span class="info-label">📅 日期:</span>
                            <div class="info-value">${currentDate}</div>
                        </div>
                        <div class="info-item">
                            <span class="info-label">🏫 班级:</span>
                            <div class="info-value"></div>
                        </div>
                    </div>
                </div>
                
                ${rowsHTML}
                
            </body>
            </html>
        `;
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    new CharacterSelector();
});
