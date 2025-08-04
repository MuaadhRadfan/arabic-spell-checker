import re
import json
from typing import List, Dict, Any, Tuple
from difflib import SequenceMatcher
import os

class EnhancedCorrector:
    """Enhanced Arabic text corrector with custom database support"""
    
    def __init__(self):
        self.common_errors = {
            # همزة الوصل والقطع
            'اذا': 'إذا',
            'الى': 'إلى',
            'انه': 'إنه',
            'انها': 'إنها',
            'انت': 'أنت',
            'انا': 'أنا',
            'اين': 'أين',
            'ايضا': 'أيضاً',
            'اكثر': 'أكثر',
            'افضل': 'أفضل',
            'اول': 'أول',
            'اخر': 'آخر',
            'اخرى': 'أخرى',
            
            # التاء المربوطة والمفتوحة
            'مدرسه': 'مدرسة',
            'جامعه': 'جامعة',
            'حكومه': 'حكومة',
            'شركه': 'شركة',
            'مؤسسه': 'مؤسسة',
            'خطه': 'خطة',
            'فكره': 'فكرة',
            'طريقه': 'طريقة',
            'عمليه': 'عملية',
            'تقنيه': 'تقنية',
            
            # أخطاء أخرى شائعة
            'هاذا': 'هذا',
            'هاذه': 'هذه',
            'ذالك': 'ذلك',
            'تالك': 'تلك',
            'اولئك': 'أولئك',
            'لاكن': 'لكن',
            'بعدين': 'بعد ذلك',
            'احنا': 'نحن',
            'انتو': 'أنتم',
            'انتي': 'أنت',
            'ايش': 'ماذا',
            'وين': 'أين',
            'ليش': 'لماذا',
            'شلون': 'كيف',
            'شنو': 'ماذا',
            'منو': 'من',
            'امتى': 'متى',
            'ليه': 'لماذا',
            'ازاي': 'كيف',
            'ايه': 'ماذا',
            'مين': 'من',
            'فين': 'أين'
        }
        
        # قاعدة بيانات الكلمات الصحيحة
        self.correct_words = set([
            'هذا', 'هذه', 'ذلك', 'تلك', 'أولئك', 'إذا', 'إلى', 'إنه', 'إنها',
            'أنت', 'أنا', 'أين', 'أيضاً', 'أكثر', 'أفضل', 'أول', 'آخر', 'أخرى',
            'مدرسة', 'جامعة', 'حكومة', 'شركة', 'مؤسسة', 'خطة', 'فكرة', 'طريقة',
            'عملية', 'تقنية', 'لكن', 'بعد', 'ذلك', 'نحن', 'أنتم', 'ماذا', 'كيف',
            'لماذا', 'متى', 'من', 'في', 'على', 'عن', 'مع', 'بين', 'تحت', 'فوق',
            'أمام', 'خلف', 'يمين', 'يسار', 'شمال', 'جنوب', 'شرق', 'غرب', 'داخل',
            'خارج', 'قريب', 'بعيد', 'كبير', 'صغير', 'طويل', 'قصير', 'واسع', 'ضيق',
            'سريع', 'بطيء', 'جميل', 'قبيح', 'جديد', 'قديم', 'حديث', 'قديم', 'صحيح',
            'خطأ', 'صواب', 'خطأ', 'نعم', 'لا', 'ربما', 'بالطبع', 'طبعاً', 'أكيد',
            'مؤكد', 'واضح', 'غامض', 'سهل', 'صعب', 'بسيط', 'معقد', 'مفهوم', 'غير',
            'مفهوم', 'مقبول', 'مرفوض', 'موافق', 'غير', 'موافق', 'مهم', 'غير', 'مهم',
            'ضروري', 'غير', 'ضروري', 'مطلوب', 'غير', 'مطلوب', 'ممكن', 'مستحيل',
            'محتمل', 'غير', 'محتمل', 'متوقع', 'غير', 'متوقع', 'عادي', 'غير', 'عادي',
            'طبيعي', 'غير', 'طبيعي', 'منطقي', 'غير', 'منطقي', 'معقول', 'غير', 'معقول'
        ])
        
        # إحصائيات
        self.stats = {
            'total_words': 0,
            'errors_found': 0,
            'corrections_made': 0,
            'accuracy': 0.0
        }
    
    def correct_text(self, text: str) -> Dict[str, Any]:
        """تدقيق النص وإرجاع النتائج"""
        if not text or not text.strip():
            return {
                'original_text': text,
                'corrected_text': text,
                'errors': [],
                'stats': self.stats,
                'suggestions': []
            }
        
        # تنظيف النص
        cleaned_text = self._clean_text(text)
        
        # تقسيم النص إلى كلمات
        words = self._tokenize(cleaned_text)
        
        # تدقيق كل كلمة
        corrected_words = []
        errors = []
        suggestions = []
        
        for i, word in enumerate(words):
            if self._is_arabic_word(word):
                correction_result = self._correct_word(word, i)
                corrected_words.append(correction_result['corrected'])
                
                if correction_result['has_error']:
                    errors.append(correction_result['error'])
                    suggestions.extend(correction_result['suggestions'])
            else:
                corrected_words.append(word)
        
        # إعادة تجميع النص
        corrected_text = ' '.join(corrected_words)
        
        # حساب الإحصائيات
        self._update_stats(words, errors)
        
        return {
            'original_text': text,
            'corrected_text': corrected_text,
            'errors': errors,
            'stats': self.stats.copy(),
            'suggestions': suggestions
        }
    
    def _clean_text(self, text: str) -> str:
        """تنظيف النص من الرموز غير المرغوبة"""
        # إزالة الرموز الزائدة
        text = re.sub(r'[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s\d\.,!?;:()\[\]{}"\'-]', '', text)
        
        # تنظيف المسافات
        text = re.sub(r'\s+', ' ', text)
        
        return text.strip()
    
    def _tokenize(self, text: str) -> List[str]:
        """تقسيم النص إلى كلمات"""
        # تقسيم بناءً على المسافات والعلامات
        tokens = re.findall(r'[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]+|[^\s]', text)
        return tokens
    
    def _is_arabic_word(self, word: str) -> bool:
        """التحقق من كون الكلمة عربية"""
        if not word:
            return False
        
        arabic_chars = re.findall(r'[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]', word)
        return len(arabic_chars) > 0
    
    def _correct_word(self, word: str, position: int) -> Dict[str, Any]:
        """تدقيق كلمة واحدة"""
        original_word = word
        has_error = False
        error_info = None
        suggestions = []
        corrected_word = word
        
        # إزالة التشكيل للمقارنة
        clean_word = self._remove_diacritics(word)
        
        # البحث في قاموس الأخطاء الشائعة
        if clean_word in self.common_errors:
            corrected_word = self.common_errors[clean_word]
            has_error = True
            error_info = {
                'type': 'spelling',
                'position': position,
                'original': word,
                'corrected': corrected_word,
                'message': f'خطأ إملائي: "{word}" يجب أن تكون "{corrected_word}"'
            }
            suggestions.append({
                'word': corrected_word,
                'confidence': 0.95,
                'type': 'correction'
            })
            return {
                'corrected': corrected_word,
                'has_error': has_error,
                'error': error_info,
                'suggestions': suggestions
            }
        
        # التحقق من وجود الكلمة في قاعدة البيانات
        if clean_word not in self.correct_words:
            # البحث عن كلمات مشابهة
            similar_words = self._find_similar_words(clean_word)
            
            if similar_words:
                # استخدام أفضل اقتراح كتصحيح
                best_suggestion = similar_words[0]
                if best_suggestion['confidence'] > 0.8:  # عتبة عالية للتصحيح التلقائي
                    corrected_word = best_suggestion['word']
                    has_error = True
                    error_info = {
                        'type': 'spelling',
                        'position': position,
                        'original': word,
                        'corrected': corrected_word,
                        'message': f'تصحيح مقترح: "{word}" → "{corrected_word}"'
                    }
                else:
                    has_error = True
                    error_info = {
                        'type': 'unknown',
                        'position': position,
                        'original': word,
                        'corrected': word,
                        'message': f'كلمة غير معروفة: "{word}"'
                    }
                suggestions.extend(similar_words)
        
        return {
            'corrected': corrected_word,
            'has_error': has_error,
            'error': error_info,
            'suggestions': suggestions
        }
    
    def _remove_diacritics(self, text: str) -> str:
        """إزالة التشكيل من النص"""
        diacritics = '\u064B\u064C\u064D\u064E\u064F\u0650\u0651\u0652\u0653\u0654\u0655\u0656\u0657\u0658\u0659\u065A\u065B\u065C\u065D\u065E\u065F\u0670'
        return ''.join(char for char in text if char not in diacritics)
    
    def _find_similar_words(self, word: str) -> List[Dict[str, Any]]:
        """البحث عن كلمات مشابهة"""
        suggestions = []
        
        # البحث في الكلمات الصحيحة
        for correct_word in self.correct_words:
            similarity = SequenceMatcher(None, word, correct_word).ratio()
            if similarity > 0.6:  # عتبة التشابه
                suggestions.append({
                    'word': correct_word,
                    'confidence': similarity,
                    'type': 'suggestion'
                })
        
        # ترتيب حسب درجة التشابه
        suggestions.sort(key=lambda x: x['confidence'], reverse=True)
        
        return suggestions[:3]  # أفضل 3 اقتراحات
    
    def _update_stats(self, words: List[str], errors: List[Dict]) -> None:
        """تحديث الإحصائيات"""
        arabic_words = [w for w in words if self._is_arabic_word(w)]
        
        self.stats['total_words'] = len(arabic_words)
        self.stats['errors_found'] = len(errors)
        self.stats['corrections_made'] = len([e for e in errors if e['type'] == 'spelling'])
        
        if self.stats['total_words'] > 0:
            self.stats['accuracy'] = ((self.stats['total_words'] - self.stats['errors_found']) / self.stats['total_words']) * 100
        else:
            self.stats['accuracy'] = 100.0
    
    def add_word_to_database(self, word: str, is_correct: bool = True) -> bool:
        """إضافة كلمة إلى قاعدة البيانات"""
        try:
            clean_word = self._remove_diacritics(word.strip())
            
            if is_correct and clean_word:
                self.correct_words.add(clean_word)
                return True
            
            return False
        except Exception:
            return False
    
    def remove_word_from_database(self, word: str) -> bool:
        """إزالة كلمة من قاعدة البيانات"""
        try:
            clean_word = self._remove_diacritics(word.strip())
            
            if clean_word in self.correct_words:
                self.correct_words.remove(clean_word)
                return True
            
            return False
        except Exception:
            return False
    
    def get_database_stats(self) -> Dict[str, int]:
        """الحصول على إحصائيات قاعدة البيانات"""
        return {
            'correct_words_count': len(self.correct_words),
            'common_errors_count': len(self.common_errors)
        }
    
    def export_database(self) -> Dict[str, Any]:
        """تصدير قاعدة البيانات"""
        return {
            'correct_words': list(self.correct_words),
            'common_errors': self.common_errors
        }
    
    def import_database(self, data: Dict[str, Any]) -> bool:
        """استيراد قاعدة البيانات"""
        try:
            if 'correct_words' in data:
                self.correct_words.update(data['correct_words'])
            
            if 'common_errors' in data:
                self.common_errors.update(data['common_errors'])
            
            return True
        except Exception:
            return False

