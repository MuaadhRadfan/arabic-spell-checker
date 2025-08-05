from transformers import AutoTokenizer, AutoModelForSeq2SeqLM, pipeline
import re
from typing import List, Dict, Any

class AdvancedArabicCorrector:
    """Advanced Arabic text corrector using Hugging Face models for GEC"""
    
    def __init__(self):
        # Load pre-trained GEC model and tokenizer from Hugging Face
        # Using a model identified from search results that is suitable for Arabic GEC
        model_name = "alnnahwi/gemma-3-1b-arabic-gec-v1"
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.model = AutoModelForSeq2SeqLM.from_pretrained(model_name)
        self.gec_pipeline = pipeline("text2text-generation", model=self.model, tokenizer=self.tokenizer)

        # Initialize stats
        self.stats = {
            'total_words': 0,
            'errors_found': 0,
            'corrections_made': 0,
            'accuracy': 0.0
        }

    def correct_text(self, text: str) -> Dict[str, Any]:
        """Corrects Arabic text using the loaded GEC model."""
        if not text or not text.strip():
            return {
                'original_text': text,
                'corrected_text': text,
                'corrections': [],
                'statistics': self.stats.copy()
            }

        # Perform GEC using the pipeline
        corrected_output = self.gec_pipeline(text)
        corrected_text = corrected_output[0]['generated_text']

        print(f"Original: {text}")
        print(f"Corrected: {corrected_text}")

        corrections = []
        errors_count = 0
        corrections_made_count = 0

        if text != corrected_text:
            # A more robust way to find differences would be a sequence alignment algorithm
            # For simplicity, we'll compare tokenized versions and assume changes are corrections
            original_words = self._tokenize(text)
            corrected_words = self._tokenize(corrected_text)

            # Simple diffing logic
            i, j = 0, 0
            while i < len(original_words) and j < len(corrected_words):
                if original_words[i] != corrected_words[j]:
                    # Assume a correction happened at this position
                    corrections.append({
                        'original': original_words[i] if i < len(original_words) else '',
                        'corrected': corrected_words[j] if j < len(corrected_words) else '',
                        'position': i,
                        'type': 'gec_correction'
                    })
                    errors_count += 1
                    corrections_made_count += 1
                    i += 1
                    j += 1
                else:
                    i += 1
                    j += 1
            
            # Handle remaining words if one text is longer than the other
            while i < len(original_words):
                corrections.append({
                    'original': original_words[i],
                    'corrected': '', # Word removed
                    'position': i,
                    'type': 'gec_deletion'
                })
                errors_count += 1
                corrections_made_count += 1
                i += 1
            
            while j < len(corrected_words):
                corrections.append({
                    'original': '', # Word added
                    'corrected': corrected_words[j],
                    'position': len(original_words), # Approximate position
                    'type': 'gec_addition'
                })
                errors_count += 1
                corrections_made_count += 1
                j += 1

        self.stats['total_words'] = len(self._tokenize(text))
        self.stats['errors_found'] = errors_count
        self.stats['corrections_made'] = corrections_made_count
        self.stats['accuracy'] = ((self.stats['total_words'] - self.stats['errors_found']) / self.stats['total_words']) * 100 if self.stats['total_words'] > 0 else 100.0

        return {
            'original_text': text,
            'corrected_text': corrected_text,
            'corrections': corrections,
            'statistics': self.stats.copy()
        }

    def _tokenize(self, text: str) -> List[str]:
        """Simple tokenizer for splitting text into words."""
        return re.findall(r'\b\w+\b', text)

    def suggest_word_addition(self, word: str) -> Dict[str, Any]:
        """Placeholder for future functionality or integration with a custom dictionary."""
        # This method would typically check against a custom dictionary or a larger lexicon
        # For now, it will always suggest addition as the GEC model handles corrections.
        return {
            'suggest_addition': True,
            'message': f'يمكن إضافة الكلمة "{word}" إلى القاموس المخصص إذا كانت صحيحة.'
        }

    def get_word_suggestions_for_addition(self, word: str) -> Dict[str, Any]:
        """Placeholder for providing suggestions for word addition."""
        # In a real scenario, this might offer alternative spellings or definitions.
        return {
            'word': word,
            'suggestions': [], # The GEC model handles direct corrections
            'definition': 'تعريف مقترح للكلمة'
        }

    def add_word_to_database(self, word: str, is_correct: bool = True) -> bool:
        """Placeholder for adding words to a custom database."""
        # This would interact with the database operations if a custom dictionary is maintained.
        print(f"Attempting to add '{word}' to custom database (simulated).")
        return True

    def remove_word_from_database(self, word: str) -> bool:
        """Placeholder for removing words from a custom database."""
        print(f"Attempting to remove '{word}' from custom database (simulated).")
        return True

    def get_database_stats(self) -> Dict[str, int]:
        """Placeholder for database statistics."""
        return {
            'correct_words_count': 0, # Not directly managed by this corrector
            'common_errors_count': 0  # Not directly managed by this corrector
        }

    def export_database(self) -> Dict[str, Any]:
        """Placeholder for exporting database."""
        return {'correct_words': [], 'common_errors': {}}

    def import_database(self, data: Dict[str, Any]) -> bool:
        """Placeholder for importing database."""
        return True




