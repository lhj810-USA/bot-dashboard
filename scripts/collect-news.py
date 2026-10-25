#!/usr/bin/env python3
"""JARVIS 뉴스 수집기 — 공개 RSS만(키 없음). 실패한 소스는 건너뜀. 결과는 secrets/news.json → 암호화 payload에만."""
import urllib.request,urllib.parse,xml.etree.ElementTree as ET,json,re,os,sys,time,email.utils,datetime,html
S="/workspace/bot-dashboard-secrets";OUT=S+"/news.json"
if "--force" not in sys.argv and os.path.exists(OUT) and time.time()-os.path.getmtime(OUT)<1700: print("news skip (fresh)");sys.exit()
GN=lambda q,ko=False:"https://news.google.com/rss/search?q="+urllib.parse.quote(q+" when:3d")+("&hl=ko&gl=KR&ceid=KR:ko" if ko else "&hl=en-US&gl=US&ceid=US:en")
SEC={"top":[("Google 뉴스 US","https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en"),("BBC World","https://feeds.bbci.co.uk/news/world/rss.xml"),("NPR","https://feeds.npr.org/1001/rss.xml")],
 "local":[("Google 뉴스 · Cedar Park",GN('"Cedar Park" Texas')),("Google 뉴스 · Austin",GN("Austin TX")),("Google 뉴스 · Williamson County",GN('"Williamson County" Texas')),("KXAN","https://www.kxan.com/feed/")],
 "us":[("NPR National","https://feeds.npr.org/1003/rss.xml"),("NPR Business","https://feeds.npr.org/1006/rss.xml"),("Google 뉴스 · US economy",GN("US economy"))],
 "kr":[("Google 뉴스 한국","https://news.google.com/rss?hl=ko&gl=KR&ceid=KR:ko"),("한겨레","https://www.hani.co.kr/rss/"),("연합뉴스TV","https://www.yonhapnewstv.co.kr/browse/feed/"),("연합뉴스","https://www.yna.co.kr/rss/news.xml")]}
# 관심사 → 검색어 (대화 관심사 지도에서 도출)
INT=[("코인·업비트",["업비트 비트코인",False],["bitcoin price",False]),("한·미 증시",["코스피 나스닥",True],["stock market today",False]),("ETF",["ETF inflows",False]),
 ("FOMC·거시",["FOMC Fed rates",False]),("L-1·이민",["L-1 visa",False],["USCIS immigration rule",False]),("패시브 인컴·투자",["passive income investing",False]),
 ("영어 공부",["영어 학습 방법",True],["learn English tips",False]),("텍사스 행사",["Austin events this weekend",False]),("Tesla·Samsung·NVDA",["Tesla stock",False],["Nvidia stock",False],["삼성전자 주가",True]),
 ("AI",["AI model launch",False]),("가족·학교·Cedar Park",["Leander ISD",False],['"Cedar Park" family',False]),("SpaceX·우주",["SpaceX launch",False]),("스톡 이미지",['"Adobe Stock" OR "stock photo" contributors',False])]
def fetch(u):
  r=urllib.request.Request(u,headers={"User-Agent":"Mozilla/5.0 (JARVIS personal dashboard RSS reader)"});return urllib.request.urlopen(r,timeout=15).read()
def ts(s):
  try: return email.utils.parsedate_to_datetime(s).astimezone(datetime.timezone.utc).isoformat()
  except Exception:
    try: return datetime.datetime.fromisoformat(s.replace("Z","+00:00")).astimezone(datetime.timezone.utc).isoformat()
    except Exception: return None
def parse(src,u):
  root=ET.fromstring(fetch(u));out=[]
  for it in root.iter("item"):
    t=(it.findtext("title") or "").strip();l=(it.findtext("link") or "").strip();d=ts(it.findtext("pubDate") or it.findtext("{http://purl.org/dc/elements/1.1/}date") or "")
    s=it.find("source");so=(s.text.strip() if s is not None and s.text else src)
    if s is not None and t.endswith(" - "+so): t=t[:-len(so)-3]
    if t and l: out.append({"title":html.unescape(t)[:180],"src":so,"link":l,"ts":d})
  return out
