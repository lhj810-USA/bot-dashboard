#!/usr/bin/env python3
"""공개 소스 수집: YouTube 채널(키 없음) + 이색 볼거리(NASA APOD, Wikipedia, Atlas Obscura, ScienceDaily, Smithsonian, HN, ESA, Phys.org).
6시간마다 갱신 → 비밀 폴더 fun.json (암호화 페이로드로만 배포). 실패한 소스는 errors 에 기록, 지어내지 않음.
공식 RSS가 404를 주면 공개 채널 페이지의 ytInitialData(lockupViewModel)에서 최신 영상만 읽는다."""
import json,os,re,sys,time,html as HTML,urllib.request,xml.etree.ElementTree as ET,datetime as dt
SEC="/workspace/bot-dashboard-secrets";OUT=SEC+"/fun.json";HERE=os.path.dirname(os.path.abspath(__file__))
if os.path.exists(OUT) and time.time()-os.path.getmtime(OUT)<6*3600 and "--force" not in sys.argv: sys.exit(0)
UA={"User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36","Accept-Language":"en-US,en;q=0.8","Accept":"*/*"}
def get(u,t=18):
    return urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=t).read()
errs=[];A="{http://www.w3.org/2005/Atom}";Y="{http://www.youtube.com/xml/schemas/2015}";MD="{http://search.yahoo.com/mrss/}"
vids=[];cfg=json.load(open(HERE+"/yt-channels.json"))

def rel_iso(s):
    if not s: return None
    t=s.strip().lower().replace("posted ","")
    m=re.search(r"(\d+)\s*(second|minute|hour|day|week|month|year|초|분|시간|일|주|개월|달|년)s?\s*(ago|전)?", t)
    if not m:
        m=re.search(r"(\d+)\s*([smhdwy]|h|d)\s*ago", t)
        if not m: return None
        n=int(m.group(1)); u=m.group(2)
        unit={"s":"second","m":"minute","h":"hour","d":"day","w":"week","y":"year"}.get(u,"hour")
    else:
        n=int(m.group(1)); raw=m.group(2)
        unit={"초":"second","분":"minute","시간":"hour","일":"day","주":"week","개월":"month","달":"month","년":"year"}.get(raw, raw)
    now=dt.datetime.now().astimezone()
    days={"second":0,"minute":0,"hour":n/24,"day":n,"week":n*7,"month":n*30,"year":n*365}.get(unit,0)
    if unit in ("second","minute"):
        delta=dt.timedelta(seconds=n) if unit=="second" else dt.timedelta(minutes=n)
        return (now-delta).isoformat(timespec="minutes")
    if unit=="hour":
        return (now-dt.timedelta(hours=n)).isoformat(timespec="minutes")
    return (now-dt.timedelta(days=days)).isoformat(timespec="minutes")

def yt_rss(cid):
    raw=get(f"https://www.youtube.com/feeds/videos.xml?channel_id={cid}")
    r=ET.fromstring(raw); out=[]
    for e in r.findall(A+"entry")[:5]:
        vid=e.find(Y+"videoId").text; title=e.find(A+"title").text
        if not re.fullmatch(r"[\w-]{11}",vid or ""): continue
        g=e.find(MD+"group"); views=None
        try: views=int(g.find(MD+"community").find(MD+"statistics").get("views"))
        except Exception: pass
        short="/shorts/" in (e.find(A+"link").get("href") or "")
        out.append({"id":vid,"t":title,"pub":e.find(A+"published").text,"views":views,"short":short})
    return out

def yt_html(cid):
    raw=get(f"https://www.youtube.com/channel/{cid}/videos").decode("utf-8","ignore")
    i=raw.find("ytInitialData")
    if i<0: raise RuntimeError("no ytInitialData")
    i=raw.find("{",i); data,_=json.JSONDecoder().raw_decode(raw[i:])
    locks=[]
    def walk(o):
        if isinstance(o,dict):
            if "lockupViewModel" in o: locks.append(o["lockupViewModel"])
            if "videoRenderer" in o: locks.append(("vr",o["videoRenderer"]))
            for v in o.values(): walk(v)
        elif isinstance(o,list):
            for v in o: walk(v)
    walk(data)
    out=[]
    seen=set()
    for lv in locks:
        if isinstance(lv,tuple):
            v=lv[1]; vid=v.get("videoId"); title=((v.get("title") or {}).get("runs") or [{}])[0].get("text") or (v.get("title") or {}).get("simpleText")
            pub=((v.get("publishedTimeText") or {}).get("simpleText"))
        else:
            if lv.get("contentType") and "VIDEO" not in str(lv.get("contentType")): continue
            vid=lv.get("contentId")
            meta=(lv.get("metadata") or {}).get("lockupMetadataViewModel") or {}
            title=((meta.get("title") or {}).get("content"))
            pub=None
            try:
                parts=((meta.get("metadata") or {}).get("contentMetadataViewModel") or {}).get("metadataRows") or []
                for row in parts:
                    for p in row.get("metadataParts") or []:
                        t=(p.get("text") or {}).get("content") or ""
                        if re.search(r"ago|전|hour|day|week|month|시간|일|주", t, re.I): pub=t
            except Exception:
                pass
        if not re.fullmatch(r"[\w-]{11}", vid or ""): continue
        if vid in seen: continue
        seen.add(vid)
        out.append({"id":vid,"t":title or "","pub":rel_iso(pub) or dt.datetime.now().astimezone().isoformat(timespec="minutes"),"views":None,"short":False,"pubRel":pub})
        if len(out)>=5: break
    if not out: raise RuntimeError("no videos in page")
    return out

