import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv(dotenv_path='../.env')

api_key = os.getenv('GROQ_API_KEY')
client = Groq(api_key=api_key)

models = [
    "mixtral-8x7b-32768"
]

print("Testing actual completion calls...")
for model in models:
    print(f"Testing {model}...")
    try:
        completion = client.chat.completions.create(
            messages=[{"role": "user", "content": "Hello"}],
            model=model,
        )
        print(f"SUCCESS: {model}")
    except Exception as e:
        print(f"FAILED: {model} - {e}")

