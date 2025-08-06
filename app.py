from flask import Flask, render_template, request, jsonify, flash
from flask_cors import CORS
import os
import sys
from datetime import datetime

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import our custom modules
from utils.simple_corrector import SimpleArabicCorrector
from database.operations import DatabaseOperations
from utils.helpers import validate_word_data, format_date, calculate_text_statistics

app = Flask(__name__)
app.secret_key = 'enhanced_spell_checker_secret_key_2025'

# Enable CORS for all routes
CORS(app)

# Initialize components
corrector = SimpleArabicCorrector()
db_ops = DatabaseOperations()

# Routes for main pages
@app.route('/')
def index():
    """Main spell checking page"""
    return render_template('index.html')

@app.route('/about')
def about():
    """About the project page"""
    return render_template('about.html')

@app.route('/features')
def features():
    """Features page"""
    return render_template('features.html')

@app.route('/demo')
def demo():
    """Demo page"""
    return render_template('demo.html')

@app.route('/database')
def database_management():
    """Database management page"""
    # Get recent words and statistics
    try:
        recent_words = db_ops.get_custom_words(page=1, per_page=10)
        stats = db_ops.get_database_statistics()
        
        return render_template('database.html', 
                             recent_words=recent_words['words'],
                             statistics=stats['statistics'])
    except Exception as e:
        flash(f'خطأ في تحميل بيانات قاعدة البيانات: {str(e)}', 'error')
        return render_template('database.html', recent_words=[], statistics={})

@app.route('/future')
def future():
    """Future features page"""
    return render_template('future.html')

@app.route('/conclusion')
def conclusion():
    """Conclusion page"""
    return render_template('conclusion.html')

# API Routes for spell checking
@app.route('/api/correct', methods=['POST'])
def api_correct_text():
    """API endpoint for text correction"""
    try:
        data = request.get_json()
        text = data.get('text', '')
        
        if not text:
            return jsonify({
                'success': False,
                'error': 'النص مطلوب'
            }), 400
        
        # Perform correction
        result = corrector.correct_text(text)
        
        return jsonify({
            'success': True,
            'original_text': result['original_text'],
            'corrected_text': result['corrected_text'],
            'corrections': result['corrections'],
            'statistics': result['statistics']
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'حدث خطأ أثناء التدقيق: {str(e)}'
        }), 500

@app.route('/api/suggest-addition', methods=['POST'])
def api_suggest_addition():
    """API endpoint to suggest adding a word to database"""
    try:
        data = request.get_json()
        word = data.get('word', '')
        
        if not word:
            return jsonify({
                'success': False,
                'error': 'الكلمة مطلوبة'
            }), 400
        
        suggestion = corrector.suggest_word_addition(word)
        
        if suggestion['suggest_addition']:
            word_suggestions = corrector.get_word_suggestions_for_addition(word)
            return jsonify({
                'success': True,
                'suggest_addition': True,
                'word_data': word_suggestions,
                'message': suggestion['message']
            })
        else:
            return jsonify({
                'success': True,
                'suggest_addition': False,
                'message': 'الكلمة موجودة في قاعدة البيانات'
            })
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'حدث خطأ: {str(e)}'
        }), 500

# API Routes for database management
@app.route('/api/words', methods=['GET'])
def api_get_words():
    """Get words with pagination"""
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        
        result = db_ops.get_custom_words(page=page, per_page=per_page)
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'حدث خطأ في جلب الكلمات: {str(e)}'
        }), 500

@app.route('/api/words', methods=['POST'])
def api_add_word():
    """Add a new word to the database"""
    try:
        data = request.get_json()
        
        # Validate word data
        validation = validate_word_data(data)
        if not validation['valid']:
            return jsonify({
                'success': False,
                'error': ', '.join(validation['errors'])
            }), 400
        
        result = db_ops.add_custom_word(data)
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'حدث خطأ في إضافة الكلمة: {str(e)}'
        }), 500

@app.route('/api/words/<int:word_id>', methods=['PUT'])
def api_update_word(word_id):
    """Update an existing word"""
    try:
        data = request.get_json()
        
        # Validate word data
        validation = validate_word_data(data)
        if not validation['valid']:
            return jsonify({
                'success': False,
                'error': ', '.join(validation['errors'])
            }), 400
        
        result = db_ops.update_custom_word(word_id, data)
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'حدث خطأ في تحديث الكلمة: {str(e)}'
        }), 500

