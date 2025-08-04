// Main application functionality
class SpellCheckerApp {
    constructor() {
        this.inputText = document.getElementById('inputText');
        this.correctedTextOutput = document.getElementById('correctedTextOutput');
        this.suggestionsList = document.getElementById('suggestionsList');
        this.statisticsElements = {
            wordCount: document.getElementById('wordCount'),
            charCount: document.getElementById('charCount'),
            errorsFound: document.getElementById('errorsFound'),
            accuracyRate: document.getElementById('accuracyRate')
        };
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.updateStatistics();
    }
    
    setupEventListeners() {
        // Real-time statistics update
        if (this.inputText) {
            this.inputText.addEventListener('input', Utils.debounce(() => {
                this.updateStatistics();
            }, 300));
        }
        
        // Form submissions
        document.addEventListener('submit', (e) => {
            if (e.target.id === 'spellCheckForm') {
                e.preventDefault();
                this.correctText();
            }
        });
        
        // Button clicks
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-action]')) {
                const action = e.target.getAttribute('data-action');
                this.handleAction(action, e.target);
            }
        });
    }
    
    handleAction(action, element) {
        switch (action) {
            case 'correct-text':
                this.correctText();
                break;
            case 'clear-text':
                this.clearText();
                break;
            case 'copy-result':
                this.copyResult();
                break;
            case 'apply-suggestion':
                this.applySuggestion(element);
                break;
            case 'export-text':
                this.exportText();
                break;
            default:
                console.warn('Unknown action:', action);
        }
    }
    
    async correctText() {
        const inputText = this.inputText?.value.trim();
        
        if (!inputText) {
            window.notificationManager.warning('يرجى إدخال نص للتدقيق');
            return;
        }
        
        if (!Utils.isArabicText(inputText)) {
            window.notificationManager.warning('يرجى إدخال نص باللغة العربية');
            return;
        }
        
        window.loadingManager.show('جاري تدقيق النص...');
        
        try {
            const response = await fetch('/api/correct', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ text: inputText })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            this.displayResults(data);
            
        } catch (error) {
            console.error('Error:', error);
            window.notificationManager.error('حدث خطأ أثناء التدقيق. الرجاء المحاولة مرة أخرى.');
        } finally {
            window.loadingManager.hide();
        }
    }
    
    displayResults(data) {
        // Use the enhanced corrector display
        if (window.correctorDisplay) {
            window.correctorDisplay.displayResults(data);
        } else {
            // Fallback to basic display
            if (this.correctedTextOutput) {
                this.correctedTextOutput.textContent = data.corrected_text;
            }
        }
        
        // Update statistics
        if (data.statistics) {
            this.updateStatisticsDisplay(data.statistics);
        }
        
        // Display suggestions
        this.displaySuggestions(data.suggestions || []);
        
        // Show success message
        if (data.statistics && data.statistics.errors_found === 0) {
            window.notificationManager.success('ممتاز! لم يتم العثور على أخطاء إملائية.');
        } else if (data.statistics) {
            window.notificationManager.info(`تم العثور على ${data.statistics.errors_found} خطأ وتصحيحه.`);
        }
    }
    
    displaySuggestions(suggestions) {
        if (!this.suggestionsList) return;
        
        this.suggestionsList.innerHTML = '';
        
        if (suggestions.length === 0) {
            this.suggestionsList.innerHTML = `
                <li class="suggestion-item no-suggestions">
                    <div class="text-center">
                        <i class="fas fa-check-circle text-success"></i>
                        <p>ممتاز! لم يتم العثور على أخطاء إملائية.</p>
                    </div>
                </li>
            `;
            return;
        }
        
        suggestions.forEach(item => {
            const li = document.createElement('li');
            li.className = 'suggestion-item';
            
            li.innerHTML = `
                <div class="suggestion-header">
                    <span class="original-word">الكلمة الأصلية: ${item.original}</span>
                    <button class="btn btn-sm btn-secondary" data-action="add-to-dictionary" data-word="${item.original}">
                        <i class="fas fa-plus"></i> إضافة للقاموس
                    </button>
                </div>
                <div class="suggestion-body">
                    <span class="suggestion-label">اقتراحات:</span>
                    <div class="corrections">
                        ${item.corrections.map(corr => `
                            <button class="correction-btn" 
                                    data-action="apply-suggestion" 
                                    data-original="${item.original}" 
                                    data-correction="${corr.word}">
                                ${corr.word} (${corr.frequency})
                            </button>
                        `).join('')}
                    </div>
                </div>
            `;
            
            this.suggestionsList.appendChild(li);
        });
    }
    
    applySuggestion(element) {
        const original = element.getAttribute('data-original');
        const correction = element.getAttribute('data-correction');
        
        if (this.inputText && original && correction) {
            const currentText = this.inputText.value;
            const regex = new RegExp('\\b' + original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'g');
            const newText = currentText.replace(regex, correction);
            
            this.inputText.value = newText;
            this.updateStatistics();
            
            // Re-run correction
            this.correctText();
            
            window.notificationManager.success(`تم تطبيق التصحيح: ${original} → ${correction}`);
        }
    }
    
    clearText() {
        if (this.inputText) {
            this.inputText.value = '';
        }
        
        if (this.correctedTextOutput) {
            this.correctedTextOutput.textContent = 'النص المصحح سيظهر هنا...';
        }
        
        if (this.suggestionsList) {
            this.suggestionsList.innerHTML = '';
        }
        
        this.resetStatistics();
        window.notificationManager.info('تم مسح النص');
    }
    
    async copyResult() {
        const correctedText = this.correctedTextOutput?.textContent || '';
        
        if (!correctedText || correctedText === 'النص المصحح سيظهر هنا...') {
            window.notificationManager.warning('لا يوجد نص مصحح للنسخ');
            return;
        }
        
        try {
            await Utils.copyToClipboard(correctedText);
            window.notificationManager.success('تم نسخ النص المصحح');
        } catch (error) {
            window.notificationManager.error('فشل في نسخ النص');
        }
    }
    
    exportText() {
        const originalText = this.inputText?.value || '';
        const correctedText = this.correctedTextOutput?.textContent || '';
        
        if (!originalText) {
            window.notificationManager.warning('لا يوجد نص للتصدير');
            return;
        }
        
        const exportData = {
            original_text: originalText,
            corrected_text: correctedText,
            timestamp: new Date().toISOString(),
            statistics: this.getCurrentStatistics()
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json;charset=utf-8'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `spell_check_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        window.notificationManager.success('تم تصدير النص بنجاح');
    }
    
    updateStatistics() {
        const text = this.inputText?.value || '';
        const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
        const charCount = text.length;
        
        if (this.statisticsElements.wordCount) {
            this.statisticsElements.wordCount.textContent = Utils.formatNumber(wordCount);
        }
        
        if (this.statisticsElements.charCount) {
            this.statisticsElements.charCount.textContent = Utils.formatNumber(charCount);
        }
    }
    
    updateStatisticsDisplay(statistics) {
        Object.keys(this.statisticsElements).forEach(key => {
            const element = this.statisticsElements[key];
            if (element && statistics[key] !== undefined) {
                let value = statistics[key];
                if (key === 'accuracyRate') {
                    value = value + '%';
                } else {
                    value = Utils.formatNumber(value);
                }
                element.textContent = value;
            }
        });
    }
    
    resetStatistics() {
        Object.values(this.statisticsElements).forEach(element => {
            if (element) {
                element.textContent = '0';
            }
        });
        
        if (this.statisticsElements.accuracyRate) {
            this.statisticsElements.accuracyRate.textContent = '100%';
        }
    }
    
    getCurrentStatistics() {
        return {
            word_count: parseInt(this.statisticsElements.wordCount?.textContent || '0'),
            char_count: parseInt(this.statisticsElements.charCount?.textContent || '0'),
            errors_found: parseInt(this.statisticsElements.errorsFound?.textContent || '0'),
            accuracy_rate: parseFloat(this.statisticsElements.accuracyRate?.textContent?.replace('%', '') || '100')
        };
    }
}

