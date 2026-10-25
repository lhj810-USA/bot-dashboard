#!/usr/bin/env python3
"""JARVIS 뉴스 수집기 — 공개 RSS만(키 없음). 실패한 소스는 건너뜀. 결과는 secrets/news.json → 암호화 payload에만."""
import urllib.request,urllib.parse,xml.etree.ElementTree as ET,json,re,os,sys,time,email.utils,datetime,html
S="/workspace/bot-dashboard-secrets";OUT=S+"/news.json"
if "--force" not in sys.argv and os.path.exists(OUT) and time.time()-os.path.getmtime(OUT)<1700: print("news skip (fresh)");sys.exit()
GN=lambda q,ko=False:"https://news.google.com/rss/search?q="+urllib.parse.quote(q+" when:3d")+("&hl=ko&gl=KR&ceid=KR:ko" if ko else "&hl=en-US&gl=US&ceid=US:en")
SEC={"top":[("Google 뉴스 US","https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en"),("BBC World","https://feeds.bbci.co.uk/news/world/rss.xml"),("NPR","https://feeds.npr.org/1001/rss.xml")],
 "local":[("Google 뉴스 · local",GN("local news"))],
 "us":[("NPR National","https://feeds.npr.org/1003/rss.xml"),("NPR Business","https://feeds.npr.org/1006/rss.xml"),("Google 뉴스 · US economy",GN("US economy"))],
 "kr":[("Google 뉴스 한국","https://news.google.com/rss?hl=ko&gl=KR&ceid=KR:ko"),("한겨레","https://www.hani.co.kr/rss/"),("연합뉴스TV","https://www.yonhapnewstv.co.kr/browse/feed/"),("연합뉴스","https://www.yna.co.kr/rss/news.xml")]}
# 관심사 → 검색어 (대화 관심사 지도에서 도출)
# 개인 관심사·지역 설정은 비밀 폴더 news-config.json에서 로드(저장소엔 일반 기본값만)
INT=[("AI",["AI news",False]),("시장",["stock market today",False])]
RX={"AI":r"\bai\b|openai|llm","시장":r"stock|market|증시"}
_C=json.load(open(S+"/news-config.json")) if os.path.exists(S+"/news-config.json") else {}
INT=[tuple(x) for x in _C.get("INT",INT)];RX=_C.get("RX",RX);SEC["local"]=[tuple(x) for x in _C.get("LOCAL",SEC["local"])]
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
