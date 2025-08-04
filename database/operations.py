from .models import DatabaseManager, CustomWord, WordCorrection
import json
import os

class DatabaseOperations:
    def __init__(self):
        self.db_manager = DatabaseManager()
        self.custom_word = CustomWord(self.db_manager)
        self.word_correction = WordCorrection(self.db_manager)
    
    def add_custom_word(self, word_data):
        """Add a new custom word with validation"""
        word = word_data.get('word', '').strip()
        
        if not word:
            return {'success': False, 'error': 'الكلمة مطلوبة'}
        
        # Check if word already exists
        existing_word = self.custom_word.get_word(word)
        if existing_word:
            return {'success': False, 'error': 'الكلمة موجودة بالفعل'}
        
        word_id = self.custom_word.add_word(
            word=word,
            word_type=word_data.get('word_type', 'unknown'),
            frequency=word_data.get('frequency', 1),
            root=word_data.get('root'),
            synonyms=word_data.get('synonyms'),
            definition=word_data.get('definition')
        )
        
        if word_id:
            return {'success': True, 'word_id': word_id, 'message': 'تم إضافة الكلمة بنجاح'}
        else:
            return {'success': False, 'error': 'فشل في إضافة الكلمة'}
    
    def update_custom_word(self, word_id, word_data):
        """Update an existing custom word"""
        success = self.custom_word.update_word(word_id, **word_data)
        
        if success:
            return {'success': True, 'message': 'تم تحديث الكلمة بنجاح'}
        else:
            return {'success': False, 'error': 'فشل في تحديث الكلمة'}
    
    def delete_custom_word(self, word_id):
        """Delete a custom word"""
        success = self.custom_word.delete_word(word_id)
        
        if success:
            return {'success': True, 'message': 'تم حذف الكلمة بنجاح'}
        else:
            return {'success': False, 'error': 'فشل في حذف الكلمة'}
    
    def search_custom_words(self, search_term, limit=50):
        """Search for custom words"""
        words = self.custom_word.search_words(search_term, limit)
        return {'success': True, 'words': words, 'count': len(words)}
    
    def get_custom_words(self, page=1, per_page=20):
        """Get custom words with pagination"""
        offset = (page - 1) * per_page
        words = self.custom_word.get_all_words(limit=per_page, offset=offset)
        
        return {
            'success': True,
            'words': words,
            'page': page,
            'per_page': per_page,
            'count': len(words)
        }
    
    def get_word_details(self, word):
        """Get details for a specific word"""
        word_data = self.custom_word.get_word(word)
        
        if word_data:
            return {'success': True, 'word': word_data}
        else:
            return {'success': False, 'error': 'الكلمة غير موجودة'}
    
    def add_word_correction(self, original_word, corrected_word, confidence=1.0):
        """Add a custom word correction"""
        correction_id = self.word_correction.add_correction(
            original_word, corrected_word, confidence
        )
        
        if correction_id:
            return {'success': True, 'correction_id': correction_id, 'message': 'تم إضافة التصحيح بنجاح'}
        else:
            return {'success': False, 'error': 'فشل في إضافة التصحيح'}
    
    def get_custom_correction(self, original_word):
        """Get custom correction for a word"""
        correction = self.word_correction.get_correction(original_word)
        
        if correction:
            return {'success': True, 'correction': correction}
        else:
            return {'success': False, 'error': 'لا يوجد تصحيح مخصص لهذه الكلمة'}
    
    def get_database_statistics(self):
        """Get comprehensive database statistics"""
        stats = self.custom_word.get_statistics()
        corrections = self.word_correction.get_all_corrections()
        
        return {
            'success': True,
            'statistics': {
                'total_custom_words': stats['total_words'],
                'recent_words': stats['recent_words'],
                'most_frequent_words': stats['most_frequent'],
                'total_corrections': len(corrections),
                'recent_corrections': corrections[:5]  # Last 5 corrections
            }
        }
    
    def export_database(self):
        """Export database to JSON format"""
        try:
            words = self.custom_word.get_all_words(limit=10000)  # Get all words
            corrections = self.word_correction.get_all_corrections()
            
            export_data = {
                'custom_words': words,
                'corrections': corrections,
                'export_timestamp': str(datetime.now())
            }
            
            return {'success': True, 'data': export_data}
        except Exception as e:
            return {'success': False, 'error': f'فشل في تصدير البيانات: {str(e)}'}
    
    def import_database(self, import_data):
        """Import database from JSON format"""
        try:
            imported_words = 0
            imported_corrections = 0
            
            # Import custom words
            if 'custom_words' in import_data:
                for word_data in import_data['custom_words']:
                    result = self.add_custom_word(word_data)
                    if result['success']:
                        imported_words += 1
            
            # Import corrections
            if 'corrections' in import_data:
                for correction_data in import_data['corrections']:
                    result = self.add_word_correction(
                        correction_data['original_word'],
                        correction_data['corrected_word'],
                        correction_data.get('confidence', 1.0)
                    )
                    if result['success']:
                        imported_corrections += 1
            
            return {
                'success': True,
                'message': f'تم استيراد {imported_words} كلمة و {imported_corrections} تصحيح'
            }
        except Exception as e:
            return {'success': False, 'error': f'فشل في استيراد البيانات: {str(e)}'}
    
    def is_custom_word(self, word):
        """Check if a word exists in custom database"""
        word_data = self.custom_word.get_word(word)
        return word_data is not None
    
    def get_custom_word_frequency(self, word):
        """Get frequency of a custom word"""
        word_data = self.custom_word.get_word(word)
        if word_data:
            return word_data['frequency']
        return 0
    
    def increment_word_usage(self, word):
        """Increment usage count for a word"""
        word_data = self.custom_word.get_word(word)
        if word_data:
            new_frequency = word_data['frequency'] + 1
            self.custom_word.update_word(word_data['id'], frequency=new_frequency)
            return True
        return False

