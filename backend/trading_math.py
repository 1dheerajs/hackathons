import math

def calculate_ema(prices: list[float], period: int) -> list[float]:
    """Calculates Exponential Moving Average without Pandas."""
    if not prices or len(prices) < period:
        return []
    
    multiplier = 2 / (period + 1)
    emas = [sum(prices[:period]) / period]  # Start with SMA
    
    for price in prices[period:]:
        emas.append((price - emas[-1]) * multiplier + emas[-1])
        
    return emas

def calculate_sma(prices: list[float], period: int) -> list[float]:
    """Calculates Simple Moving Average without Pandas."""
    if not prices or len(prices) < period:
        return []
    smas = []
    for i in range(period, len(prices) + 1):
        smas.append(sum(prices[i-period:i]) / period)
    return smas

def standard_deviation(prices: list[float], mean: float) -> float:
    """Calculates sample standard deviation."""
    if not prices or len(prices) < 2: return 0.0
    variance = sum((x - mean) ** 2 for x in prices) / (len(prices) - 1)
    return math.sqrt(variance)

def analyze_rsi(prices: list[float], period: int = 14) -> dict:
    if len(prices) < period + 1:
        return {"value": 50.0, "signal": "HOLD"}
        
    gains = []
    losses = []
    
    for i in range(1, len(prices)):
        change = prices[i] - prices[i-1]
        if change > 0:
            gains.append(change)
            losses.append(0.0)
        else:
            gains.append(0.0)
            losses.append(abs(change))
            
    avg_gain = sum(gains[:period]) / period
    avg_loss = sum(losses[:period]) / period
    
    for i in range(period, len(prices) - 1):
        avg_gain = (avg_gain * (period - 1) + gains[i]) / period
        avg_loss = (avg_loss * (period - 1) + losses[i]) / period
        
    if avg_loss == 0:
        rsi = 100.0
    else:
        rs = avg_gain / avg_loss
        rsi = 100.0 - (100.0 / (1.0 + rs))
        
    signal = "HOLD"
    if rsi < 30: signal = "BUY"
    elif rsi > 70: signal = "SELL"
    
    return {"value": round(rsi, 2), "signal": signal}

def analyze_macd(prices: list[float], short_period: int = 12, long_period: int = 26, signal_period: int = 9) -> dict:
    if len(prices) < long_period + signal_period:
        return {"macd": 0, "signal_line": 0, "histogram": 0, "signal": "HOLD"}
        
    short_ema = calculate_ema(prices, short_period)
    long_ema = calculate_ema(prices, long_period)
    
    # Align EMA lengths
    alignment_offset = len(short_ema) - len(long_ema)
    short_ema_aligned = short_ema[alignment_offset:]
    
    macd_line = [s - l for s, l in zip(short_ema_aligned, long_ema)]
    signal_line = calculate_ema(macd_line, signal_period)
    
    if not macd_line or not signal_line:
        return {"macd": 0, "signal_line": 0, "histogram": 0, "signal": "HOLD"}
        
    current_macd = macd_line[-1]
    current_signal_line = signal_line[-1]
    histogram = current_macd - current_signal_line
    
    # Check for crossover in the last 2 periods
    prev_macd = macd_line[-2] if len(macd_line) > 1 else current_macd
    prev_signal = signal_line[-2] if len(signal_line) > 1 else current_signal_line
    
    signal = "HOLD"
    if prev_macd <= prev_signal and current_macd > current_signal_line:
        signal = "BUY"
    elif prev_macd >= prev_signal and current_macd < current_signal_line:
        signal = "SELL"
    else:
        # If no recent crossover, use histogram momentum but with a HOLD threshold
        threshold = prices[-1] * 0.0005 if prices else 0.001
        if histogram > threshold: signal = "BUY"
        elif histogram < -threshold: signal = "SELL"
        
    return {
        "macd": round(current_macd, 4), 
        "signal_line": round(current_signal_line, 4), 
        "histogram": round(histogram, 4),
        "signal": signal
    }

