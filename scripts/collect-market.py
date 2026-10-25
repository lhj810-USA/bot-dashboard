#!/usr/bin/env python3
"""JARVIS 공개 시장 데이터 수집기 (공개 API만, 키 없음). 결과는 secrets/market.json → 암호화 페이로드에만 포함.
코인: Upbit(KRW 캔들) + CoinGecko(USD) · 주식/ETF: Yahoo chart(브라우저 CORS 불가라 박스에서 수집) · 환율: Frankfurter(ECB)+open.er-api · 날씨: Open-Meteo"""
import json,urllib.request,time,datetime,zoneinfo,os,sys
S="/workspace/bot-dashboard-secrets";OUT=S+"/market.json";CT=zoneinfo.ZoneInfo("America/Chicago")
if "--force" not in sys.argv and os.path.exists(OUT) and time.time()-os.path.getmtime(OUT)<1800: print("market fresh");sys.exit(0)
def get(u):
  r=urllib.request.Request(u,headers={"User-Agent":"Mozilla/5.0","Accept":"application/json"})
  return json.load(urllib.request.urlopen(r,timeout=20))
now=datetime.datetime.now(CT).isoformat(timespec="minutes")
try: old=json.load(open(OUT))
except Exception: old={}
M={"at":now,"coins":{},"stocks":{},"errors":[]}
COINS=[("BTC","bitcoin","비트코인"),("ETH","ethereum","이더리움"),("XRP","ripple","리플"),("SOL","solana","솔라나"),("DOGE","dogecoin","도지코인")]
for sym,cg,ko in COINS:
  c={"sym":sym,"name":ko,"krw":{},"usd":{}}
  try:
    for rg,path in(("1D","minutes/10?count=144"),("7D","minutes/60?count=168"),("90D","days?count=90")):
      a=get(f"https://api.upbit.com/v1/candles/{path}{'&' if '?' in path else '?'}market=KRW-{sym}");time.sleep(0.15)
      c["krw"][rg]=[[x["timestamp"] if rg!="90D" else int(datetime.datetime.fromisoformat(x["candle_date_time_utc"]+"+00:00").timestamp()*1000),x["trade_price"]] for x in reversed(a)]
    t=get(f"https://api.upbit.com/v1/ticker?markets=KRW-{sym}")[0];c["tick"]={"krw":t["trade_price"],"chg":round(t["signed_change_rate"]*100,2),"high":t["high_price"],"low":t["low_price"],"vol24":t["acc_trade_price_24h"]}
  except Exception as e: M["errors"].append(f"upbit {sym}: {e}")
  try:
    for rg,d in(("1D",1),("7D",7),("90D",90)):
      a=get(f"https://api.coingecko.com/api/v3/coins/{cg}/market_chart?vs_currency=usd&days={d}");time.sleep(2.2)
      p=a["prices"];step=max(1,len(p)//200);c["usd"][rg]=[[int(x[0]),round(x[1],6)] for x in p[::step]]
  except Exception as e: M["errors"].append(f"coingecko {sym}: {e}");c["usd"]=((old.get("coins") or {}).get(sym) or {}).get("usd",{})
  M["coins"][sym]=c
WL=[("SPY","S&P 500","기본"),("QQQ","나스닥 100","기본"),("005930.KS","삼성전자","기본"),("XLE","미국 에너지","위기 ETF"),("GLD","금","위기 ETF"),("ITA","항공우주·방산","위기 ETF"),("URA","우라늄","위기 ETF"),("NLR","원자력","위기 ETF"),("GRID","전력망","위기 ETF"),("SGOV","0–3개월 T-bill","위기 ETF"),("BIL","1–3개월 T-bill","위기 ETF"),("TLT","20년+ 국채","위기 ETF"),("SMH","반도체","위기 ETF"),("EWT","대만","위기 ETF"),("EWY","한국","위기 ETF")]
for sym,ko,grp in WL:
  s={"sym":sym,"name":ko,"group":grp,"series":{}}
  try:
    for rg,q in(("1D","range=1d&interval=5m"),("90D","range=3mo&interval=1d")):
      a=get(f"https://query1.finance.yahoo.com/v8/finance/chart/{sym}?{q}")["chart"]["result"][0];time.sleep(0.3)
      cl=a["indicators"]["quote"][0]["close"];s["series"][rg]=[[t*1000,round(v,4)] for t,v in zip(a["timestamp"],cl) if v is not None]
      m=a["meta"];s["cur"]=m.get("currency");s["price"]=m.get("regularMarketPrice");s["prev"]=m.get("chartPreviousClose") if rg=="1D" else s.get("prev");s["mktTime"]=m.get("regularMarketTime")
    d=s["series"]["90D"];s["chg"]=round(100*(s["price"]/d[-2][1]-1),2) if len(d)>1 and s.get("price") else None
  except Exception as e: M["errors"].append(f"yahoo {sym}: {e}");s=((old.get("stocks") or {}).get(sym)) or s
  M["stocks"][sym]=s
try:
  st=(datetime.date.today()-datetime.timedelta(days=95)).isoformat();a=get(f"https://api.frankfurter.dev/v1/{st}..?base=USD&symbols=KRW")
  M["fx"]={"series":[[k,v["KRW"]] for k,v in sorted(a["rates"].items())],"src":"Frankfurter (ECB 기준환율, 영업일)"}
  b=get("https://open.er-api.com/v6/latest/USD");M["fx"]["now"]=b["rates"]["KRW"];M["fx"]["nowAt"]=b["time_last_update_utc"]
except Exception as e: M["errors"].append(f"fx: {e}");M["fx"]=old.get("fx")
try:
  w=get("https://api.open-meteo.com/v1/forecast?latitude=30.5052&longitude=-97.8203&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m&hourly=temperature_2m,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=America%2FChicago&forecast_days=7")
  M["weather"]={"current":w["current"],"daily":w["daily"],"hourly":{"time":w["hourly"]["time"][:48],"temp":w["hourly"]["temperature_2m"][:48],"pop":w["hourly"]["precipitation_probability"][:48]},"src":"Open-Meteo"}
except Exception as e: M["errors"].append(f"weather: {e}");M["weather"]=old.get("weather")
json.dump(M,open(OUT,"w"));os.chmod(OUT,0o600);print("market ok",len(M["coins"]),len(M["stocks"]),M["errors"])
