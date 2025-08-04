// Interactive word editor and suggestion system
class WordEditor {
    constructor() {
        this.suggestionModal = null;
        this.currentWord = null;
        this.currentPosition = null;
        this.isEditing = false;
        
        this.init();
    }
    
    init() {
        this.createSuggestionModal();
        this.setupEventListeners();
    }
    
    createSuggestionModal() {
        const modalHtml = `
            <div id="wordSuggestionModal" class="word-modal">
                <div class="word-modal-content">
                    <div class="word-modal-header">
                        <h3 class="word-modal-title">تحسين الكلمة</h3>
                        <button class="word-modal-close" type="button">&times;</button>
                    </div>
                    <div class="word-modal-body">
                        <div class="current-word-section">
                            <label>الكلمة الحالية:</label>
                            <span id="currentWordDisplay" class="current-word"></span>
                        </div>
                        
                        <div class="suggestions-section">
                            <h4>اقتراحات التصحيح:</h4>
                            <div id="wordSuggestions" class="suggestions-list"></div>
                        </div>
                        
                        <div class="custom-word-section">
                            <h4>أو أدخل كلمة مخصصة:</h4>
                            <div class="custom-input-group">
                                <input type="text" id="customWordInput" class="form-control" placeholder="أدخل الكلمة الصحيحة">
                                <button id="applyCustomWord" class="btn btn-primary">تطبيق</button>
                            </div>
                        </div>
                        
                        <div class="add-to-dictionary-section">
                            <h4>إضافة للقاموس:</h4>
                            <form id="quickAddWordForm">
                                <div class="form-row">
                                    <div class="form-group">
                                        <label>الكلمة:</label>
                                        <input type="text" id="dictWordInput" class="form-control" readonly>
                                    </div>
                                    <div class="form-group">
                                        <label>النوع:</label>
                                        <select id="dictWordType" class="form-control form-select">
                                            <option value="اسم">اسم</option>
                                            <option value="فعل">فعل</option>
                                            <option value="صفة">صفة</option>
                                            <option value="ظرف">ظرف</option>
                                            <option value="حرف جر">حرف جر</option>
                                            <option value="حرف عطف">حرف عطف</option>
                                            <option value="ضمير">ضمير</option>
                                            <option value="حرف">حرف</option>
                                            <option value="غير محدد">غير محدد</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label>التعريف (اختياري):</label>
                                    <input type="text" id="dictWordDefinition" class="form-control" placeholder="تعريف الكلمة">
                                </div>
                                <button type="submit" class="btn btn-success">
                                    <i class="fas fa-plus"></i>
                                    إضافة للقاموس
                                </button>
                            </form>
                        </div>
                    </div>
                    <div class="word-modal-footer">
                        <button id="ignoreWord" class="btn btn-secondary">تجاهل</button>
                        <button id="markCorrect" class="btn btn-success">الكلمة صحيحة</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        this.suggestionModal = document.getElementById('wordSuggestionModal');
    }
    
    setupEventListeners() {
        // Modal close events
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('word-modal-close') || 
                e.target.classList.contains('word-modal')) {
                this.closeSuggestionModal();
            }
        });
        
        // Suggestion clicks
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('suggestion-option')) {
                this.applySuggestion(e.target.getAttribute('data-suggestion'));
            }
        });
        
        // Custom word application
        document.getElementById('applyCustomWord')?.addEventListener('click', () => {
            const customWord = document.getElementById('customWordInput').value.trim();
            if (customWord) {
                this.applySuggestion(customWord);
            }
        });
        
        // Quick add to dictionary
        document.getElementById('quickAddWordForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addWordToDictionary();
        });
        
        // Ignore word
        document.getElementById('ignoreWord')?.addEventListener('click', () => {
            this.ignoreWord();
        });
        
        // Mark as correct
        document.getElementById('markCorrect')?.addEventListener('click', () => {
            this.markWordAsCorrect();
        });
        
        // Enter key in custom input
        document.getElementById('customWordInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const customWord = e.target.value.trim();
                if (customWord) {
                    this.applySuggestion(customWord);
                }
            }
        });
    }
    
    async showWordSuggestions(word, position, suggestions = []) {
        this.currentWord = word;
        this.currentPosition = position;
        this.isEditing = true;
        
        // Update modal content
        document.getElementById('currentWordDisplay').textContent = word;
        document.getElementById('dictWordInput').value = word;
        document.getElementById('customWordInput').value = '';
        
        // Display suggestions
        this.displaySuggestions(suggestions);
        
        // Show modal
        this.showModal();
        
        // Focus on custom input
        setTimeout(() => {
            document.getElementById('customWordInput')?.focus();
        }, 100);
    }
    
    displaySuggestions(suggestions) {
        const container = document.getElementById('wordSuggestions');
        
        if (!suggestions || suggestions.length === 0) {
            container.innerHTML = `
                <div class="no-suggestions">
                    <i class="fas fa-info-circle"></i>
                    <p>لا توجد اقتراحات متاحة</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = suggestions.map(suggestion => `
            <button class="suggestion-option" data-suggestion="${suggestion.word}">
                <span class="suggestion-word">${suggestion.word}</span>
                <span class="suggestion-confidence">${suggestion.frequency || 'متوسط'}</span>
            </button>
        `).join('');
    }
    
