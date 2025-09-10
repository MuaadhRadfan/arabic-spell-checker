import re

class AdvancedArabicCorrector:
    """Arabic text corrector using dictionary + regex rules + highlighting"""

    def __init__(self):
        # قاموس الأخطاء الشائعة
        self.common_errors = {
            'هاذا': 'هذا',
            'هاذه': 'هذه',
            'علئ': 'على',
            'الاغلاط': 'الأخطاء',
            'الاملائيه': 'الإملائية',
            'الاملائية': 'الإملائية',
            'اغلاط': 'أخطاء',
            'املائيه': 'إملائية',
            'املائية': 'إملائية',
            'لاكن': 'لكن',
            'هاؤلاء': 'هؤلاء',
            'اولئك': 'أولئك',
        }

        # قواعد Regex لتصحيح شائع
        self.regex_rules = [
            (r'هاذا', 'هذا'),
            (r'هاذه', 'هذه'),
            (r'لاكن', 'لكن'),
            (r'هاؤلاء', 'هؤلاء'),
            (r'(\w)ه$', r'\1ة'),             # التاء المربوطة
            (r'(\S+)ئه', r'\1يه'),           # الهمزة المتطرفة
            (r'([اأإآ])ل', 'ال'),            # توحيد الألف في "ال"
        ]

    def correct_word(self, word: str) -> str:
        """تصحيح كلمة مفردة باستخدام القاموس + regex"""
        # أولاً: القاموس
        if word in self.common_errors:
            return self.common_errors[word]

        # ثانياً: القواعد
        corrected = word
        for pattern, replacement in self.regex_rules:
            corrected = re.sub(pattern, replacement, corrected)

        return corrected

    def highlight_text(self, text: str) -> str:
        """إظهار النص مع تمييز الأخطاء قبل التصحيح"""
        words = text.split()
        highlighted = []
        for w in words:
            corrected = self.correct_word(w)
            if corrected != w:
                highlighted.append(f"\033[91m{w}\033[0m")  # أحمر للأخطاء
            else:
                highlighted.append(w)
        return " ".join(highlighted)

    def correct_text(self, text: str) -> str:
        """تصحيح نص كامل"""
        words = text.split()
        corrected_words = [self.correct_word(w) for w in words]
        return " ".join(corrected_words)
