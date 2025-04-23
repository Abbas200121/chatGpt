import requests
import time

def generate_image(prompt: str):
    # 1. Send the async generation request
    response = requests.post(
        "https://stablehorde.net/api/v2/generate/async",
        json={
            "prompt": prompt,
            "params": {
                "n": 1,
                "width": 512,
                "height": 512
            }
        },
        headers={"Content-Type": "application/json", "Client-Agent": "my-fastapi-app"}
    )

    if response.status_code != 200:
        print("❌ Failed to queue request:", response.text)
        return None

    request_id = response.json()["id"]
    print("🕒 Waiting for image generation...")

    # 2. Poll the results
    while True:
        poll = requests.get(f"https://stablehorde.net/api/v2/generate/status/{request_id}")
        poll_data = poll.json()
        if poll_data.get("done", False):
            image_url = poll_data["generations"][0]["img"]
            print("✅ Image Ready:", image_url)
            return image_url
        time.sleep(3)  # Wait before polling again


def poll_stablehorde_status(request_id: str, api_key: str, client_agent: str = "chatGpt_backend", max_retries: int = 60,
                            delay: int = 5) -> str:
    url = f"https://stablehorde.net/api/v2/generate/status/{request_id}"
    headers = {
        "apikey": api_key,
        "Client-Agent": client_agent
    }

    for attempt in range(max_retries):
        response = requests.get(url, headers=headers)
        print(f"⏳ Attempt {attempt + 1} - Status: {response.status_code}")
        if response.status_code != 200:
            return None

        data = response.json()
        if data.get("done") and data.get("generations"):
            return data["generations"][0]["img"]

        time.sleep(delay)

    return None
