from flask import Flask, request, jsonify$
import requests$
from dotenv import load_dotenv$
import os$
$
load_dotenv() # load HF_API_KEY from .env$
$
app=Flask(__name__)$
$
API_URL="https://api-inference.huggingface.co/models/gpt2"$
HEADERS={"Authorization":f"Bearer{os.getenv('Hf_API_KEY')}"}$
$
def query(payload):$
    response=requests.post(API_URL, headers=HEADERS, json=payload)$
    return response.json()$
$
@app.route("/generate",methods=["POST"])$
def generate():$
    user_input=requests.json.get("text")$
    output=query({"inputs":user_input})$
    return jsonify(output)$
$
if__name__=="__main__":$
    app.run(host="0.0.0.0", port=5000)$
