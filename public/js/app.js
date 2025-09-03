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

        // 改变每个字的连续行数（1或2行）
        this.selectedDisplay.addEventListener('change', (e) => {
            const el = e.target;
            if (el.classList && el.classList.contains('line-count')) {
                const char = el.dataset.char;
                const lines = parseInt(el.value);
                const idx = this.selectedChars.findIndex(c => c.char === char);
                if (idx > -1) {
                    this.selectedChars[idx].lines = lines;
                    this.persistState();
                }
            }
        });
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

            const lineSelect = document.createElement('select');
            lineSelect.className = 'line-count';
            lineSelect.dataset.char = item.char;
            lineSelect.innerHTML = '<option value="1">1行</option><option value="2">2行</option>';
            lineSelect.value = String(item.lines || 1);

            wrap.appendChild(charElement);
            wrap.appendChild(lineSelect);
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
        try {
            localStorage.setItem('selectedChars_v2', JSON.stringify(this.selectedChars));
            if (this.gridSizeSelect) localStorage.setItem('gridSize', this.gridSizeSelect.value);
        } catch (_) { /* ignore */ }
    }

    restoreState() {
        try {
            const savedV2 = localStorage.getItem('selectedChars_v2');
            const savedV1 = localStorage.getItem('selectedChars');
            if (savedV2) {
                const arr = JSON.parse(savedV2);
                if (Array.isArray(arr)) this.selectedChars = arr.filter(x => x && x.char);
            } else if (savedV1) {
                const arr = JSON.parse(savedV1);
                if (Array.isArray(arr)) this.selectedChars = arr.map(ch => ({ char: ch, lines: 1 }));
            }
            const size = localStorage.getItem('gridSize');
            if (this.gridSizeSelect && size) this.gridSizeSelect.value = size;
        } catch (_) { /* ignore */ }
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
                        <div class="char-info">
                            <div class="char-number">${rowIndex * charsPerRow + charIndex + 1}</div>
                            <div class="grid-container reference">
                                <div class="char-example" style="font-size:${Math.round(gridPx*0.75)}px;">${item.char}</div>
                                <svg class="grid" width="${gridPx}" height="${gridPx}" viewBox="0 0 100 100">
                                    <defs>
                                        <pattern id="dots_${rowIndex}_${charIndex}" patternUnits="userSpaceOnUse" width="4" height="4">
                                            <circle cx="2" cy="2" r="0.5" fill="#ff6b9d" opacity="0.3"/>
                                        </pattern>
                                    </defs>
                                    <rect x="0" y="0" width="100" height="100" fill="none" stroke="#4ecdc4" stroke-width="2"/>
                                    <line x1="50" y1="0" x2="50" y2="100" stroke="#ff6b9d" stroke-width="1.2" stroke-dasharray="3,2"/>
                                    <line x1="0" y1="50" x2="100" y2="50" stroke="#ff6b9d" stroke-width="1.2" stroke-dasharray="3,2"/>
                                    <line x1="0" y1="0" x2="100" y2="100" stroke="#45b7d1" stroke-width="0.8" stroke-dasharray="2,2" opacity="0.6"/>
                                    <line x1="0" y1="100" x2="100" y2="0" stroke="#45b7d1" stroke-width="0.8" stroke-dasharray="2,2" opacity="0.6"/>
                                    <rect x="0" y="0" width="100" height="100" fill="url(#dots_${rowIndex}_${charIndex})" opacity="0.1"/>
                                </svg>
                            </div>
                            <div class="char-label">示范</div>
                        </div>
                        <div class="practice-grids">
                            ${Array(item.lines).fill(0).map((_, lineIdx) => `
                                <div class="practice-row">
                                    ${Array(practicePerLine).fill(0).map((_, i) => `
                                        <div class="practice-item">
                                            <svg class="grid" width="${gridPx}" height="${gridPx}" viewBox="0 0 100 100">
                                                <defs>
                                                    <pattern id="dots_${rowIndex}_${charIndex}_${lineIdx}_${i}" patternUnits="userSpaceOnUse" width="4" height="4">
                                                        <circle cx="2" cy="2" r="0.5" fill="#96ceb4" opacity="0.2"/>
                                                    </pattern>
                                                </defs>
                                                <rect x="0" y="0" width="100" height="100" fill="none" stroke="#4ecdc4" stroke-width="1.5"/>
                                                <line x1="50" y1="0" x2="50" y2="100" stroke="#ff9ff3" stroke-width="0.8" stroke-dasharray="2,1" opacity="0.7"/>
                                                <line x1="0" y1="50" x2="100" y2="50" stroke="#ff9ff3" stroke-width="0.8" stroke-dasharray="2,1" opacity="0.7"/>
                                                <line x1="0" y1="0" x2="100" y2="100" stroke="#54a0ff" stroke-width="0.6" stroke-dasharray="1,1" opacity="0.4"/>
                                                <line x1="0" y1="100" x2="100" y2="0" stroke="#54a0ff" stroke-width="0.6" stroke-dasharray="1,1" opacity="0.4"/>
                                                <rect x="0" y="0" width="100" height="100" fill="url(#dots_${rowIndex}_${charIndex}_${lineIdx}_${i})" opacity="0.1"/>
                                            </svg>
                                        </div>
                                    `).join('')}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `).join('');

        const currentDate = new Date().toLocaleDateString('zh-CN');

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>小朋友汉字练字帖</title>
                <style>
                    @page {
                        margin: 15mm;
                        size: A4;
                    }
                    
                    body {
                        font-family: 'Microsoft YaHei', 'SimSun', serif;
                        margin: 0;
                        padding: 0;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        min-height: 100vh;
                    }
                    
                    .header {
                        background: linear-gradient(45deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%);
                        padding: 20px;
                        text-align: center;
                        border-radius: 20px 20px 0 0;
                        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                        margin-bottom: 25px;
                    }
                    
                    .header h1 {
                        color: #2c3e50;
                        font-size: 2.2em;
                        margin: 0;
                        text-shadow: 2px 2px 4px rgba(255,255,255,0.8);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 15px;
                    }
                    
                    .header h1::before {
                        content: "🌟";
                        font-size: 1.2em;
                    }
                    
                    .header h1::after {
                        content: "🌈";
                        font-size: 1.2em;
                    }
                    
                    .info-bar {
                        background: linear-gradient(45deg, #a8edea 0%, #fed6e3 100%);
                        padding: 15px 25px;
                        border-radius: 15px;
                        margin-bottom: 25px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        box-shadow: 0 3px 10px rgba(0,0,0,0.1);
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
                        font-size: 1.1em;
                        color: #2c3e50;
                        font-weight: bold;
                    }
                    
                    .info-label {
                        color: #e74c3c;
                        font-weight: normal;
                    }
                    
                    .info-value {
                        border-bottom: 2px solid #3498db;
                        min-width: 120px;
                        text-align: center;
                        padding: 2px 8px;
                    }
                    
                    .char-row {
                        display: flex;
                        align-items: flex-start;
                        margin-bottom: 15px;
                        padding: 15px;
                        background: rgba(255,255,255,0.95);
                        border-radius: 10px;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                        page-break-inside: avoid;
                        border: 2px solid transparent;
                        background-image: linear-gradient(rgba(255,255,255,0.95), rgba(255,255,255,0.95)), 
                                          linear-gradient(45deg, #ff9a9e, #fecfef, #a8edea, #fed6e3);
                        background-origin: border-box;
                        background-clip: content-box, border-box;
                        gap: 20px;
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
                        min-width: 80px;
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
                        margin-bottom: 5px;
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
                        color: #2c3e50;
                        z-index: 2;
                        font-weight: bold;
                        text-shadow: 1px 1px 2px rgba(255,255,255,0.8);
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
                        border-radius: 5px;
                        box-shadow: 0 1px 5px rgba(0,0,0,0.1);
                    }
                    
                    .footer {
                        background: linear-gradient(45deg, #ffecd2 0%, #fcb69f 100%);
                        padding: 20px;
                        border-radius: 0 0 20px 20px;
                        margin-top: 30px;
                        text-align: center;
                        box-shadow: 0 -4px 15px rgba(0,0,0,0.1);
                    }
                    
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
                        body {
                            background: white !important;
                            -webkit-print-color-adjust: exact;
                            color-adjust: exact;
                        }
                        
                        .char-row {
                            break-inside: avoid;
                            margin-bottom: 25px;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>小朋友汉字练字帖</h1>
                </div>
                
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
                
                <div class="footer">
                    <div class="rating-section">
                        <div class="rating-item">
                            <span>📝 完成情况:</span>
                            <div class="star-rating">
                                <span class="star">⭐</span>
                                <span class="star">⭐</span>
                                <span class="star">⭐</span>
                                <span class="star">⭐</span>
                                <span class="star">⭐</span>
                            </div>
                        </div>
                        <div class="rating-item">
                            <span>✏️ 书写质量:</span>
                            <div class="star-rating">
                                <span class="star">⭐</span>
                                <span class="star">⭐</span>
                                <span class="star">⭐</span>
                                <span class="star">⭐</span>
                                <span class="star">⭐</span>
                            </div>
                        </div>
                    </div>
                    <div class="encouragement">
                        🎉 小朋友真棒！继续加油哦！ 🎉
                    </div>
                    <div style="margin-top: 15px; font-size: 0.9em; color: #7f8c8d;">
                        家长签字：________________　　老师签字：________________
                    </div>
                </div>
            </body>
            </html>
        `;
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    new CharacterSelector();
});
