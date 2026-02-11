import requests
import random
import time

API_BASE_URL = "http://localhost:8000/api/leaderboard"

def submit_score(user_id):
    score = random.randint(100, 10000)
    try:
        requests.post(f"{API_BASE_URL}/submit", json={"user_id": user_id, "score": score})
        print(f"submitted score {score} for user {user_id}")
    except Exception as e:
        print(f"submit failed: {e}")

def get_top_players():
    try:
        response = requests.get(f"{API_BASE_URL}/top")
        return response.json()
    except Exception as e:
        print(f"get top failed: {e}")
        return None

def get_user_rank(user_id):
    try:
        response = requests.get(f"{API_BASE_URL}/rank/{user_id}")
        return response.json()
    except Exception as e:
        print(f"get rank failed: {e}")
        return None

if __name__ == "__main__":
    print("starting load simulation...")
    while True:
        user_id = random.randint(1, 1000000)
        submit_score(user_id)
        top = get_top_players()
        if top and top.get("success"):
            print(f"top players: {top['data'][:3]}")
        rank = get_user_rank(user_id)
        if rank and rank.get("success"):
            print(f"user {user_id} rank: {rank['data']}")
        time.sleep(random.uniform(0.5, 2))
