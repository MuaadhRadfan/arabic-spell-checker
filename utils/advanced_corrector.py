from transformers import AutoTokenizer, AutoModelForSeq2SeqLM, pipeline
import torch
import re

class AdvancedArabicCorrector:
    def __init__(self):
        # تحديد اسم النموذج من Hugging Face Hub
        self.model_name = "alnnahwi/gemma-3-1b-arabic-gec-v1"
        
        print(f"Loading model: {self.model_name}")
        print("This may take a few minutes on first run...")
        
        try:
            # تحميل التوكينايزر والنموذج
            self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
            self.model = AutoModelForSeq2SeqLM.from_pretrained(self.model_name)
            
            # تحديد الجهاز (GPU إذا كان متاحًا، وإلا CPU)
            self.device = "cuda" if torch.cuda.is_available() else "cpu"
            print(f"Using device: {self.device}")
            
            self.model.to(self.device)
            
            # إنشاء pipeline للتصحيح
            self.corrector_pipeline = pipeline(
                "text2text-generation",
                model=self.model,
                tokenizer=self.tokenizer,
                device=0 if self.device == "cuda" else -1  # -1 for CPU
            )
            
            print("Model loaded successfully!")
            
        except Exception as e:
            print(f"Error loading model: {e}")
            raise e

    def correct_text(self, text):
        """
        تصحيح النص العربي باستخدام النموذج المتقدم
        """
        if not text or not text.strip():
            return {
                "original_text": text,
                "corrected_text": text,
                "corrections": [],
                "stats": {"words": 0, "errors": 0, "accuracy": 100.0}
            }

        try:
            # تنظيف النص قبل المعالجة
            cleaned_text = self._clean_text(text)
            
            # استخدام الـ pipeline للتصحيح
            corrected_output = self.corrector_pipeline(
                cleaned_text, 
                max_length=512, 
                num_beams=5, 
                do_sample=False,
                early_stopping=True
            )
            
        
            corrected_text = corrected_output[0]['generated_text']
            
            # تحليل الأخطاء والإحصائيات
            corrections, stats = self._analyze_corrections(text, corrected_text)
            
            return {
                "original_text": text,
                "corrected_text": corrected_text,
                "corrections": corrections,
                "stats": stats
            }
            
        except Exception as e:
            print(f"Error during correction: {e}")
            # في حالة الخطأ، إرجاع النص الأصلي
            return {
                "original_text": text,
                "corrected_text": text,
                "corrections": [],
                "stats": {"words": len(text.split()), "errors": 0, "accuracy": 100.0},
                "error": str(e)
            }

    def _clean_text(self, text):
        """
        تنظيف النص قبل المعالجة
        """
        # إزالة المسافات الزائدة
        
        text = re.sub(r'\s+', ' ', text.strip())
        return text

    def _analyze_corrections(self, original_text, corrected_text):
        """
        تحليل الأخطاء المصححة وحساب الإحصائيات
        """
        original_words = original_text.split()
        corrected_words = corrected_text.split()
        
        corrections = []
        errors_found = 0
        
        # مقارنة بسيطة بين الكلمات
        min_length = min(len(original_words), len(corrected_words))
        
        for i in range(min_length):
            if original_words[i] != corrected_words[i]:
                corrections.append({
                    "original": original_words[i],
                    "corrected": corrected_words[i],
                    "position": i,
                    "type": "word_correction"
                })
                errors_found += 1
        
        # إذا اختلف عدد الكلمات
        if len(original_words) != len(corrected_words):
            length_diff = abs(len(original_words) - len(corrected_words))
            errors_found += length_diff
            
            if len(corrected_words) > len(original_words):
                corrections.append({
                    "type": "words_added",
                    "count": length_diff,
                    "description": f"تم إضافة {length_diff} كلمة/كلمات"
                })
            else:
                corrections.append({
                    "type": "words_removed",
                    "count": length_diff,
                    "description": f"تم حذف {length_diff} كلمة/كلمات"
                })
        
        total_words = len(original_words)
        accuracy = ((total_words - errors_found) / total_words) * 100 if total_words > 0 else 100.0
        
        stats = {
            "words": total_words,
            "errors": errors_found,
            "accuracy": round(max(0, accuracy), 2)
        }
        
        return corrections, stats

    def get_model_info(self):
        """
        إرجاع معلومات عن النموذج المستخدم
        """
        return {
            "model_name": self.model_name,
            "device": self.device,
            "model_type": "Sequence-to-Sequence (Text2Text Generation)",
            "language": "Arabic",
            "task": "Grammatical Error Correction (GEC)"
        }

