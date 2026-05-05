# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A minimal Flask API that proxies requests to the Hugging Face Inference API (GPT-2 model). There is a single file, `app.py`, and no test suite or linting configuration.

## Setup

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Create a `.env` file (not committed) with:
```
HF_API_KEY=your_huggingface_token
```

## Running the server

```bash
python app.py
```

Server listens on `0.0.0.0:5000`.

## API

**POST /generate**

Request body: `{"text": "your prompt here"}`

The handler calls `call_hf_api`, which POSTs to the Hugging Face inference endpoint and normalizes the response: if HF returns a list with a `generated_text` field, it is unwrapped to `{"text": "..."}`. All other shapes (including errors) are passed through as-is.

## Key notes

- The env variable is `HF_API_KEY` (loaded via `python-dotenv` from `.env`).
- The file `y` in the repo root is a broken scratch copy of `app.py` — it has several bugs (`requests.json` instead of `request.json`, malformed f-string, missing space in `if __name__`). It should not be treated as authoritative.
- There is no test framework, CI, or linter configured.
