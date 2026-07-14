import pytest
import trading_math

def test_standard_deviation():
    prices = [10, 12, 23, 23, 16, 23, 21, 16]
    mean = sum(prices) / len(prices)
    std_dev = trading_math.standard_deviation(prices, mean)
    assert round(std_dev, 2) == 5.24

def test_analyze_rsi():
    prices = [44.34, 44.09, 44.15, 43.61, 44.33, 44.83, 45.10, 45.42, 45.84, 46.08, 45.89, 46.03, 45.61, 46.28, 46.28]
    rsi_data = trading_math.analyze_rsi(prices, period=14)
    assert "value" in rsi_data
    assert "signal" in rsi_data

def test_calculate_consensus():
    # Dummy trend upwards
    prices = [10.0 + i*0.5 for i in range(50)]
    result = trading_math.calculate_consensus(prices)
    
    assert "final_signal" in result
    assert "score" in result
    assert "indicators" in result
    assert 0 <= result["score"] <= 100