    applySuggestion(newWord) {
        if (!this.currentWord || !this.currentPosition) return;
        
        const inputText = document.getElementById('inputText');
        if (!inputText) return;
        
        const text = inputText.value;
        const beforeWord = text.substring(0, this.currentPosition.start);
        const afterWord = text.substring(this.currentPosition.end);
        
        // Replace the word
        const newText = beforeWord + newWord + afterWord;
        inputText.value = newText;
        
        // Update statistics
        if (window.spellCheckerApp) {
            window.spellCheckerApp.updateStatistics();
        }
        
        // Close modal
        this.closeSuggestionModal();
        
        // Show success message
        window.notificationManager.success(`تم تطبيق التصحيح: ${this.currentWord} → ${newWord}`);
        
        // Re-run spell check
        if (window.spellCheckerApp) {
            setTimeout(() => {
                window.spellCheckerApp.correctText();
            }, 500);
        }
    }
    
    async addWordToDictionary() {
        const word = document.getElementById('dictWordInput').value.trim();
        const wordType = document.getElementById('dictWordType').value;
        const definition = document.getElementById('dictWordDefinition').value.trim();
        
        if (!word) {
            window.notificationManager.warning('يرجى إدخال الكلمة');
            return;
        }
        
        const wordData = {
            word: word,
            word_type: wordType,
            frequency: 1,
            definition: definition || null
        };
        
        window.loadingManager.show('جاري إضافة الكلمة للقاموس...');
        
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
                window.notificationManager.success('تم إضافة الكلمة للقاموس بنجاح');
                this.closeSuggestionModal();
                
                // Re-run spell check to reflect the new word
                if (window.spellCheckerApp) {
                    setTimeout(() => {
                        window.spellCheckerApp.correctText();
                    }, 500);
                }
            } else {
                window.notificationManager.error(result.error);
            }
            
        } catch (error) {
            console.error('Error adding word to dictionary:', error);
            window.notificationManager.error('حدث خطأ في إضافة الكلمة');
        } finally {
            window.loadingManager.hide();
        }
    }
    
    ignoreWord() {
        // Add word to ignored list (could be implemented with local storage)
        const ignoredWords = JSON.parse(localStorage.getItem('ignoredWords') || '[]');
        if (!ignoredWords.includes(this.currentWord)) {
            ignoredWords.push(this.currentWord);
            localStorage.setItem('ignoredWords', JSON.stringify(ignoredWords));
        }
        
        window.notificationManager.info(`تم تجاهل الكلمة: ${this.currentWord}`);
        this.closeSuggestionModal();
    }
    
    async markWordAsCorrect() {
        // Add word to personal dictionary as correct
        const wordData = {
            word: this.currentWord,
            word_type: 'غير محدد',
            frequency: 1,
            definition: 'كلمة صحيحة مؤكدة من المستخدم'
        };
        
        window.loadingManager.show('جاري إضافة الكلمة كصحيحة...');
        
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
                window.notificationManager.success('تم تأكيد صحة الكلمة وإضافتها للقاموس');
                this.closeSuggestionModal();
                
                // Re-run spell check
                if (window.spellCheckerApp) {
                    setTimeout(() => {
                        window.spellCheckerApp.correctText();
                    }, 500);
                }
            } else {
                window.notificationManager.error(result.error);
            }
            
        } catch (error) {
            console.error('Error marking word as correct:', error);
            window.notificationManager.error('حدث خطأ في تأكيد صحة الكلمة');
        } finally {
            window.loadingManager.hide();
        }
    }
    
    showModal() {
        if (this.suggestionModal) {
            this.suggestionModal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }
    
    closeSuggestionModal() {
        if (this.suggestionModal) {
            this.suggestionModal.classList.remove('show');
            document.body.style.overflow = '';
        }
        
        this.currentWord = null;
        this.currentPosition = null;
        this.isEditing = false;
    }
}

