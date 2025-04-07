from flask import Flask, render_template, jsonify, request
import os
import json
import requests
from datetime import datetime
import pandas as pd
import time

app = Flask(__name__, static_folder='static', template_folder='templates')

# Función para obtener lista de jugadores
def get_all_players():
    try:
        # Intentamos cargar desde el archivo local primero para evitar llamadas API innecesarias
        if os.path.exists('players_data.json'):
            with open('players_data.json', 'r') as f:
                return json.load(f)
        
        # Si no existe el archivo, hacemos la llamada a la API
        from nba_api.stats.static import players
        all_players = players.get_players()
        
        # Guardamos los datos para uso futuro
        with open('players_data.json', 'w') as f:
            json.dump(all_players, f)
            
        return all_players
    except Exception as e:
        print(f"Error obteniendo jugadores: {e}")
        return []

# Función para obtener lista de equipos
def get_all_teams():
    try:
        # Intentamos cargar desde el archivo local primero para evitar llamadas API innecesarias
        if os.path.exists('teams_data.json'):
            with open('teams_data.json', 'r') as f:
                return json.load(f)
        
        # Si no existe el archivo, hacemos la llamada a la API
        from nba_api.stats.static import teams
        all_teams = teams.get_teams()
        
        # Guardamos los datos para uso futuro
        with open('teams_data.json', 'w') as f:
            json.dump(all_teams, f)
            
        return all_teams
    except Exception as e:
        print(f"Error obteniendo equipos: {e}")
        return []

# Ruta principal
@app.route('/')
def index():
    return render_template('index.html')

# Ruta para buscar jugadores
@app.route('/api/search_player', methods=['GET'])
def search_player():
    query = request.args.get('query', '').lower()
    
    if not query or len(query) < 3:
        return jsonify({'error': 'La consulta debe tener al menos 3 caracteres'}), 400
    
    all_players = get_all_players()
    
    # Filtrar jugadores que coincidan con la consulta
    matching_players = [
        player for player in all_players 
        if query in player['full_name'].lower()
    ]
    
    # Ordenar por relevancia (exactitud de la coincidencia)
    matching_players.sort(key=lambda x: x['full_name'].lower().find(query))
    
    # Limitar a 10 resultados
    return jsonify(matching_players[:10])

# Ruta para obtener todos los equipos
@app.route('/api/teams', methods=['GET'])
def get_teams():
    try:
        all_teams = get_all_teams()
        # Ordenar por nombre del equipo
        all_teams.sort(key=lambda x: x['full_name'])
        return jsonify(all_teams)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Ruta para obtener jugadores por equipo
@app.route('/api/team_players/<int:team_id>', methods=['GET'])
def get_team_players(team_id):
    try:
        from nba_api.stats.endpoints import commonteamroster
        
        # Obtener la temporada actual o la seleccionada
        season = request.args.get('season', '2024-25')
        
        # Obtener el roster del equipo
        team_roster = commonteamroster.CommonTeamRoster(team_id=team_id, season=season)
        roster_dict = team_roster.get_normalized_dict()
        
        # Extraer datos relevantes
        players_list = roster_dict['CommonTeamRoster'] if 'CommonTeamRoster' in roster_dict else []
        
        # Formatear la respuesta
        formatted_players = []
        for player in players_list:
            formatted_players.append({
                'id': player['PLAYER_ID'],
                'name': player['PLAYER'],
                'number': player['NUM'],
                'position': player['POSITION'],
                'height': player['HEIGHT'],
                'weight': player['WEIGHT'],
                'experience': player['EXP']
            })
        
        return jsonify(formatted_players)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Ruta para obtener información detallada del jugador
@app.route('/api/player/<int:player_id>', methods=['GET'])
def get_player_info(player_id):
    try:
        from nba_api.stats.endpoints import commonplayerinfo
        
        # Obtener información básica del jugador
        player_info = commonplayerinfo.CommonPlayerInfo(player_id=player_id)
        player_info_dict = player_info.get_normalized_dict()
        
        # Extraer datos relevantes
        common_player_info = player_info_dict['CommonPlayerInfo'][0] if player_info_dict['CommonPlayerInfo'] else {}
        
        return jsonify(common_player_info)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Ruta para obtener estadísticas de partidos del jugador
@app.route('/api/player_games/<int:player_id>', methods=['GET'])
def get_player_games(player_id):
    try:
        # Parámetros de filtro
        season = request.args.get('season', '2024-25')
        season_type = request.args.get('season_type', 'Regular Season')
        last_n_games = int(request.args.get('last_n_games', 5))
        
        from nba_api.stats.endpoints import playergamelog
        
        # Obtener registro de partidos del jugador
        game_log = playergamelog.PlayerGameLog(
            player_id=player_id,
            season=season,
            season_type_all_star=season_type
        )
        
        # Convertir a DataFrame para facilitar el procesamiento
        df = game_log.get_data_frames()[0]
        
        # Limitar a los últimos N partidos
        if not df.empty and len(df) > last_n_games:
            df = df.head(last_n_games)
        
        # Calcular promedios
        averages = {
            'PTS': df['PTS'].mean() if not df.empty else 0,
            'REB': df['REB'].mean() if not df.empty else 0,
            'AST': df['AST'].mean() if not df.empty else 0,
            'FG3M': df['FG3M'].mean() if not df.empty else 0,
            'BLK': df['BLK'].mean() if not df.empty else 0,
            'STL': df['STL'].mean() if not df.empty else 0,
            'MIN': df['MIN'].mean() if not df.empty else 0
        }
        
        # Convertir DataFrame a lista de diccionarios para JSON
        games = df.to_dict('records') if not df.empty else []
        
        return jsonify({
            'games': games,
            'averages': averages
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