def analyze_bollinger_bands(prices: list[float], period: int = 20, multiplier: float = 2.0) -> dict:
    if len(prices) < period:
        return {"upper": 0, "lower": 0, "middle": 0, "signal": "HOLD"}
        
    recent_prices = prices[-period:]
    sma = sum(recent_prices) / period
    std_dev = standard_deviation(recent_prices, sma)
    
    upper_band = sma + (std_dev * multiplier)
    lower_band = sma - (std_dev * multiplier)
    current_price = prices[-1]
    
    signal = "HOLD"
    if current_price <= lower_band: signal = "BUY"
    elif current_price >= upper_band: signal = "SELL"
    
    return {
        "upper": round(upper_band, 4),
        "lower": round(lower_band, 4), 
        "middle": round(sma, 4),
        "signal": signal
    }

def analyze_ema_crossover(prices: list[float], short_period: int = 9, long_period: int = 21) -> dict:
    if len(prices) < long_period:
        return {"short_ema": 0, "long_ema": 0, "signal": "HOLD"}
        
    short_ema = calculate_ema(prices, short_period)
    long_ema = calculate_ema(prices, long_period)
    
    if not short_ema or not long_ema:
         return {"short_ema": 0, "long_ema": 0, "signal": "HOLD"}
         
    current_short = short_ema[-1]
    current_long = long_ema[-1]
    prev_short = short_ema[-2] if len(short_ema) > 1 else current_short
    prev_long = long_ema[-2] if len(long_ema) > 1 else current_long
    
    signal = "HOLD"
    threshold = current_long * 0.001 # 0.1% difference threshold
    if prev_short <= prev_long and current_short > current_long: signal = "BUY"
    elif prev_short >= prev_long and current_short < current_long: signal = "SELL"
    elif current_short > current_long + threshold: signal = "BUY"
    elif current_short < current_long - threshold: signal = "SELL"
    
    return {
        "short_ema": round(current_short, 4),
        "long_ema": round(current_long, 4),
        "signal": signal
    }

def calculate_consensus(prices: list[float]) -> dict:
    """Runs all 4 math models and generates a consensus signal."""
    rsi_data = analyze_rsi(prices)
    macd_data = analyze_macd(prices)
    bb_data = analyze_bollinger_bands(prices)
    ema_data = analyze_ema_crossover(prices)
    
    signals = [rsi_data["signal"], macd_data["signal"], bb_data["signal"], ema_data["signal"]]
    
    buy_votes = signals.count("BUY")
    sell_votes = signals.count("SELL")
    
    final_signal = "HOLD"
    if buy_votes == 4: final_signal = "STRONG BUY"
    elif buy_votes == 3: final_signal = "BUY"
    elif sell_votes == 4: final_signal = "STRONG SELL"
    elif sell_votes == 3: final_signal = "SELL"
    elif buy_votes > sell_votes: final_signal = "BUY (LEAN)"
    elif sell_votes > buy_votes: final_signal = "SELL (LEAN)"
    
    # Smooth continuous scoring incorporating RSI
    rsi_val = rsi_data["value"]
    base_score = 50.0 + (rsi_val - 50.0) * 0.4  # RSI contributes +/- 20
    
    if buy_votes > sell_votes:
        base_score += 15.0 * (buy_votes - sell_votes) / max(1, buy_votes)
    elif sell_votes > buy_votes:
        base_score -= 15.0 * (sell_votes - buy_votes) / max(1, sell_votes)
        
    score = max(0.0, min(100.0, base_score))
    
    return {
        "final_signal": final_signal,
        "score": round(score, 1),
        "indicators": {
            "rsi": rsi_data,
            "macd": macd_data,
            "bollinger_bands": bb_data,
            "ema_crossover": ema_data
        }
    }