@app.route('/api/words/<int:word_id>', methods=['DELETE'])
def api_delete_word(word_id):
    """Delete a word from the database"""
    try:
        result = db_ops.delete_custom_word(word_id)
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'حدث خطأ في حذف الكلمة: {str(e)}'
        }), 500

@app.route('/api/words/search')
def api_search_words():
    """Search for words in the database"""
    try:
        search_term = request.args.get('q', '')
        limit = int(request.args.get('limit', 50))
        
        if not search_term:
            return jsonify({
                'success': False,
                'error': 'مصطلح البحث مطلوب'
            }), 400
        
        result = db_ops.search_custom_words(search_term, limit)
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'حدث خطأ في البحث: {str(e)}'
        }), 500

@app.route('/api/words/<word>')
def api_get_word_details(word):
    """Get details for a specific word"""
    try:
        result = db_ops.get_word_details(word)
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'حدث خطأ في جلب تفاصيل الكلمة: {str(e)}'
        }), 500

@app.route('/api/corrections', methods=['POST'])
def api_add_correction():
    """Add a custom word correction"""
    try:
        data = request.get_json()
        original_word = data.get('original_word', '')
        corrected_word = data.get('corrected_word', '')
        confidence = float(data.get('confidence', 1.0))
        
        if not original_word or not corrected_word:
            return jsonify({
                'success': False,
                'error': 'الكلمة الأصلية والمصححة مطلوبتان'
            }), 400
        
        result = db_ops.add_word_correction(original_word, corrected_word, confidence)
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'حدث خطأ في إضافة التصحيح: {str(e)}'
        }), 500

@app.route('/api/statistics')
def api_get_statistics():
    """Get database statistics"""
    try:
        result = db_ops.get_database_statistics()
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'حدث خطأ في جلب الإحصائيات: {str(e)}'
        }), 500

@app.route('/api/database/export')
def api_export_database():
    """Export database to JSON"""
    try:
        result = db_ops.export_database()
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'حدث خطأ في تصدير قاعدة البيانات: {str(e)}'
        }), 500

@app.route('/api/database/import', methods=['POST'])
def api_import_database():
    """Import database from JSON"""
    try:
        data = request.get_json()
        import_data = data.get('data', {})
        
        if not import_data:
            return jsonify({
                'success': False,
                'error': 'بيانات الاستيراد مطلوبة'
            }), 400
        
        result = db_ops.import_database(import_data)
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'حدث خطأ في استيراد قاعدة البيانات: {str(e)}'
        }), 500

@app.route('/api/text/statistics', methods=['POST'])
def api_text_statistics():
    """Get comprehensive text statistics"""
    try:
        data = request.get_json()
        text = data.get('text', '')
        
        if not text:
            return jsonify({
                'success': False,
                'error': 'النص مطلوب'
            }), 400
        
        stats = calculate_text_statistics(text)
        
        return jsonify({
            'success': True,
            'statistics': stats
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'حدث خطأ في حساب الإحصائيات: {str(e)}'
        }), 500

# Error handlers
@app.errorhandler(404)
def not_found_error(error):
    return render_template('404.html'), 404

@app.errorhandler(500)
def internal_error(error):
    return render_template('500.html'), 500

# Template filters
@app.template_filter('format_date')
def format_date_filter(date_string):
    """Format date for display"""
    return format_date(date_string)

@app.template_filter('format_number')
def format_number_filter(number):
    """Format number for display"""
    try:
        return f"{int(number):,}".replace(',', '،')
    except:
        return str(number)

# Context processors
@app.context_processor
def inject_current_time():
    """Inject current time into all templates"""
    return {'current_time': datetime.now()}

@app.context_processor
def inject_app_info():
    """Inject app information into all templates"""
    return {
        'app_name': 'نظام التدقيق الإملائي المحسن',
        'app_version': '2.0',
        'app_year': '2025'
    }

if __name__ == '__main__':
    # Create database tables if they don't exist
    try:
        db_ops.db_manager.init_database()
        print("Database initialized successfully")
    except Exception as e:
        print(f"Error initializing database: {e}")
    
    # Run the application
    app.run(host='0.0.0.0', port=5000, debug=True)

