import os
import requests
from dotenv import load_dotenv

load_dotenv(override=True)  # Force reload `.env`

AI_API_URL = os.getenv("AI_API_URL")
AI_API_KEY = os.getenv("AI_API_KEY")

print(f"Using AI_API_URL: {AI_API_URL}")  # Debugging
print(f"Using AI_API_KEY: {AI_API_KEY[:10]}****")  # Debugging (Partial for security)

def get_ai_response(user_input: str) -> str:
    headers = {"Authorization": f"Bearer {AI_API_KEY}"}
    data = {"inputs": user_input}

    print(f"Sending request to: {AI_API_URL}")  # Debugging
    print(f"Data Sent: {data}")  # Debugging

    response = requests.post(AI_API_URL, json=data, headers=headers)

    print(f"Response Status Code: {response.status_code}")  # Debugging
    print(f"Response Content: {response.json()}")  # Debugging

    if response.status_code == 200:
        return response.json()[0]["generated_text"]
    else:
        return f"AI API error: {response.json()}"
