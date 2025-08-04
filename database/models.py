import sqlite3
import os
from datetime import datetime

class DatabaseManager:
    def __init__(self, db_path='database/custom_words.db'):
        self.db_path = db_path
        self.init_database()
    
    def init_database(self):
        """Initialize the database and create tables if they don't exist"""
        # Create database directory if it doesn't exist
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Create custom_words table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS custom_words (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                word TEXT UNIQUE NOT NULL,
                word_type TEXT DEFAULT 'unknown',
                frequency INTEGER DEFAULT 1,
                root TEXT,
                synonyms TEXT,
                definition TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Create word_corrections table for custom corrections
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS word_corrections (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                original_word TEXT NOT NULL,
                corrected_word TEXT NOT NULL,
                confidence REAL DEFAULT 1.0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Create usage_statistics table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS usage_statistics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                word TEXT NOT NULL,
                usage_count INTEGER DEFAULT 1,
                last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        conn.commit()
        conn.close()
    
    def get_connection(self):
        """Get database connection"""
        return sqlite3.connect(self.db_path)
    
    def execute_query(self, query, params=None):
        """Execute a query and return results"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        if params:
            cursor.execute(query, params)
        else:
            cursor.execute(query)
        
        results = cursor.fetchall()
        conn.commit()
        conn.close()
        
        return results
    
    def execute_insert(self, query, params):
        """Execute an insert query and return the last row id"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute(query, params)
        last_id = cursor.lastrowid
        
        conn.commit()
        conn.close()
        
        return last_id

class CustomWord:
    def __init__(self, db_manager):
        self.db = db_manager
    
    def add_word(self, word, word_type='unknown', frequency=1, root=None, synonyms=None, definition=None):
        """Add a new custom word to the database"""
        query = '''
            INSERT OR REPLACE INTO custom_words 
            (word, word_type, frequency, root, synonyms, definition, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        '''
        params = (word, word_type, frequency, root, synonyms, definition, datetime.now())
        
        try:
            return self.db.execute_insert(query, params)
        except sqlite3.IntegrityError:
            return None
    
    def get_word(self, word):
        """Get a specific word from the database"""
        query = 'SELECT * FROM custom_words WHERE word = ?'
        results = self.db.execute_query(query, (word,))
        
        if results:
            return {
                'id': results[0][0],
                'word': results[0][1],
                'word_type': results[0][2],
                'frequency': results[0][3],
                'root': results[0][4],
                'synonyms': results[0][5],
                'definition': results[0][6],
                'created_at': results[0][7],
                'updated_at': results[0][8]
            }
        return None
    
    def search_words(self, search_term, limit=50):
        """Search for words containing the search term"""
        query = '''
            SELECT * FROM custom_words 
            WHERE word LIKE ? OR synonyms LIKE ? OR definition LIKE ?
            ORDER BY frequency DESC
            LIMIT ?
        '''
        search_pattern = f'%{search_term}%'
        results = self.db.execute_query(query, (search_pattern, search_pattern, search_pattern, limit))
        
        words = []
        for row in results:
            words.append({
                'id': row[0],
                'word': row[1],
                'word_type': row[2],
                'frequency': row[3],
                'root': row[4],
                'synonyms': row[5],
                'definition': row[6],
                'created_at': row[7],
                'updated_at': row[8]
            })
        
        return words
    
    def get_all_words(self, limit=100, offset=0):
        """Get all custom words with pagination"""
        query = '''
            SELECT * FROM custom_words 
            ORDER BY frequency DESC, word ASC
            LIMIT ? OFFSET ?
        '''
        results = self.db.execute_query(query, (limit, offset))
        
        words = []
        for row in results:
            words.append({
                'id': row[0],
                'word': row[1],
                'word_type': row[2],
                'frequency': row[3],
                'root': row[4],
                'synonyms': row[5],
                'definition': row[6],
                'created_at': row[7],
                'updated_at': row[8]
            })
        
        return words
    
    def update_word(self, word_id, **kwargs):
        """Update a word's information"""
        allowed_fields = ['word', 'word_type', 'frequency', 'root', 'synonyms', 'definition']
        updates = []
        params = []
        
        for field, value in kwargs.items():
            if field in allowed_fields:
                updates.append(f'{field} = ?')
                params.append(value)
        
        if not updates:
            return False
        
        updates.append('updated_at = ?')
        params.append(datetime.now())
        params.append(word_id)
        
        query = f'UPDATE custom_words SET {", ".join(updates)} WHERE id = ?'
        
        try:
            self.db.execute_query(query, params)
            return True
        except:
            return False
    
    def delete_word(self, word_id):
        """Delete a word from the database"""
        query = 'DELETE FROM custom_words WHERE id = ?'
        
        try:
            self.db.execute_query(query, (word_id,))
            return True
        except:
            return False
    
    def get_statistics(self):
        """Get database statistics"""
        total_words = self.db.execute_query('SELECT COUNT(*) FROM custom_words')[0][0]
        
        recent_words = self.db.execute_query('''
            SELECT COUNT(*) FROM custom_words 
            WHERE created_at >= datetime('now', '-7 days')
        ''')[0][0]
        
        most_frequent = self.db.execute_query('''
            SELECT word, frequency FROM custom_words 
            ORDER BY frequency DESC 
            LIMIT 10
        ''')
        
        return {
            'total_words': total_words,
            'recent_words': recent_words,
            'most_frequent': [{'word': row[0], 'frequency': row[1]} for row in most_frequent]
        }

class WordCorrection:
    def __init__(self, db_manager):
        self.db = db_manager
    
    def add_correction(self, original_word, corrected_word, confidence=1.0):
        """Add a custom word correction"""
        query = '''
            INSERT OR REPLACE INTO word_corrections 
            (original_word, corrected_word, confidence)
            VALUES (?, ?, ?)
        '''
        params = (original_word, corrected_word, confidence)
        
        try:
            return self.db.execute_insert(query, params)
        except:
            return None
    
    def get_correction(self, original_word):
        """Get correction for a specific word"""
        query = '''
            SELECT corrected_word, confidence FROM word_corrections 
            WHERE original_word = ?
            ORDER BY confidence DESC
            LIMIT 1
        '''
        results = self.db.execute_query(query, (original_word,))
        
        if results:
            return {
                'corrected_word': results[0][0],
                'confidence': results[0][1]
            }
        return None
    
    def get_all_corrections(self):
        """Get all custom corrections"""
        query = '''
            SELECT original_word, corrected_word, confidence, created_at 
            FROM word_corrections 
            ORDER BY created_at DESC
        '''
        results = self.db.execute_query(query)
        
        corrections = []
        for row in results:
            corrections.append({
                'original_word': row[0],
                'corrected_word': row[1],
                'confidence': row[2],
                'created_at': row[3]
            })
        
        return corrections

