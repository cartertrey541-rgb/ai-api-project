from flask import Flask, request, jsonify
import requests
from dotenv import load_dotenv
import os

# Load Hugging Face API token from .env
load_dotenv()

app = Flask(__name__)

API_URL = "https://api-inference.huggingface.co/models/gpt2"
HEADERS = {"Authorization": f"Bearer {os.getenv('HF_API_KEY')}"}

def call_hf_api(payload):
    response = requests.post(API_URL, headers=HEADERS, json=payload)
    try:
        data = response.json()
        if isinstance(data, list) and "generated_text" in data[0]:
            return {"text": data[0]["generated_text"]}
        return data
    except Exception as e:
        return {"error": str(e)}

@app.route("/generate", methods=["POST"])
def generate():
    user_input = request.json.get("text")
    output = call_hf_api({"inputs": user_input})
    return jsonify(output)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
