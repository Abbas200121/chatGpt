import requests


def get_ai_response(user_input: str) -> str:
    print("📤 Sending prompt:", user_input)

    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": "Bearer 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",  # use env var in prod
        "Content-Type": "application/json"
    }
    data = {
        "model": "mistralai/mistral-7b-instruct",
        "messages": [{"role": "user", "content": user_input}]
    }

    try:
        response = requests.post(url, headers=headers, json=data, timeout=20)
        print("🔁 Status:", response.status_code)
        print("📦 Response:", response.text)

        if response.status_code != 200:
            return f"❌ OpenRouter error: {response.status_code} - {response.text}"

        result = response.json()

        # Defensive check
        if "choices" not in result or not result["choices"]:
            return "⚠️ No response from model."

        return result["choices"][0]["message"]["content"]

    except Exception as e:
        return f"❌ Exception: {str(e)}"
