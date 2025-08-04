import json
import os
from datetime import datetime
import re

def validate_arabic_text(text):
    """Validate if text contains Arabic characters"""
    arabic_pattern = re.compile(r'[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]')
    return bool(arabic_pattern.search(text))

def clean_arabic_text(text):
    """Clean Arabic text by removing extra spaces and normalizing characters"""
    if not text:
        return ""
    
    # Remove extra whitespaces
    text = re.sub(r'\s+', ' ', text.strip())
    
    # Normalize Arabic characters
    text = text.replace('أ', 'ا').replace('إ', 'ا').replace('آ', 'ا')
    text = text.replace('ة', 'ه')
    text = text.replace('ى', 'ي')
    
    return text

def format_word_type(word_type):
    """Format word type for display"""
    type_mapping = {
        'noun': 'اسم',
        'verb': 'فعل',
        'adjective': 'صفة',
        'adverb': 'ظرف',
        'preposition': 'حرف جر',
        'conjunction': 'حرف عطف',
        'pronoun': 'ضمير',
        'particle': 'حرف',
        'unknown': 'غير محدد'
    }
    return type_mapping.get(word_type, word_type)

def format_date(date_string):
    """Format date string for display"""
    try:
        if isinstance(date_string, str):
            date_obj = datetime.fromisoformat(date_string.replace('Z', '+00:00'))
        else:
            date_obj = date_string
        
        return date_obj.strftime('%Y-%m-%d %H:%M')
    except:
        return str(date_string)

def paginate_results(items, page=1, per_page=20):
    """Paginate a list of items"""
    total_items = len(items)
    total_pages = (total_items + per_page - 1) // per_page
    
    start_index = (page - 1) * per_page
    end_index = start_index + per_page
    
    paginated_items = items[start_index:end_index]
    
    return {
        'items': paginated_items,
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total_items': total_items,
            'total_pages': total_pages,
            'has_prev': page > 1,
            'has_next': page < total_pages,
            'prev_page': page - 1 if page > 1 else None,
            'next_page': page + 1 if page < total_pages else None
        }
    }

def export_to_json(data, filename=None):
    """Export data to JSON file"""
    if filename is None:
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f'export_{timestamp}.json'
    
    try:
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        return {'success': True, 'filename': filename}
    except Exception as e:
        return {'success': False, 'error': str(e)}

def import_from_json(filename):
    """Import data from JSON file"""
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return {'success': True, 'data': data}
    except Exception as e:
        return {'success': False, 'error': str(e)}

def sanitize_filename(filename):
    """Sanitize filename for safe file operations"""
    # Remove or replace invalid characters
    filename = re.sub(r'[<>:"/\\|?*]', '_', filename)
    # Remove leading/trailing spaces and dots
    filename = filename.strip(' .')
    # Limit length
    if len(filename) > 255:
        filename = filename[:255]
    
    return filename

def calculate_text_statistics(text):
    """Calculate comprehensive text statistics"""
    if not text:
        return {
            'characters': 0,
            'characters_no_spaces': 0,
            'words': 0,
            'sentences': 0,
            'paragraphs': 0,
            'arabic_words': 0,
            'non_arabic_words': 0
        }
    
    # Basic counts
    characters = len(text)
    characters_no_spaces = len(text.replace(' ', ''))
    words = len(text.split())
    
    # Sentence count (approximate)
    sentence_endings = ['.', '!', '?', '؟', '!']
    sentences = sum(text.count(ending) for ending in sentence_endings)
    sentences = max(1, sentences)  # At least 1 sentence
    
    # Paragraph count
    paragraphs = len([p for p in text.split('\n') if p.strip()])
    paragraphs = max(1, paragraphs)  # At least 1 paragraph
    
    # Arabic vs non-Arabic words
    arabic_words = 0
    non_arabic_words = 0
    
    for word in text.split():
        if validate_arabic_text(word):
            arabic_words += 1
        else:
            non_arabic_words += 1
    
    return {
        'characters': characters,
        'characters_no_spaces': characters_no_spaces,
        'words': words,
        'sentences': sentences,
        'paragraphs': paragraphs,
        'arabic_words': arabic_words,
        'non_arabic_words': non_arabic_words
    }

def generate_word_frequency_map(text):
    """Generate word frequency map from text"""
    if not text:
        return {}
    
    words = text.split()
    frequency_map = {}
    
    for word in words:
        # Clean the word
        cleaned_word = re.sub(r'[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\w]', '', word)
        if cleaned_word:
            frequency_map[cleaned_word] = frequency_map.get(cleaned_word, 0) + 1
    
    # Sort by frequency (descending)
    sorted_frequency = sorted(frequency_map.items(), key=lambda x: x[1], reverse=True)
    
    return dict(sorted_frequency)

def highlight_differences(original_text, corrected_text):
    """Highlight differences between original and corrected text"""
    original_words = original_text.split()
    corrected_words = corrected_text.split()
    
    highlighted_original = []
    highlighted_corrected = []
    
    max_len = max(len(original_words), len(corrected_words))
    
    for i in range(max_len):
        if i < len(original_words) and i < len(corrected_words):
            if original_words[i] != corrected_words[i]:
                highlighted_original.append(f'<mark class="error">{original_words[i]}</mark>')
                highlighted_corrected.append(f'<mark class="correction">{corrected_words[i]}</mark>')
            else:
                highlighted_original.append(original_words[i])
                highlighted_corrected.append(corrected_words[i])
        elif i < len(original_words):
            highlighted_original.append(f'<mark class="deleted">{original_words[i]}</mark>')
        elif i < len(corrected_words):
            highlighted_corrected.append(f'<mark class="added">{corrected_words[i]}</mark>')
    
    return {
        'original_highlighted': ' '.join(highlighted_original),
        'corrected_highlighted': ' '.join(highlighted_corrected)
    }

def validate_word_data(word_data):
    """Validate word data before adding to database"""
    errors = []
    
    # Check required fields
    if not word_data.get('word', '').strip():
        errors.append('الكلمة مطلوبة')
    
    # Validate word contains Arabic characters
    word = word_data.get('word', '').strip()
    if word and not validate_arabic_text(word):
        errors.append('الكلمة يجب أن تحتوي على أحرف عربية')
    
    # Validate frequency
    frequency = word_data.get('frequency', 1)
    try:
        frequency = int(frequency)
        if frequency < 1:
            errors.append('التكرار يجب أن يكون رقم موجب')
    except (ValueError, TypeError):
        errors.append('التكرار يجب أن يكون رقم صحيح')
    
    # Validate word type
    valid_types = ['اسم', 'فعل', 'صفة', 'ظرف', 'حرف جر', 'حرف عطف', 'ضمير', 'حرف', 'غير محدد']
    word_type = word_data.get('word_type', 'غير محدد')
    if word_type not in valid_types:
        errors.append('نوع الكلمة غير صحيح')
    
    return {
        'valid': len(errors) == 0,
        'errors': errors
    }

def create_backup_filename():
    """Create a backup filename with timestamp"""
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    return f'database_backup_{timestamp}.json'

def log_user_action(action, details=None):
    """Log user actions for audit purposes"""
    log_entry = {
        'timestamp': datetime.now().isoformat(),
        'action': action,
        'details': details or {}
    }
    
    # In a real application, this would write to a log file or database
    # For now, we'll just return the log entry
    return log_entry

