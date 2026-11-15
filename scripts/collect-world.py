#!/usr/bin/env python3
"""세계 지도·정세용 공개 소스 수집 (키 없음). USGS 지진, GDELT 기사, Wikipedia 오늘, 세계 시계·시장 개장.
결과는 비밀 폴더 world.json → 암호화 페이로드로만 배포. 실패는 errors에 기록하고 지어내지 않음.
30분 이내 파일이 있으면 건너뜀 (--force 로 강제)."""
import json,os,re,sys,time,urllib.request,datetime as dt,html as HTML,zoneinfo
SEC="/workspace/bot-dashboard-secrets";OUT=SEC+"/world.json"
if os.path.exists(OUT) and time.time()-os.path.getmtime(OUT)<30*60 and "--force" not in sys.argv: sys.exit(0)
UA={"User-Agent":"Mozilla/5.0 (compatible; JARVIS-dash/17; +https://github.com/lhj810-USA/bot-dashboard)","Accept":"application/json,text/html,*/*"}
def get(u,t=18):
    return urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=t).read()
errs=[];now=dt.datetime.now().astimezone()

# City-level pins only (same Cedar Park coords already used for Open-Meteo in collect-market.py)
pins=[
 {"id":"home","kind":"home","label":"홈 · Cedar Park","city":"Cedar Park","region":"TX","lat":30.5052,"lon":-97.8203},
 {"id":"kr","kind":"home","label":"한국 · 서울","city":"서울","region":"KR","lat":37.5665,"lon":126.9780},
 {"id":"nyse","kind":"mkt","label":"NYSE / Nasdaq","city":"New York","tz":"America/New_York","open":["09:30","16:00"],"lat":40.7069,"lon":-74.0113},
 {"id":"krx","kind":"mkt","label":"한국거래소","city":"서울","tz":"Asia/Seoul","open":["09:00","15:30"],"lat":37.5220,"lon":126.9270},
 {"id":"lse","kind":"mkt","label":"LSE","city":"London","tz":"Europe/London","open":["08:00","16:30"],"lat":51.515,"lon":-0.090},
 {"id":"tse","kind":"mkt","label":"도쿄증권거래소","city":"東京","tz":"Asia/Tokyo","open":["09:00","15:00"],"lat":35.682,"lon":139.767},
 {"id":"crypto","kind":"mkt","label":"Crypto 24h","city":"—","tz":"UTC","open":None,"lat":0,"lon":0,"always":True},
]

def mkt_open(p, when=None):
    if p.get("always"): return True
    tz=zoneinfo.ZoneInfo(p["tz"]); t=(when or dt.datetime.now(tz)).astimezone(tz)
    if t.weekday()>=5: return False
    a,b=p["open"]; hm=t.strftime("%H:%M")
    return a<=hm<=b

for p in pins:
    if p["kind"]=="mkt":
        p["isOpen"]=mkt_open(p)
        tz=zoneinfo.ZoneInfo(p["tz"] or "UTC")
        p["local"]=dt.datetime.now(tz).strftime("%H:%M")

clocks=[]
for label,tz in [("Austin","America/Chicago"),("Seoul","Asia/Seoul"),("UTC","UTC")]:
    z=zoneinfo.ZoneInfo(tz); t=dt.datetime.now(z)
    clocks.append({"label":label,"tz":tz,"iso":t.isoformat(timespec="minutes"),"hhmm":t.strftime("%H:%M"),"dow":t.strftime("%a"),"date":t.strftime("%Y-%m-%d")})

quakes=[]
try:
    geo=json.loads(get("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_week.geojson"))
    for f in (geo.get("features") or [])[:40]:
        pr=f.get("properties") or {}; g=f.get("geometry") or {}
        c=g.get("coordinates") or [None,None,None]
        quakes.append({"id":f.get("id"),"mag":pr.get("mag"),"place":pr.get("place"),"ts":pr.get("time"),"url":pr.get("url"),"lon":c[0],"lat":c[1],"depth":c[2],"src":"USGS"})
        pins.append({"id":"q:"+str(f.get("id")),"kind":"quake","label":f"M{pr.get('mag')} {pr.get('place')}","lat":c[1],"lon":c[0],"url":pr.get("url"),"mag":pr.get("mag")})
except Exception as ex: errs.append(f"USGS: {str(ex)[:80]}")

gdelt=[]
# one combined query to reduce 429s
try:
    time.sleep(1)
    u=("https://api.gdeltproject.org/api/v2/doc/doc?query="
       "sourcelang:english%20(theme:ECON_STOCKMARKET%20OR%20theme:CRISISLEX_CRISISLEXREC%20OR%20sourcecountry:KS%20OR%20sourcecountry:US)"
       "&mode=ArtList&maxrecords=20&format=json&sort=datedesc")
    d=json.loads(get(u,t=25))
    arts=d.get("articles") or d.get("Articles") or []
    for a in arts:
        title=a.get("title") or a.get("seendate") and a.get("title")
        t=a.get("title"); url=a.get("url") or a.get("url_mobile")
        if not t or not url: continue
        gdelt.append({
            "t":t,"url":url,"src":a.get("domain") or a.get("sourceCountry") or "GDELT",
            "seendate":a.get("seendate"),"lang":a.get("language"),
            "country":a.get("sourcecountry") or a.get("sourceCountry"),
            "img":a.get("socialimage"),
        })