// Database management functionality
class DatabaseManager {
    constructor() {
        this.init();
    }
    
    init() {
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        document.addEventListener('submit', (e) => {
            if (e.target.id === 'addWordForm') {
                e.preventDefault();
                this.addWord(e.target);
            } else if (e.target.id === 'searchWordsForm') {
                e.preventDefault();
                this.searchWords(e.target);
            }
        });
        
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-db-action]')) {
                const action = e.target.getAttribute('data-db-action');
                this.handleDatabaseAction(action, e.target);
            }
        });
    }
    
    handleDatabaseAction(action, element) {
        switch (action) {
            case 'edit-word':
                this.editWord(element);
                break;
            case 'delete-word':
                this.deleteWord(element);
                break;
            case 'export-database':
                this.exportDatabase();
                break;
            case 'import-database':
                this.importDatabase();
                break;
            case 'load-more-words':
                this.loadMoreWords();
                break;
            default:
                console.warn('Unknown database action:', action);
        }
    }
    
    async addWord(form) {
        const formData = new FormData(form);
        const wordData = Object.fromEntries(formData.entries());
        
        window.loadingManager.show('جاري إضافة الكلمة...');
        
        try {
            const response = await fetch('/api/words', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(wordData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                window.notificationManager.success(result.message);
                form.reset();
                this.refreshWordsList();
            } else {
                window.notificationManager.error(result.error);
            }
            
        } catch (error) {
            console.error('Error adding word:', error);
            window.notificationManager.error('حدث خطأ أثناء إضافة الكلمة');
        } finally {
            window.loadingManager.hide();
        }
    }
    
    async searchWords(form) {
        const formData = new FormData(form);
        const searchTerm = formData.get('search_term');
        
        if (!searchTerm.trim()) {
            window.notificationManager.warning('يرجى إدخال كلمة للبحث');
            return;
        }
        
        window.loadingManager.show('جاري البحث...');
        
        try {
            const response = await fetch(`/api/words/search?q=${encodeURIComponent(searchTerm)}`);
            const result = await response.json();
            
            if (result.success) {
                this.displaySearchResults(result.words);
            } else {
                window.notificationManager.error(result.error);
            }
            
        } catch (error) {
            console.error('Error searching words:', error);
            window.notificationManager.error('حدث خطأ أثناء البحث');
        } finally {
            window.loadingManager.hide();
        }
    }
    
    displaySearchResults(words) {
        const resultsContainer = document.getElementById('searchResults');
        if (!resultsContainer) return;
        
        if (words.length === 0) {
            resultsContainer.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search"></i>
                    <p>لم يتم العثور على نتائج</p>
                </div>
            `;
            return;
        }
        
        resultsContainer.innerHTML = words.map(word => `
            <div class="word-item" data-word-id="${word.id}">
                <div class="word-header">
                    <h4>${word.word}</h4>
                    <span class="word-type">${word.word_type}</span>
                </div>
                <div class="word-details">
                    <p><strong>التكرار:</strong> ${word.frequency}</p>
                    ${word.root ? `<p><strong>الجذر:</strong> ${word.root}</p>` : ''}
                    ${word.definition ? `<p><strong>التعريف:</strong> ${word.definition}</p>` : ''}
                </div>
                <div class="word-actions">
                    <button class="btn btn-sm btn-secondary" data-db-action="edit-word" data-word-id="${word.id}">
                        <i class="fas fa-edit"></i> تعديل
                    </button>
                    <button class="btn btn-sm btn-danger" data-db-action="delete-word" data-word-id="${word.id}">
                        <i class="fas fa-trash"></i> حذف
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    async refreshWordsList() {
        // Refresh the words list if we're on the database management page
        const wordsList = document.getElementById('wordsList');
        if (wordsList) {
            // Implementation for refreshing the words list
            // This would typically reload the current page or fetch updated data
            window.location.reload();
        }
    }
    
    async exportDatabase() {
        window.loadingManager.show('جاري تصدير قاعدة البيانات...');
        
        try {
            const response = await fetch('/api/database/export');
            const result = await response.json();
            
            if (result.success) {
                const blob = new Blob([JSON.stringify(result.data, null, 2)], {
                    type: 'application/json;charset=utf-8'
                });
                
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `database_backup_${new Date().toISOString().slice(0, 10)}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                window.notificationManager.success('تم تصدير قاعدة البيانات بنجاح');
            } else {
                window.notificationManager.error(result.error);
            }
            
        } catch (error) {
            console.error('Error exporting database:', error);
            window.notificationManager.error('حدث خطأ أثناء تصدير قاعدة البيانات');
        } finally {
            window.loadingManager.hide();
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize spell checker app
    window.spellCheckerApp = new SpellCheckerApp();
    
    // Initialize database manager
    window.databaseManager = new DatabaseManager();
    
    // Add any page-specific initializations
    const currentPage = document.body.getAttribute('data-page');
    if (currentPage) {
        initializePage(currentPage);
    }
});

// Page-specific initialization
function initializePage(pageName) {
    switch (pageName) {
        case 'index':
            initializeSpellCheckerPage();
            break;
        case 'database':
            initializeDatabasePage();
            break;
        case 'demo':
            initializeDemoPage();
            break;
        default:
            // Default initialization
            break;
    }
}

function initializeSpellCheckerPage() {
    // Add any spell checker specific initialization
    console.log('Spell checker page initialized');
}

function initializeDatabasePage() {
    // Add any database management specific initialization
    console.log('Database management page initialized');
}

function initializeDemoPage() {
    // Add any demo page specific initialization
    console.log('Demo page initialized');
}

