import requests

def get_ai_response(user_input: str) -> str:
    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": "Bearer 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",  # replace with your key
        "Content-Type": "application/json"
    }
    data = {
        "model": "mistralai/mistral-7b-instruct",
        "messages": [{"role": "user", "content": user_input}]
    }

    try:
        response = requests.post(url, headers=headers, json=data, timeout=20)
        result = response.json()
        return result["choices"][0]["message"]["content"]
    except Exception as e:
        return f"❌ Exception: {str(e)}"