for cid,name,tags in cfg["channels"]:
    got=[]; how="rss"
    try:
        got=yt_rss(cid)
    except Exception as ex:
        how="html"
        try: got=yt_html(cid)
        except Exception as ex2:
            errs.append(f"YouTube {name}: {str(ex)[:50]} / html {str(ex2)[:50]}")
            continue
    for v in got:
        vids.append({"id":v["id"],"t":v["t"],"ch":name,"cid":cid,"tags":tags,"pub":v.get("pub"),"views":v.get("views"),"short":v.get("short") or False,
                     "url":f"https://www.youtube.com/watch?v={v['id']}","thumb":f"https://i.ytimg.com/vi/{v['id']}/hqdefault.jpg","via":how})

odd=[]
def rss(name,u,tag,n=8,img_re=True):
    try:
        r=ET.fromstring(get(u));items=r.findall(".//item") or r.findall(A+"entry")
        for it in items[:n]:
            t=(it.findtext("title") or it.findtext(A+"title") or "").strip();l=it.findtext("link") or ""
            if not l:
                le=it.find(A+"link");l=le.get("href") if le is not None else ""
            d=it.findtext("description") or it.findtext(A+"summary") or "";im=None
            m=it.find(MD+"content") or it.find(MD+"thumbnail");
            if m is not None: im=m.get("url")
            enc=it.find("enclosure")
            if enc is not None and (enc.get("type") or "").startswith("image"): im=enc.get("url") or im
            if (not im) and img_re:
                mm=re.search(r'<img[^>]+src="(https://[^"]+)"',d);im=mm.group(1) if mm else None
            txt=HTML.unescape(re.sub("<[^>]+>"," ",d or ""))
            txt=re.sub(r"\s+"," ",txt).strip()[:220]
            if t and l.startswith("http"): odd.append({"src":name,"tag":tag,"t":HTML.unescape(t),"d":txt,"url":l,"img":im,"date":it.findtext("pubDate") or it.findtext(A+"updated")})
    except Exception as ex: errs.append(f"{name}: {str(ex)[:80]}")

try:
    a=json.loads(get("https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY"))
    odd.append({"src":"NASA APOD","tag":"우주","t":a.get("title"),"d":(a.get("explanation") or "")[:220],"url":"https://apod.nasa.gov/apod/astropix.html","img":a.get("url") if a.get("media_type")=="image" else a.get("thumbnail_url"),"date":a.get("date")})
except Exception as ex:
    try:
        h=get("https://apod.nasa.gov/apod/astropix.html").decode("utf-8","ignore");ti=re.search(r"<center>\s*<b>([^<]+)</b>",h);im=re.search(r'<IMG SRC="([^"]+)"',h,re.I)
        odd.append({"src":"NASA APOD","tag":"우주","t":(ti.group(1).strip() if ti else "Astronomy Picture of the Day"),"d":"","url":"https://apod.nasa.gov/apod/astropix.html","img":("https://apod.nasa.gov/apod/"+im.group(1)) if im else None,"date":f"{dt.date.today()}"})
    except Exception as ex2: errs.append(f"NASA APOD: {str(ex)[:60]} / {str(ex2)[:40]}")
try:
    n=dt.datetime.now();w=json.loads(get(f"https://en.wikipedia.org/api/rest_v1/feed/featured/{n:%Y/%m/%d}"))
    tfa=w.get("tfa") or {}
    if tfa: odd.append({"src":"Wikipedia 오늘의 글","tag":"지식","t":tfa.get("titles",{}).get("normalized"),"d":(tfa.get("extract") or "")[:220],"url":tfa.get("content_urls",{}).get("desktop",{}).get("page"),"img":(tfa.get("thumbnail") or {}).get("source"),"date":f"{n:%Y-%m-%d}"})
    im=(w.get("image") or {})
    if im: odd.append({"src":"Wikipedia 오늘의 사진","tag":"사진","t":(im.get("description") or {}).get("text","")[:120] or im.get("title"),"d":"","url":im.get("file_page"),"img":(im.get("thumbnail") or {}).get("source"),"date":f"{n:%Y-%m-%d}"})
    for e in (w.get("onthisday") or [])[:3]:
        p=(e.get("pages") or [{}])[0]
        odd.append({"src":"Wikipedia 역사 속 오늘","tag":"오늘의 역사","t":f"{e.get('year')}년 — "+e.get("text",""),"d":"","url":p.get("content_urls",{}).get("desktop",{}).get("page"),"img":(p.get("thumbnail") or {}).get("source"),"date":f"{n:%m-%d}"})
except Exception as ex: errs.append(f"Wikipedia featured: {str(ex)[:80]}")

rss("Atlas Obscura","https://www.atlasobscura.com/feeds/latest","신기한 장소")
rss("ScienceDaily 이상한 과학","https://www.sciencedaily.com/rss/strange_offbeat.xml","이상한 과학")
rss("ScienceDaily 우주","https://www.sciencedaily.com/rss/space_time.xml","우주",6)
rss("Smithsonian","https://www.smithsonianmag.com/rss/latest_articles/","역사·문화",6)
rss("Hacker News","https://hnrss.org/best","테크",6)
rss("Phys.org","https://phys.org/rss-feed/","과학",6)
rss("ESA","https://www.esa.int/rssfeed/Our_Activities/Space_Science","우주",6)
odd=[o for o in odd if o.get("url")]
out={"at":dt.datetime.now().astimezone().isoformat(timespec="minutes"),"src":"YouTube 채널 페이지/RSS · NASA APOD · Wikipedia · Atlas Obscura · ScienceDaily · Smithsonian · Hacker News · Phys.org · ESA","videos":vids,"odd":odd,"errors":errs}
json.dump(out,open(OUT,"w"),ensure_ascii=False)
os.chmod(OUT,0o600)
print(len(vids),"videos",len(odd),"oddities",len(errs),"errors")
