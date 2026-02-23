"""
algorithms/intent.py
---------------------
Intent classifier that uses Python set operations (O(1) per keyword)
to route every user message to a named intent string.
"""

import re
from algorithms.sets import (
    SET_GREETING, SET_COMPARE, SET_PRICE_RANGE, SET_BEST_DEALS,
    SET_NUTRITION, SET_CATEGORY, SET_STOCK_KW, SET_PRODUCT_KW,
    SET_REVIEW_KW, SET_NON_FOOD, SET_FOOD_ITEMS,
    SET_ADDRESS, SET_NOTIF, SET_REPORT, SET_TAX, SET_POLICY, SET_TRACKING,
    tokenize, set_match, phrase_match, extract_compare_products
)

# ─── Add-to-cart regex (compiled once) ───────────────────────────────────────
_ADD_CART_RE = re.compile(
    r'add\s+\w+.*\s*(to|in)\s*cart|add\s+to\s+cart|add\s+in\s+cart|put\s+in\s+cart'
)


def classify_intent(message: str) -> str:
    """
    Map a raw user message to one of the named intents below.

    Intent catalogue
    ────────────────
    greeting            nav_cart            nav_orders
    nav_logout          nav_login           nav_home
    add_to_cart         stock_inquiry       cart_inquiry
    review_inquiry      delivery_inquiry    order_tracking
    product_search      product_list        product_compare
    price_range         best_deals          nutrition_info
    category_browse     store_inquiry       non_food_product
    seller_registration delivery_registration
    pagination          help                faq   (default)
    """
    ml  = message.lower().strip()
    tok = tokenize(ml)           # set of word-tokens for O(1) lookup
    wc  = len(ml.split())

    # 1 ── GREETING ─────────────────────────────────────────────────────────
    if tok & SET_GREETING and wc <= 3:
        return 'greeting'

    # 2 ── CONVERSATIONAL / FAQ ─────────────────────────────────────────────
    _conv = {'where are you','where you','who are you','who you','what are you',
             'how are you','how do','can you','could you','thanks','thank you',
             'thank','bye','goodbye','ok','okay','what is freshcart',
             'about freshcart','what do you do'}
    if phrase_match(ml, _conv):
        return 'faq'

    # 3 ── NAVIGATION ────────────────────────────────────────────────────────
    if phrase_match(ml, {'go to cart','goto cart','open cart','view cart',
                         'show cart','check cart'}):
        return 'nav_cart'
    if phrase_match(ml, {'go to order','goto order','my orders','view orders',
                         'show orders','order page','order history'}):
        return 'nav_orders'
    if phrase_match(ml, {'logout','log out','sign out','signout','do logout'}):
        return 'nav_logout'
    if phrase_match(ml, {'login','log in','sign in','signin','do login'}):
        return 'nav_login'
    if phrase_match(ml, {'go home','goto home','home page','main page','go to home'}):
        return 'nav_home'

    # 4 ── ADD TO CART (regex) ───────────────────────────────────────────────
    if _ADD_CART_RE.search(ml):
        return 'add_to_cart'

    # 5 ── SET-BASED NEW INTENTS ─────────────────────────────────────────────
    # Product comparison  (set intersection: compare-kw AND food-kw present)
    if set_match(tok, SET_COMPARE) and set_match(tok, SET_FOOD_ITEMS | SET_PRODUCT_KW):
        p1, p2 = extract_compare_products(ml)
        if p1 and p2:
            return 'product_compare'

    # Price range  (set intersection: price-kw AND digit present)
    if set_match(tok, SET_PRICE_RANGE) and (
            set_match(tok, SET_FOOD_ITEMS | SET_PRODUCT_KW) or
            re.search(r'\d+', ml)):
        return 'price_range'

    # Best deals  (set intersection with deal keywords)
    if set_match(tok, SET_BEST_DEALS):
        return 'best_deals'

    # Nutrition info  (set intersection with nutrition keywords)
    if set_match(tok, SET_NUTRITION):
        return 'nutrition_info'

    # Category browse  (set intersection: category-kw AND browse verb)
    _browse = {'show','list','browse','all','what','any','types',
               'category','categories','type','types'}
    if set_match(tok, SET_CATEGORY) and set_match(tok, _browse):
        return 'category_browse'

    # 6 ── STANDARD INTENTS ─────────────────────────────────────────────────
    if set_match(tok, SET_STOCK_KW) or phrase_match(ml, {'in stock','out of stock','how many','quantity available'}):
        return 'stock_inquiry'

    if phrase_match(ml, {'my cart','cart items','basket','shopping cart'}):
        return 'cart_inquiry'

    if set_match(tok, SET_REVIEW_KW):
        return 'review_inquiry'

    if phrase_match(ml, {'delivery info','delivery agents','delivery agent',
                         'deliveries','delivery time','delivery process'}):
        return 'delivery_inquiry'

    if phrase_match(ml, {'order','track','my delivery','status','where is my',
                         'history','past orders','previous orders','all orders'}):
        if set_match(tok, {'live', 'location', 'map', 'position', 'agent'}):
            return 'live_tracking'
        return 'order_tracking'

    if set_match(tok, SET_PRODUCT_KW):
        return 'product_search'

    if phrase_match(ml, {'help','what can you do','features'}):
        return 'help'

    if phrase_match(ml, {'product','products','all products','list products',
                         'show all','all items','menu','catalog'}):
        return 'product_list'

    if set_match(tok, {'next','more','continue'}):
        return 'pagination'

    if set_match(tok, {'store', 'stores', 'shop', 'shops', 'seller', 'sellers',
                       'vendor', 'vendors'}):
        return 'store_inquiry'

    if set_match(tok, SET_ADDRESS):
        return 'address_inquiry'

    if set_match(tok, SET_NOTIF):
        return 'notif_inquiry'

    if set_match(tok, SET_REPORT):
        return 'report_issue'

    if set_match(tok, SET_TAX):
        return 'tax_inquiry'

    if set_match(tok, SET_POLICY):
        return 'policy_inquiry'

    if phrase_match(ml, {'dispatch', 'pending dispatch', 'dispatch queue', 'how many orders are pending', 'dispatch status'}):
        return 'dispatch_inquiry'

    # Non-food:  tokens in non-food set BUT none from food set (set difference)
    if (tok & SET_NON_FOOD) and not (tok & SET_FOOD_ITEMS):
        return 'non_food_product'

    if phrase_match(ml, {'sell','become seller','seller registration',
                         'register seller','start selling','want to sell'}):
        return 'seller_registration'

    if phrase_match(ml, {'become agent','delivery agent registration',
                         'register delivery','delivery job',
                         'join delivery','agent registration'}):
        return 'delivery_registration'

    # Food tokens without a specific intent → plain product search
    if tok & SET_FOOD_ITEMS:
        return 'product_search'

    # Single meaningful word → try product search
    if wc == 1 and len(ml) > 2:
        return 'product_search'

    return 'faq'