// Enhanced spell checker with word editing capabilities
class EnhancedSpellChecker extends SpellCheckerApp {
    constructor() {
        super();
        this.wordEditor = new WordEditor();
        this.setupWordClickHandlers();
    }
    
    setupWordClickHandlers() {
        // Handle clicks on error words in the output
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('error-word')) {
                this.handleErrorWordClick(e.target);
            }
        });
    }
    
    async handleErrorWordClick(element) {
        const word = element.textContent.trim();
        const position = this.findWordPosition(word);
        
        if (position) {
            // Get suggestions for this word
            try {
                const response = await fetch('/api/suggest-addition', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ word: word })
                });
                
                const result = await response.json();
                
                if (result.success && result.word_data) {
                    this.wordEditor.showWordSuggestions(word, position, result.word_data.suggestions || []);
                } else {
                    this.wordEditor.showWordSuggestions(word, position, []);
                }
                
            } catch (error) {
                console.error('Error getting word suggestions:', error);
                this.wordEditor.showWordSuggestions(word, position, []);
            }
        }
    }
    
    findWordPosition(word) {
        const inputText = document.getElementById('inputText');
        if (!inputText) return null;
        
        const text = inputText.value;
        const index = text.indexOf(word);
        
        if (index !== -1) {
            return {
                start: index,
                end: index + word.length
            };
        }
        
        return null;
    }
    
    displayResults(data) {
        // Call parent method
        super.displayResults(data);
        
        // Enhance error words with click handlers
        this.enhanceErrorWords();
    }
    
    enhanceErrorWords() {
        const errorWords = document.querySelectorAll('.error-word');
        errorWords.forEach(word => {
            word.style.cursor = 'pointer';
            word.title = 'انقر للتعديل أو الإضافة للقاموس';
            
            // Add hover effect
            word.addEventListener('mouseenter', () => {
                word.style.backgroundColor = 'rgba(231, 76, 60, 0.2)';
            });
            
            word.addEventListener('mouseleave', () => {
                word.style.backgroundColor = 'rgba(231, 76, 60, 0.1)';
            });
        });
    }
}

// Initialize enhanced spell checker
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('[data-page="index"]')) {
        // Replace the basic spell checker with enhanced version
        window.spellCheckerApp = new EnhancedSpellChecker();
    }
});

