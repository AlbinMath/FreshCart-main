from textblob import TextBlob
import sys

try:
    text = "This is a test review. It is very good."
    analysis = TextBlob(text)
    print(f"Polarity: {analysis.sentiment.polarity}")
    print("SUCCESS")
except Exception as e:
    print(f"ERROR: {e}")
    import traceback
    traceback.print_exc()
