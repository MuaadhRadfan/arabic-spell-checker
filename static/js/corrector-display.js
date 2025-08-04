// Enhanced corrector display functionality
class CorrectorDisplay {
    constructor() {
        this.correctedTextOutput = document.getElementById('correctedTextOutput');
        this.init();
    }
    
    init() {
        this.setupStyles();
    }
    
    setupStyles() {
        // Add CSS for enhanced display
        const style = document.createElement('style');
        style.textContent = `
            .corrected-text-container {
                position: relative;
                background: var(--bg-primary);
                border: 2px solid var(--border-color);
                border-radius: 12px;
                padding: 20px;
                min-height: 200px;
                font-family: 'Tajawal', sans-serif;
                font-size: 1.1rem;
                line-height: 1.8;
                direction: rtl;
                text-align: right;
            }
            
            .corrected-text-container.has-corrections {
                border-color: var(--primary-color);
                background: linear-gradient(135deg, var(--bg-primary) 0%, rgba(106, 13, 173, 0.02) 100%);
            }
            
            .correction-item {
                display: inline-block;
                position: relative;
                margin: 0 2px;
            }
            
            .error-word {
                background: linear-gradient(135deg, #ff6f61, #ff8a80);
                color: white;
                padding: 3px 8px;
                border-radius: 6px;
                font-weight: 600;
                text-decoration: line-through;
                text-decoration-color: rgba(255, 255, 255, 0.7);
                text-decoration-thickness: 2px;
                box-shadow: 0 2px 4px rgba(255, 111, 97, 0.3);
                transition: all 0.3s ease;
                cursor: pointer;
            }
            
            .error-word:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 8px rgba(255, 111, 97, 0.4);
            }
            
            .correction-arrow {
                display: inline-block;
                margin: 0 8px;
                color: var(--primary-color);
                font-weight: bold;
                font-size: 1.2rem;
                animation: pulse 2s infinite;
            }
            
            .corrected-word {
                background: linear-gradient(135deg, var(--primary-color), #8e44ad);
                color: white;
                padding: 3px 8px;
                border-radius: 6px;
                font-weight: 600;
                box-shadow: 0 2px 4px rgba(106, 13, 173, 0.3);
                transition: all 0.3s ease;
                cursor: pointer;
            }
            
            .corrected-word:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 8px rgba(106, 13, 173, 0.4);
            }
            
            .normal-text {
                color: var(--text-primary);
            }
            
            .copy-button {
                position: absolute;
                top: 10px;
                left: 10px;
                background: var(--primary-color);
                color: white;
                border: none;
                border-radius: 6px;
                padding: 8px 12px;
                font-size: 0.9rem;
                cursor: pointer;
                transition: all 0.3s ease;
                opacity: 0.8;
            }
            
            .copy-button:hover {
                opacity: 1;
                transform: translateY(-1px);
                box-shadow: 0 4px 8px rgba(106, 13, 173, 0.3);
            }
            
            .copy-button i {
                margin-left: 5px;
            }
            
            .correction-tooltip {
                position: absolute;
                bottom: 100%;
                left: 50%;
                transform: translateX(-50%);
                background: var(--text-primary);
                color: var(--bg-primary);
                padding: 8px 12px;
                border-radius: 6px;
                font-size: 0.85rem;
                white-space: nowrap;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
                z-index: 1000;
                margin-bottom: 5px;
            }
            
            .correction-tooltip::after {
                content: '';
                position: absolute;
                top: 100%;
                left: 50%;
                transform: translateX(-50%);
                border: 5px solid transparent;
                border-top-color: var(--text-primary);
            }
            
            .correction-item:hover .correction-tooltip {
                opacity: 1;
                visibility: visible;
            }
            
            .no-errors-message {
                text-align: center;
                color: var(--success-color);
                font-size: 1.2rem;
                padding: 40px 20px;
            }
            
            .no-errors-message i {
                font-size: 3rem;
                margin-bottom: 15px;
                display: block;
            }
            
            .correction-stats {
                margin-top: 15px;
                padding: 15px;
                background: var(--bg-secondary);
                border-radius: 8px;
                border-left: 4px solid var(--primary-color);
            }
            
            .correction-stats h4 {
                color: var(--primary-color);
                margin-bottom: 10px;
                font-size: 1rem;
            }
            
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                gap: 10px;
            }
            
            .stat-item {
                text-align: center;
                padding: 8px;
                background: var(--bg-primary);
                border-radius: 6px;
                border: 1px solid var(--border-color);
            }
            
            .stat-value {
                font-size: 1.2rem;
                font-weight: bold;
                color: var(--primary-color);
                display: block;
            }
            
            .stat-label {
                font-size: 0.85rem;
                color: var(--text-secondary);
            }
            
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }
            
            @media (max-width: 768px) {
                .corrected-text-container {
                    padding: 15px;
                    font-size: 1rem;
                }
                
                .copy-button {
                    position: relative;
                    top: auto;
                    left: auto;
                    margin-bottom: 10px;
                    display: block;
                    width: fit-content;
                }
                
                .stats-grid {
                    grid-template-columns: repeat(2, 1fr);
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    displayResults(data) {
        if (!this.correctedTextOutput) return;
        
        const hasCorrections = data.corrections && data.corrections.length > 0;
        
        if (!hasCorrections) {
            this.displayNoErrors(data.corrected_text || data.original_text);
            return;
        }
        
        this.displayCorrectedText(data);
    }
    
    displayNoErrors(text) {
        this.correctedTextOutput.innerHTML = `
            <div class="corrected-text-container">
                <button class="copy-button" onclick="correctorDisplay.copyText('${text.replace(/'/g, "\\'")}')">
                    <i class="fas fa-copy"></i>
                    نسخ النص
                </button>
                <div class="no-errors-message">
                    <i class="fas fa-check-circle"></i>
                    <h3>ممتاز! النص صحيح إملائياً</h3>
                    <p>لم يتم العثور على أي أخطاء إملائية في النص</p>
                </div>
                <div class="normal-text">${text}</div>
            </div>
        `;
    }
    
    displayCorrectedText(data) {
        const correctedText = this.generateCorrectedHTML(data);
        const plainText = this.extractPlainText(data.corrected_text);
        
        this.correctedTextOutput.innerHTML = `
            <div class="corrected-text-container has-corrections">
                <button class="copy-button" onclick="correctorDisplay.copyText('${plainText.replace(/'/g, "\\'")}')">
                    <i class="fas fa-copy"></i>
                    نسخ النص المصحح
                </button>
                <div class="corrected-content">
                    ${correctedText}
                </div>
                ${this.generateCorrectionStats(data)}
            </div>
        `;
    }
    
    generateCorrectedHTML(data) {
        if (!data.corrections || data.corrections.length === 0) {
            return `<div class="normal-text">${data.corrected_text}</div>`;
        }
        
        let html = data.original_text;
        const corrections = data.corrections || [];
        
        // Sort corrections by position (descending to avoid position shifts)
        corrections.sort((a, b) => b.position - a.position);
        
        // Apply corrections with highlighting
        corrections.forEach(correction => {
            // Use word boundaries for more accurate replacement
            const regex = new RegExp('\\b' + correction.original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'g');
            const replacement = `
                <span class="correction-item">
                    <span class="correction-tooltip">تم التصحيح: ${correction.original} ← ${correction.corrected}</span>
                    <span class="error-word">${correction.original}</span>
                    <span class="correction-arrow">←</span>
                    <span class="corrected-word">${correction.corrected}</span>
                </span>
            `;
            html = html.replace(regex, replacement);
        });
        
        // If no replacements were made, show the corrected text directly
        if (corrections.length > 0 && html === data.original_text) {
            // Fallback: show corrected text with simple highlighting
            html = data.corrected_text;
            corrections.forEach(correction => {
                const regex = new RegExp('\\b' + correction.corrected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'g');
                const replacement = `<span class="corrected-word">${correction.corrected}</span>`;
                html = html.replace(regex, replacement);
            });
        }
        
        return html;
    }
    
    generateCorrectionStats(data) {
        const stats = data.statistics || {};
        const correctionsCount = data.corrections ? data.corrections.length : 0;
        
        return `
            <div class="correction-stats">
                <h4><i class="fas fa-chart-bar"></i> إحصائيات التصحيح</h4>
                <div class="stats-grid">
                    <div class="stat-item">
                        <span class="stat-value">${stats.total_words || 0}</span>
                        <span class="stat-label">إجمالي الكلمات</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${stats.errors_found || correctionsCount}</span>
                        <span class="stat-label">الأخطاء المكتشفة</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${stats.corrections_made || correctionsCount}</span>
                        <span class="stat-label">التصحيحات المطبقة</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${(stats.accuracy_percentage || stats.accuracy || 100).toFixed(1)}%</span>
                        <span class="stat-label">معدل الدقة</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    extractPlainText(text) {
        // Remove HTML tags and return plain text
        const div = document.createElement('div');
        div.innerHTML = text;
        return div.textContent || div.innerText || '';
    }
    
    async copyText(text) {
        try {
            await navigator.clipboard.writeText(text);
            window.notificationManager.success('تم نسخ النص بنجاح');
        } catch (error) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            try {
                document.execCommand('copy');
                window.notificationManager.success('تم نسخ النص بنجاح');
            } catch (err) {
                window.notificationManager.error('فشل في نسخ النص');
            }
            
            document.body.removeChild(textArea);
        }
    }
}

// Initialize the corrector display
window.correctorDisplay = new CorrectorDisplay();

