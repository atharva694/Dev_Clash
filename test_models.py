import os
from google import genai
from dotenv import load_dotenv

load_dotenv(".env.local")

keys = [
    os.getenv("GEMINI_API_KEY"),
    os.getenv("GEMINI_API_KEY_2"),
    os.getenv("GEMINI_API_KEY_3"),
    os.getenv("GEMINI_API_KEY_4"),
    os.getenv("GEMINI_API_KEY_5")
]

keys = [k.strip() for k in keys if k and k.strip()]

for i, key in enumerate(keys):
    print(f"\n--- Testing Key {i+1} ---")
    try:
        client = genai.Client(api_key=key)
        models = client.models.list()
        
        supported = []
        for model in models:
            if "generateContent" in model.supported_actions:
                supported.append(model.name)
                
        print(f"Key {i+1} is VALID!")
        print("Available models:")
        for name in supported:
            print(f"- {name}")
        break  # We only need to see the models for one valid key
    except Exception as e:
        print(f"Key {i+1} FAILED with error: {str(e)}")
