import requests

def generate_image(prompt):
    url = f"https://lexica.art/api/v1/search?q={prompt}"
    response = requests.get(url)

    print("Status Code:", response.status_code)
    print("Raw Response Text:", response.text[:300])  # Print first 300 chars

    if response.status_code == 200:
        try:
            data = response.json()
            if data.get("images"):
                return data["images"][0]["src"]
            else:
                return "❌ No image found in response."
        except Exception as e:
            return f"❌ JSON decode error: {e}"
    else:
        return f"❌ Request failed with status {response.status_code}"

# Example
if __name__ == "__main__":
    img = generate_image("a cyberpunk robot reading a book")
    print("Image URL:", img)
