from flask import Flask, render_template, jsonify, request
import os
import json
from datetime import datetime
import pandas as pd
from nba_api.stats.static import players, teams
from nba_api.stats.endpoints import commonteamroster, commonplayerinfo, playergamelog

app = Flask(__name__, static_folder='static', template_folder='templates')

# Configuración
DATA_CACHE_DIR = 'data_cache'
os.makedirs(DATA_CACHE_DIR, exist_ok=True)

def get_cached_data(filename, api_call_function):
    """Función genérica para manejar caché"""
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
        print(f"Error en caché/API para {filename}: {e}")
        return []

@app.route('/')
def index():
    """Ruta principal"""
    return render_template('index.html')

@app.route('/api/search_player', methods=['GET'])
def search_player():
    query = request.args.get('query', '').lower()
    
    if len(query) < 3:
        return jsonify({'error': 'Query must be at least 3 characters'}), 400
    
    try:
        all_players = get_cached_data('players.json', players.get_players)
        results = [p for p in all_players if query in p['full_name'].lower()][:10]
        return jsonify(results)
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

@app.route('/api/team_players/<int:team_id>', methods=['GET'])
def get_team_players(team_id):
    try:
        season = request.args.get('season', '2023-24')
        roster = commonteamroster.CommonTeamRoster(team_id=team_id, season=season)
        players_data = roster.get_normalized_dict().get('CommonTeamRoster', [])
        
        formatted_players = [{
            'id': p['PLAYER_ID'],
            'name': p['PLAYER'],
            'number': p['NUM'],
            'position': p['POSITION'],
            'height': p['HEIGHT'],
            'weight': p['WEIGHT'],
            'experience': p['EXP']
        } for p in players_data]
        
        return jsonify(formatted_players)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/player/<int:player_id>', methods=['GET'])
def get_player_info(player_id):
    try:
        player_info = commonplayerinfo.CommonPlayerInfo(player_id=player_id)
        return jsonify(player_info.get_normalized_dict().get('CommonPlayerInfo', [{}])[0])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 3000))
    app.run(host='0.0.0.0', port=port)