// Add styles for word editor modal
const wordEditorStyles = `
<style>
.word-modal {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    z-index: 10001;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(3px);
}

.word-modal.show {
    display: flex;
}

.word-modal-content {
    background: var(--bg-primary);
    border-radius: 20px;
    padding: 0;
    max-width: 600px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    border: 1px solid var(--border-color);
    animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
    from {
        opacity: 0;
        transform: translateY(-50px) scale(0.9);
    }
    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

.word-modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 25px 30px;
    border-bottom: 2px solid var(--border-color);
    background: linear-gradient(135deg, var(--primary-color), #2980b9);
    color: white;
    border-radius: 20px 20px 0 0;
}

.word-modal-title {
    font-family: 'Cairo', sans-serif;
    font-size: 1.4rem;
    margin: 0;
}

.word-modal-close {
    background: none;
    border: none;
    font-size: 1.8rem;
    color: white;
    cursor: pointer;
    padding: 5px 10px;
    border-radius: 50%;
    transition: all var(--transition-fast);
    opacity: 0.8;
}

.word-modal-close:hover {
    background: rgba(255, 255, 255, 0.2);
    opacity: 1;
}

.word-modal-body {
    padding: 30px;
}

.word-modal-footer {
    padding: 20px 30px;
    border-top: 1px solid var(--border-color);
    display: flex;
    gap: 15px;
    justify-content: flex-end;
    background: var(--bg-secondary);
    border-radius: 0 0 20px 20px;
}

.current-word-section {
    margin-bottom: 25px;
    padding: 20px;
    background: var(--bg-secondary);
    border-radius: 12px;
    border: 2px solid var(--accent-color);
}

.current-word-section label {
    display: block;
    font-weight: 600;
    color: var(--text-secondary);
    margin-bottom: 8px;
}

.current-word {
    font-size: 1.3rem;
    font-weight: bold;
    color: var(--accent-color);
    font-family: 'Cairo', sans-serif;
}

.suggestions-section,
.custom-word-section,
.add-to-dictionary-section {
    margin-bottom: 25px;
}

.suggestions-section h4,
.custom-word-section h4,
.add-to-dictionary-section h4 {
    color: var(--text-primary);
    margin-bottom: 15px;
    font-size: 1.1rem;
    font-family: 'Cairo', sans-serif;
}

.suggestions-list {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
}

.suggestion-option {
    background: var(--bg-secondary);
    border: 2px solid var(--border-color);
    border-radius: 25px;
    padding: 10px 20px;
    cursor: pointer;
    transition: all var(--transition-fast);
    display: flex;
    align-items: center;
    gap: 10px;
}

.suggestion-option:hover {
    background: var(--primary-color);
    color: white;
    border-color: var(--primary-color);
    transform: translateY(-2px);
}

.suggestion-word {
    font-weight: 600;
}

.suggestion-confidence {
    font-size: 0.85rem;
    opacity: 0.8;
    background: rgba(255, 255, 255, 0.2);
    padding: 2px 8px;
    border-radius: 12px;
}

.custom-input-group {
    display: flex;
    gap: 10px;
    align-items: stretch;
}

.custom-input-group input {
    flex: 1;
}

.form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
    margin-bottom: 15px;
}

.form-group {
    display: flex;
    flex-direction: column;
}

.form-group label {
    font-weight: 600;
    color: var(--text-secondary);
    margin-bottom: 5px;
    font-size: 0.9rem;
}

.no-suggestions {
    text-align: center;
    padding: 20px;
    color: var(--text-secondary);
    background: var(--bg-tertiary);
    border-radius: 8px;
    border: 1px dashed var(--border-color);
}

.no-suggestions i {
    font-size: 2rem;
    margin-bottom: 10px;
    opacity: 0.5;
}

.error-word {
    transition: all var(--transition-fast);
    position: relative;
}

.error-word::after {
    content: '✏️';
    position: absolute;
    top: -5px;
    left: -5px;
    font-size: 0.7rem;
    opacity: 0;
    transition: opacity var(--transition-fast);
}

.error-word:hover::after {
    opacity: 1;
}

@media (max-width: 768px) {
    .word-modal-content {
        width: 95%;
        margin: 10px;
    }
    
    .word-modal-header,
    .word-modal-body,
    .word-modal-footer {
        padding: 20px;
    }
    
    .form-row {
        grid-template-columns: 1fr;
    }
    
    .custom-input-group {
        flex-direction: column;
    }
    
    .word-modal-footer {
        flex-direction: column;
    }
}
</style>
`;

document.head.insertAdjacentHTML('beforeend', wordEditorStyles);

