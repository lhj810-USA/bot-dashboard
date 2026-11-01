#!/usr/bin/env python3
"""공개 소스 수집: YouTube 채널 RSS(키 없음) + 이색 볼거리(NASA APOD, Wikipedia, Atlas Obscura, ScienceDaily, Smithsonian, HN).
6시간마다 갱신 → 비밀 폴더 fun.json (암호화 페이로드로만 배포). 실패한 소스는 errors 에 기록, 지어내지 않음."""
import json,os,re,sys,time,html,urllib.request,xml.etree.ElementTree as ET,datetime as dt
SEC="/workspace/bot-dashboard-secrets";OUT=SEC+"/fun.json";HERE=os.path.dirname(os.path.abspath(__file__))
if os.path.exists(OUT) and time.time()-os.path.getmtime(OUT)<6*3600 and "--force" not in sys.argv: sys.exit(0)
UA={"User-Agent":"Mozilla/5.0 (JARVIS dashboard reader)"}
def get(u,t=15): return urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=t).read()
errs=[];A="{http://www.w3.org/2005/Atom}";Y="{http://www.youtube.com/xml/schemas/2015}";MD="{http://search.yahoo.com/mrss/}"
vids=[];cfg=json.load(open(HERE+"/yt-channels.json"))
for cid,name,tags in cfg["channels"]:
    try:
        r=ET.fromstring(get(f"https://www.youtube.com/feeds/videos.xml?channel_id={cid}"))
        for e in r.findall(A+"entry")[:5]:
            vid=e.find(Y+"videoId").text;title=e.find(A+"title").text
            if not re.fullmatch(r"[\w-]{11}",vid or ""): continue
            g=e.find(MD+"group");views=None
            try: views=int(g.find(MD+"community").find(MD+"statistics").get("views"))
            except Exception: pass
            short="/shorts/" in (e.find(A+"link").get("href") or "")
            vids.append({"id":vid,"t":title,"ch":name,"cid":cid,"tags":tags,"pub":e.find(A+"published").text,"views":views,"short":short,
                         "url":f"https://www.youtube.com/watch?v={vid}","thumb":f"https://i.ytimg.com/vi/{vid}/hqdefault.jpg"})
    except Exception as ex: errs.append(f"YouTube {name}: {str(ex)[:80]}")
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
            if not im and enc is not None and "image" in (enc.get("type") or ""): im=enc.get("url")
            if not im:
                mm=re.search(r'<img[^>]+src="(https://[^"]+)"',d);im=mm.group(1) if mm else None
            txt=re.sub(r"\s+"," ",html.unescape(re.sub("<[^>]+>"," ",d))).strip()[:220]
            if t and l.startswith("http"): odd.append({"src":name,"tag":tag,"t":html.unescape(t),"d":txt,"url":l,"img":im,"date":it.findtext("pubDate") or it.findtext(A+"updated")})
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
    tfa=w.get("tfa")
    if tfa: odd.append({"src":"Wikipedia 오늘의 글","tag":"지식","t":tfa.get("titles",{}).get("normalized"),"d":(tfa.get("extract") or "")[:220],"url":tfa.get("content_urls",{}).get("desktop",{}).get("page"),"img":(tfa.get("thumbnail") or {}).get("source"),"date":f"{n:%Y-%m-%d}"})
    im=w.get("image")
    if im: odd.append({"src":"Wikipedia 오늘의 사진","tag":"사진","t":(im.get("description") or {}).get("text","")[:120] or im.get("title"),"d":"","url":im.get("file_page"),"img":(im.get("thumbnail") or {}).get("source"),"date":f"{n:%Y-%m-%d}"})
    for e in (w.get("onthisday") or [])[:6]:
        p=(e.get("pages") or [{}])[0]
        odd.append({"src":"Wikipedia 역사 속 오늘","tag":"오늘의 역사","t":f"{e.get('year')}년 — "+e.get("text",""),"d":"","url":p.get("content_urls",{}).get("desktop",{}).get("page"),"img":(p.get("thumbnail") or {}).get("source"),"date":f"{n:%m-%d}"})
except Exception as ex: errs.append(f"Wikipedia: {str(ex)[:80]}")
rss("Atlas Obscura","https://www.atlasobscura.com/feeds/latest","신기한 장소")
rss("ScienceDaily 이상한 과학","https://www.sciencedaily.com/rss/strange_offbeat.xml","이상한 과학")
rss("Smithsonian","https://www.smithsonianmag.com/rss/latest_articles/","역사·문화",6)
rss("Hacker News","https://hnrss.org/best","테크",6)
odd=[o for o in odd if o.get("url")]
out={"at":dt.datetime.now().astimezone().isoformat(timespec="minutes"),"src":"YouTube 채널 RSS · NASA APOD · Wikipedia · Atlas Obscura · ScienceDaily · Smithsonian · Hacker News","videos":vids,"odd":odd,"errors":errs}
tmp=OUT+".tmp";json.dump(out,open(tmp,"w"),ensure_ascii=False);os.chmod(tmp,0o600);os.replace(tmp,OUT)
print(len(vids),"videos",len(odd),"oddities",len(errs),"errors")
