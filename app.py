from flask import Flask, render_template, jsonify, request
import os
import json
from nba_api.stats.static import players, teams
from nba_api.stats.endpoints import commonteamroster, commonplayerinfo, playergamelog

app = Flask(__name__, static_folder='static', template_folder='templates')

# Configuración de caché
DATA_CACHE_DIR = 'data_cache'
os.makedirs(DATA_CACHE_DIR, exist_ok=True)

def get_cached_data(filename, api_call_function):
    """Obtiene datos de caché o llama a la API"""
    filepath = os.path.join(DATA_CACHE_DIR, filename)
    
    try:
        if os.path.exists(filepath):
            with open(filepath, 'r') as f:
                return json.load(f)
        
        data = api_call_function()
        
        with open(filepath, 'w') as f:
            json.dump(data, f)
            
        return data
    except Exception as e:
        print(f"Error: {e}")
        return []

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/search_player', methods=['GET'])
def search_player():
    query = request.args.get('query', '').lower()
    
    if len(query) < 3:
        return jsonify({'error': 'Query must be at least 3 characters'}), 400
    
    try:
        all_players = get_cached_data('players.json', players.get_players)
        matching_players = [
            p for p in all_players 
            if query in p['full_name'].lower()
        ][:10]
        return jsonify(matching_players)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/teams', methods=['GET'])
def get_teams():
    try:
        all_teams = sorted(
            get_cached_data('teams.json', teams.get_teams),
            key=lambda x: x['full_name']
        )
        return jsonify(all_teams)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 3000))
    app.run(host='0.0.0.0', port=port)