except Exception as ex: errs.append(f"GDELT: {str(ex)[:80]}")

# Did you know / on this day
dyk=None
try:
    n=dt.datetime.now()
    w=json.loads(get(f"https://en.wikipedia.org/api/rest_v1/feed/onthisday/selected/{n:%m}/{n:%d}"))
    sel=(w.get("selected") or [None])[0]
    if sel:
        page=(sel.get("pages") or [{}])[0]
        dyk={"year":sel.get("year"),"t":sel.get("text"),"url":((page.get("content_urls") or {}).get("desktop") or {}).get("page"),
             "img":((page.get("thumbnail") or {}).get("source")),"src":"Wikipedia On This Day","date":f"{n:%m-%d}"}
except Exception as ex: errs.append(f"Wikipedia onthisday: {str(ex)[:80]}")

# Regional briefs from already-collected news.json (real headlines only; summary = first titles)
news=None
try: news=json.load(open(SEC+"/news.json"))
except Exception: news=None
sections=(news or {}).get("sections") or {}
def take(items,n=4):
    out=[]
    for it in items or []:
        if not it.get("title") or not it.get("link"): continue
        out.append({"t":it["title"],"url":it["link"],"src":it.get("src") or it.get("feed"),"ts":it.get("ts")})
        if len(out)>=n: break
    return out

def classify(items, keys):
    hit=[]
    for it in items or []:
        blob=(it.get("title") or "")
        if any(k.lower() in blob.lower() for k in keys):
            hit.append(it)
    return hit

top=sections.get("top") or []
us=sections.get("us") or []
kr=sections.get("kr") or []
loc=sections.get("local") or []
all_head=top+us
regions=[
 {"id":"americas","label":"미주","items":take(us or top,4)},
 {"id":"korea","label":"한국·동아시아","items":take(kr,4)},
 {"id":"world","label":"세계 헤드라인","items":take(top,4)},
 {"id":"europe","label":"유럽","items":take(classify(all_head+kr,["Europe","EU","UK","Britain","France","Germany","Ukraine","NATO","Italy","Spain","유럽","우크라"]),3)},
 {"id":"mideast","label":"중동","items":take(classify(all_head+kr,["Iran","Israel","Gaza","Hormuz","Saudi","Lebanon","Syria","Iraq","중동","이란","이스라엘"]),3)},
 {"id":"economy","label":"세계 경제","items":take(classify(all_head,["economy","inflation","market","Fed","tariff","trade","AI","Nvidia","경제","인플레","환율","증시"]),4)},
]
for r in regions:
    titles=[x["t"] for x in r["items"]]
    r["summary"]=" · ".join(titles[:2]) if titles else None
    r["note"]="헤드라인 인용 · 분석이 아닙니다"
    # pin at a representative capital if we have items
    cap={"americas":(38.9072,-77.0369,"Washington"),"korea":(37.5665,126.9780,"서울"),"world":(0,0,"Global"),
         "europe":(50.85,4.35,"Brussels"),"mideast":(25.2,55.27,"Gulf"),"economy":(40.71,-74.01,"New York")}
    if r["items"] and r["id"] in cap:
        la,lo,lab=cap[r["id"]]
        pins.append({"id":"r:"+r["id"],"kind":"news","label":r["label"]+" · "+lab,"lat":la,"lon":lo,"region":r["id"]})

# Nearby: Event 알림봇 is in collected; city-of-austin-ish headlines as 지역 소식 (not a complete events calendar)
nearby=[]
for it in loc[:8]:
    nearby.append({"t":it.get("title"),"url":it.get("link"),"src":it.get("src") or it.get("feed"),"ts":it.get("ts"),"kind":"local-news"})

out={"at":now.isoformat(timespec="minutes"),
     "src":"USGS GeoJSON · GDELT DOC API · Wikipedia On This Day · 기존 뉴스 RSS · 세계 시계는 타임존 계산",
     "clocks":clocks,"pins":pins,"quakes":quakes,"gdelt":gdelt,"regions":regions,"dyk":dyk,"nearbyNews":nearby,
     "errors":errs}
json.dump(out,open(OUT,"w"),ensure_ascii=False)
os.chmod(OUT,0o600)
print("pins",len(pins),"quakes",len(quakes),"gdelt",len(gdelt),"regions",sum(1 for r in regions if r.get("items")),"dyk",bool(dyk),"err",len(errs))