key=lambda t:re.sub(r"[^0-9a-z가-힣]","",t.lower())[:60]
seen=set();res={"at":datetime.datetime.now(datetime.timezone.utc).isoformat(),"sections":{},"interest":[],"errors":[],"sources":{}}
now=time.time()
def fresh(x,days=4): return x["ts"] and now-datetime.datetime.fromisoformat(x["ts"]).timestamp()<days*86400
for sec,srcs in SEC.items():
  L=[]
  for name,u in srcs:
    try: it=parse(name,u);res["sources"][name]=len(it);L+= [dict(x,feed=name) for x in it[:25]]
    except Exception as e: res["errors"].append(f"{name}: {type(e).__name__}")
  L=[x for x in L if fresh(x)];L.sort(key=lambda x:x["ts"],reverse=True);out=[]
  for x in L:
    k=key(x["title"])
    if k in seen: continue
    seen.add(k);out.append(x)
  res["sections"][sec]=out[:40]
# 관심사 가중치: 프로필 주제 언급수
W={}
try:
  for t in json.load(open(S+"/profile.json")).get("topics",[]): W[t["topic"]]=t["n"]
except Exception: pass
def wt(topic):
  hit=[n for k,n in W.items() if any(w in k for w in re.split(r"[·\s]",topic) if len(w)>1)];return max(hit) if hit else 5
RX={"코인·업비트":r"bitcoin|crypto|비트코인|업비트|ethereum|xrp|이더리움|코인","한·미 증시":r"stock|nasdaq|s&p|dow|코스피|증시|코스닥","ETF":r"\betf","FOMC·거시":r"fed\b|fomc|rate|inflation|금리|cpi","L-1·이민":r"visa|immigra|uscis|h-1b|l-1|green card|비자",
 "패시브 인컴·투자":r"passive|dividend|income|invest","영어 공부":r"영어|english|토익|ielts|toefl","텍사스 행사":r"austin|cedar park|round rock|texas|leander","Tesla·Samsung·NVDA":r"tesla|nvidia|nvda|삼성|samsung",
 "AI":r"\bai\b|openai|인공지능|llm|gpt|model","가족·학교·Cedar Park":r"isd|school|cedar park|leander|학교","SpaceX·우주":r"spacex|starship|falcon|launch|nasa","스톡 이미지":r"adobe|stock photo|firefly|shutterstock|getty"}
pool=[]
for row in INT:
  topic,qs=row[0],row[1:]
  for q,ko in qs:
    try: it=parse("Google 뉴스",GN(q,ko))[:8]
    except Exception as e: res["errors"].append(f"관심사 {topic}: {type(e).__name__}");continue
    for x in it:
      if not fresh(x,7) or len(x["title"])<20 or not re.search(RX.get(topic,"."),x["title"],re.I): continue
      age=(now-datetime.datetime.fromisoformat(x["ts"]).timestamp())/3600
      pool.append(dict(x,topic=topic,q=q,score=round(min(wt(topic),90)/90*50+max(0,50-age*50/168),1)))
pool.sort(key=lambda x:-x["score"]);ik=set();top=[]
per={}
for x in pool:
  k=key(x["title"])
  if k in ik or per.get(x["topic"],0)>=3: continue
  ik.add(k);per[x["topic"]]=per.get(x["topic"],0)+1;top.append(x)
res["interest"]=top[:20];res["interestPool"]=len(pool);res["rank"]="점수 = 관심도(대화 언급 횟수, 50점) + 최신성(7일 선형, 50점), 주제당 최대 3건"
json.dump(res,open(OUT,"w"),ensure_ascii=False)
print("news ok",{k:len(v) for k,v in res["sections"].items()},len(res["interest"]),res["errors"])
