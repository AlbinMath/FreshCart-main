"""
algorithms/sets.py
-------------------
Set-based keyword engine for O(1) intent classification.
All keyword sets and set-utility functions live here.
"""

import re

# ============================================================
#  INTENT KEYWORD SETS  (Python set literals for O(1) lookup)
# ============================================================

SET_GREETING    = {'hi','hello','hey','greetings','hii','hiii','howdy','sup'}
SET_COMPARE     = {'compare','vs','versus','difference','better','which','or'}
SET_PRICE_RANGE = {'under','below','above','between','budget','cheap',
                   'expensive','affordable'}
SET_BEST_DEALS  = {'deal','deals','offer','offers','discount','sale',
                   'best price','lowest','cheapest','promo'}
SET_NUTRITION   = {'nutrition','calorie','calories','protein','carb','carbs',
                   'fat','vitamin','minerals','healthy','organic',
                   'benefits','nutrients'}
SET_CATEGORY    = {'category','categories','type','types','section','sections',
                   'vegetable','vegetables','meat','fish','seafood','dairy',
                   'fruit','fruits','egg','eggs','spice','spices',
                   'ingredient','ingredients'}
SET_STOCK_KW    = {'stock','available','availability','left'}
SET_PRODUCT_KW  = {'price','cost','show','find','buy','want',
                   'looking','search','get','need'}
SET_REVIEW_KW   = {'review','rating','feedback','rated','stars'}
SET_ORDER_NAV   = {'nav_orders', 'my orders', 'order history', 'track', 'status'}
SET_ADDRESS     = {'address', 'delivery address', 'where I live', 'location', 'home', 'street', 'city', 'state', 'zip'}
SET_NOTIF       = {'notification', 'notifications', 'alert', 'alerts', 'message', 'messages', 'unread'}
SET_REPORT      = {'report', 'issue', 'problem', 'problematic', 'wrong', 'mistake', 'error', 'bug', 'broken', 'complain', 'complaint'}
SET_TAX         = {'tax', 'taxes', 'gst', 'vat', 'charge', 'charges', 'billing'}
SET_POLICY      = {'policy', 'policies', 'refund', 'return', 'cancellation', 'cancel', 'returnable', 'guarantee'}
SET_TRACKING    = {'track', 'tracking', 'where is my', 'order status', 'live', 'location', 'map', 'agent'}
SET_NON_FOOD    = {
    'gold','silver','jewelry','jewellery','diamond','electronics',
    'mobile','phone','laptop','computer','tv','television','furniture',
    'sofa','chair','table','bed','vehicle','car','bike','scooter',
    'motorcycle','house','property','land','flat','apartment','clothes',
    'clothing','dress','shirt','shoes','cosmetics','makeup','perfume',
    'toys','games','books','medicine','medicines','drugs','alcohol',
    'liquor','cigarette','tobacco','watch','watches','bags','bag'
}
SET_FOOD_ITEMS  = {
    'vegetable','vegetables','meat','fish','dairy','fruit','fruits',
    'chicken','mutton','egg','eggs','milk','cheese','butter','onion',
    'tomato','potato','carrot','cabbage','spinach','apple','banana',
    'mango','orange','grape','grapes','beef','pork','prawn','shrimp',
    'curd','yogurt','paneer','rice','wheat','flour','oil','salt',
    'sugar','pepper','turmeric','coriander'
}

# Synonym expansion map for price-range keyword queries
FOOD_SYNONYMS = {
    'veggie'  : SET_FOOD_ITEMS,
    'veggies' : SET_FOOD_ITEMS,
    'greens'  : {'spinach','cabbage','coriander','vegetable','vegetables'},
    'protein' : {'chicken','mutton','beef','egg','eggs','fish','paneer'},
    'poultry' : {'chicken','egg','eggs'},
}

# ============================================================
#  UTILITY FUNCTIONS
# ============================================================

def tokenize(text: str) -> set:
    """Convert a string into a set of lowercase word-tokens (O(1) lookup)."""
    return set(re.findall(r'\b\w+\b', text.lower()))


def set_match(token_set: set, keyword_set: set, threshold: int = 1) -> bool:
    """True if token_set and keyword_set share at least `threshold` words."""
    return len(token_set & keyword_set) >= threshold


def phrase_match(text_lower: str, phrase_set: set) -> bool:
    """True if any phrase in phrase_set is a substring of text_lower."""
    return any(p in text_lower for p in phrase_set)


def extract_price_bounds(text: str) -> dict:
    """
    Extract numeric price bounds from natural-language text.
    Returns {'min': int|None, 'max': int|None}.
    """
    bounds = {'min': None, 'max': None}
    # between X and Y
    m = re.search(r'between\s+(\d+)\s+and\s+(\d+)', text, re.I)
    if m:
        bounds['min'] = int(m.group(1))
        bounds['max'] = int(m.group(2))
        return bounds
    # under / below / less than X
    m = re.search(r'(?:under|below|less than)\s+(\d+)', text, re.I)
    if m:
        bounds['max'] = int(m.group(1))
        return bounds
    # above / over / more than / greater than X
    m = re.search(r'(?:above|over|more than|greater than)\s+(\d+)', text, re.I)
    if m:
        bounds['min'] = int(m.group(1))
        return bounds
    return bounds


def extract_compare_products(message: str):
    """
    Split a comparison query into two product name strings.
    Uses set-based separator detection (vs, versus, or, and).
    Returns (name1, name2) or (None, None).
    """
    separators = [' vs ', ' versus ', ' or ', ' and ']
    for sep in separators:
        if sep in message.lower():
            parts = re.split(sep, message, flags=re.I, maxsplit=1)
            if len(parts) == 2:
                def clean(s):
                    return re.sub(
                        r'\b(compare|price|show|which|between|the|of|\?)\b',
                        '', s, flags=re.I
                    ).strip()
                return clean(parts[0]), clean(parts[1])
    return None, None
