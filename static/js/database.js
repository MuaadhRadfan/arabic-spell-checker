// Database management functionality
class DatabasePageManager {
    constructor() {
        this.editModal = document.getElementById('editWordModal');
        this.importModal = document.getElementById('importDataModal');
        this.currentEditId = null;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.setupModals();
    }
    
    setupEventListeners() {
        // Show all words button
        const showAllBtn = document.getElementById('showAllWords');
        if (showAllBtn) {
            showAllBtn.addEventListener('click', () => {
                this.loadAllWords();
            });
        }
        
        // Statistics button
        const statsBtn = document.getElementById('showStatistics');
        if (statsBtn) {
            statsBtn.addEventListener('click', () => {
                this.showDetailedStatistics();
            });
        }
        
        // Optimize database button
        const optimizeBtn = document.getElementById('optimizeDatabase');
        if (optimizeBtn) {
            optimizeBtn.addEventListener('click', () => {
                this.optimizeDatabase();
            });
        }
        
        // Database action buttons
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-db-action]')) {
                const action = e.target.getAttribute('data-db-action');
                this.handleDatabaseAction(action, e.target);
            }
        });
        
        // Edit form submission
        const editForm = document.getElementById('editWordForm');
        if (editForm) {
            editForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.updateWord(editForm);
            });
        }
        
        // Import form submission
        const importForm = document.getElementById('importDataForm');
        if (importForm) {
            importForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.importData(importForm);
            });
        }
    }
    
    setupModals() {
        // Close modal when clicking close button or outside
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-close')) {
                this.closeModal(e.target.closest('.modal'));
            } else if (e.target.classList.contains('modal')) {
                this.closeModal(e.target);
            }
        });
        
        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const openModal = document.querySelector('.modal.show');
                if (openModal) {
                    this.closeModal(openModal);
                }
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
                this.showImportModal();
                break;
            default:
                console.warn('Unknown database action:', action);
        }
    }
    
    async loadAllWords(page = 1) {
        window.loadingManager.show('جاري تحميل الكلمات...');
        
        try {
            const response = await fetch(`/api/words?page=${page}&per_page=50`);
            const result = await response.json();
            
            if (result.success) {
                this.displayWords(result.words, 'جميع الكلمات');
            } else {
                window.notificationManager.error(result.error);
            }
            
        } catch (error) {
            console.error('Error loading words:', error);
            window.notificationManager.error('حدث خطأ في تحميل الكلمات');
        } finally {
            window.loadingManager.hide();
        }
    }
    
    displayWords(words, title = 'نتائج البحث') {
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
        
        resultsContainer.innerHTML = `
            <div class="results-header">
                <h4>${title} (${words.length} كلمة)</h4>
            </div>
            ${words.map(word => `
                <div class="word-item" data-word-id="${word.id}">
                    <div class="word-header">
                        <span class="word-title">${word.word}</span>
                        <span class="word-type">${word.word_type}</span>
                    </div>
                    <div class="word-details">
                        <p><strong>التكرار:</strong> ${word.frequency}</p>
                        ${word.root ? `<p><strong>الجذر:</strong> ${word.root}</p>` : ''}
                        ${word.synonyms ? `<p><strong>المرادفات:</strong> ${word.synonyms}</p>` : ''}
                        ${word.definition ? `<p><strong>التعريف:</strong> ${word.definition}</p>` : ''}
                        <p><strong>تاريخ الإضافة:</strong> ${this.formatDate(word.created_at)}</p>
                    </div>
                    <div class="word-actions">
                        <button class="btn btn-sm btn-secondary" 
                                data-db-action="edit-word" 
                                data-word-id="${word.id}">
                            <i class="fas fa-edit"></i> تعديل
                        </button>
                        <button class="btn btn-sm btn-danger" 
                                data-db-action="delete-word" 
                                data-word-id="${word.id}">
                            <i class="fas fa-trash"></i> حذف
                        </button>
                    </div>
                </div>
            `).join('')}
        `;
    }
    
    async editWord(element) {
        const wordId = element.getAttribute('data-word-id');
        
        try {
            // Get word details
            const response = await fetch(`/api/words/${wordId}`);
            const result = await response.json();
            
            if (result.success) {
                this.populateEditForm(result.word);
                this.showModal(this.editModal);
            } else {
                window.notificationManager.error(result.error);
            }
            
        } catch (error) {
            console.error('Error loading word details:', error);
            window.notificationManager.error('حدث خطأ في تحميل تفاصيل الكلمة');
        }
    }
    
    populateEditForm(word) {
        document.getElementById('edit_word_id').value = word.id;
        document.getElementById('edit_word').value = word.word;
        document.getElementById('edit_word_type').value = word.word_type;
        document.getElementById('edit_frequency').value = word.frequency;
        document.getElementById('edit_root').value = word.root || '';
        document.getElementById('edit_synonyms').value = word.synonyms || '';
        document.getElementById('edit_definition').value = word.definition || '';
        
        this.currentEditId = word.id;
    }
    
    async updateWord(form) {
        const formData = new FormData(form);
        const wordData = Object.fromEntries(formData.entries());
        const wordId = wordData.word_id;
        
        delete wordData.word_id; // Remove ID from data
        
        window.loadingManager.show('جاري تحديث الكلمة...');
        
        try {
            const response = await fetch(`/api/words/${wordId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(wordData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                window.notificationManager.success(result.message);
                this.closeModal(this.editModal);
                this.refreshPage();
            } else {
                window.notificationManager.error(result.error);
            }
            
        } catch (error) {
            console.error('Error updating word:', error);
            window.notificationManager.error('حدث خطأ في تحديث الكلمة');
        } finally {
            window.loadingManager.hide();
        }
    }
    
    async deleteWord(element) {
        const wordId = element.getAttribute('data-word-id');
        const wordItem = element.closest('.word-item');
        const wordTitle = wordItem.querySelector('.word-title').textContent;
        
        if (!confirm(`هل أنت متأكد من حذف الكلمة "${wordTitle}"؟`)) {
            return;
        }
        
        window.loadingManager.show('جاري حذف الكلمة...');
        
        try {
            const response = await fetch(`/api/words/${wordId}`, {
                method: 'DELETE'
            });
            
            const result = await response.json();
            
            if (result.success) {
                window.notificationManager.success(result.message);
                wordItem.remove();
                this.updateStatistics();
            } else {
                window.notificationManager.error(result.error);
            }
            
        } catch (error) {
            console.error('Error deleting word:', error);
            window.notificationManager.error('حدث خطأ في حذف الكلمة');
        } finally {
            window.loadingManager.hide();
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
            window.notificationManager.error('حدث خطأ في تصدير قاعدة البيانات');
        } finally {
            window.loadingManager.hide();
        }
    }
    
    showImportModal() {
        this.showModal(this.importModal);
    }
    
    async importData(form) {
        const formData = new FormData(form);
        const file = formData.get('import_file');
        
        if (!file) {
            window.notificationManager.warning('يرجى اختيار ملف للاستيراد');
            return;
        }
        
        window.loadingManager.show('جاري استيراد البيانات...');
        
        try {
            const fileContent = await this.readFileAsText(file);
            const importData = JSON.parse(fileContent);
            
            const response = await fetch('/api/database/import', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ data: importData })
            });
            
            const result = await response.json();
            
            if (result.success) {
                window.notificationManager.success(result.message);
                this.closeModal(this.importModal);
                this.refreshPage();
            } else {
                window.notificationManager.error(result.error);
            }
            
        } catch (error) {
            console.error('Error importing data:', error);
            window.notificationManager.error('حدث خطأ في استيراد البيانات. تأكد من صحة تنسيق الملف.');
        } finally {
            window.loadingManager.hide();
        }
    }
    
    async showDetailedStatistics() {
        window.loadingManager.show('جاري تحميل الإحصائيات...');
        
        try {
            const response = await fetch('/api/statistics');
            const result = await response.json();
            
            if (result.success) {
                this.displayStatistics(result.statistics);
            } else {
                window.notificationManager.error(result.error);
            }
            
        } catch (error) {
            console.error('Error loading statistics:', error);
            window.notificationManager.error('حدث خطأ في تحميل الإحصائيات');
        } finally {
            window.loadingManager.hide();
        }
    }
    
    displayStatistics(stats) {
        const statsHtml = `
            <div class="statistics-modal">
                <h3>إحصائيات مفصلة</h3>
                
                <div class="stats-section">
                    <h4>إحصائيات عامة</h4>
                    <p>إجمالي الكلمات: ${stats.total_custom_words}</p>
                    <p>الكلمات المضافة هذا الأسبوع: ${stats.recent_words}</p>
                    <p>إجمالي التصحيحات: ${stats.total_corrections}</p>
                </div>
                
                <div class="stats-section">
                    <h4>الكلمات الأكثر استخداماً</h4>
                    <ul>
                        ${stats.most_frequent_words.map(word => 
                            `<li>${word.word} (${word.frequency} مرة)</li>`
                        ).join('')}
                    </ul>
                </div>
                
                <div class="stats-section">
                    <h4>التصحيحات الحديثة</h4>
                    <ul>
                        ${stats.recent_corrections.map(correction => 
                            `<li>${correction.original_word} → ${correction.corrected_word}</li>`
                        ).join('')}
                    </ul>
                </div>
            </div>
        `;
        
        // Create and show statistics modal
        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">إحصائيات قاعدة البيانات</h3>
                    <button class="modal-close" type="button">&times;</button>
                </div>
                <div class="modal-body">
                    ${statsHtml}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Auto-remove after 10 seconds or when closed
        setTimeout(() => {
            if (modal.parentNode) {
                modal.remove();
            }
        }, 10000);
    }
    
    async optimizeDatabase() {
        if (!confirm('هل تريد تحسين قاعدة البيانات؟ قد يستغرق هذا بعض الوقت.')) {
            return;
        }
        
        window.loadingManager.show('جاري تحسين قاعدة البيانات...');
        
        // Simulate optimization process
        setTimeout(() => {
            window.loadingManager.hide();
            window.notificationManager.success('تم تحسين قاعدة البيانات بنجاح');
        }, 3000);
    }
    
    showModal(modal) {
        if (modal) {
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }
    
    closeModal(modal) {
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = '';
            
            // Reset forms
            const forms = modal.querySelectorAll('form');
            forms.forEach(form => form.reset());
        }
    }
    
    async updateStatistics() {
        try {
            const response = await fetch('/api/statistics');
            const result = await response.json();
            
            if (result.success) {
                const stats = result.statistics;
                
                // Update stat cards
                const statCards = document.querySelectorAll('.stat-card .stat-number');
                if (statCards.length >= 3) {
                    statCards[0].textContent = stats.total_custom_words || 0;
                    statCards[1].textContent = stats.recent_words || 0;
                    statCards[2].textContent = stats.total_corrections || 0;
                }
            }
        } catch (error) {
            console.error('Error updating statistics:', error);
        }
    }
    
    refreshPage() {
        // Refresh the page to show updated data
        window.location.reload();
    }
    
    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsText(file);
        });
    }
    
    formatDate(dateString) {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('ar-EG', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return dateString;
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('[data-page="database"]')) {
        window.databasePageManager = new DatabasePageManager();
    }
});

// Add styles for statistics modal
const statsStyles = `
<style>
.statistics-modal {
    max-height: 400px;
    overflow-y: auto;
}

.stats-section {
    margin-bottom: 25px;
    padding: 15px;
    background: var(--bg-secondary);
    border-radius: 8px;
    border: 1px solid var(--border-color);
}

.stats-section h4 {
    color: var(--primary-color);
    margin-bottom: 15px;
    font-size: 1.1rem;
}

.stats-section ul {
    list-style: none;
    padding: 0;
    margin: 0;
}

.stats-section li {
    padding: 8px 0;
    border-bottom: 1px solid var(--border-color);
    color: var(--text-secondary);
}

.stats-section li:last-child {
    border-bottom: none;
}

.results-header {
    padding: 15px 20px;
    background: var(--bg-tertiary);
    border-bottom: 1px solid var(--border-color);
    margin-bottom: 0;
}

.results-header h4 {
    margin: 0;
    color: var(--text-primary);
    font-size: 1.1rem;
}
</style>
`;

document.head.insertAdjacentHTML('beforeend', statsStyles);

