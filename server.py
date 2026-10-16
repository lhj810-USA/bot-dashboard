#!/usr/bin/env python3
"""Static server + /api/health, POST /api/command (appends to commands-queue.json), POST /api/refresh."""
import http.server, time, json, os, uuid, datetime, subprocess, threading
from pywebpush import webpush, WebPushException
SEC="/workspace/bot-dashboard-secrets"; SUBS=os.path.join(SEC,"subscriptions.json")
D=os.path.dirname(os.path.abspath(__file__)); Q=os.path.join(D,"commands-queue.json"); L=threading.Lock()
class H(http.server.SimpleHTTPRequestHandler):
    def __init__(s,*a,**k): super().__init__(*a,directory=D,**k)
    def end_headers(s):
        s.send_header("Access-Control-Allow-Origin","*"); s.send_header("Access-Control-Allow-Headers","Content-Type"); s.send_header("Access-Control-Allow-Methods","GET,POST,OPTIONS"); super().end_headers()
    def do_OPTIONS(s): s.send_response(204); s.end_headers()
    def j(s,c,o): b=json.dumps(o,ensure_ascii=False).encode(); s.send_response(c); s.send_header("Content-Type","application/json"); s.end_headers(); s.wfile.write(b)
    def do_GET(s):
        if s.path.startswith("/api/vapid"): return s.j(200,{"publicKey":open(SEC+"/vapid_public.txt").read().strip()})
        if s.path.startswith("/api/health"): return s.j(200,{"ok":True})
        if s.path.startswith("/commands-queue") or s.path.startswith("/server.py") or s.path.startswith("/scripts"): return s.j(403,{"error":"forbidden"})
        if s.path.startswith("/data.json"): subprocess.run(["python3",os.path.join(D,"scripts/update-data.py")],capture_output=True)
        super().do_GET()
    def do_POST(s):
        if s.path=="/api/subscribe":
            try: sub=json.loads(s.rfile.read(min(int(s.headers.get("Content-Length",0)),8000))); assert sub["endpoint"].startswith("https://")
            except Exception: return s.j(400,{"error":"bad subscription"})
            with L:
                a=[x for x in load_subs() if x["endpoint"]!=sub["endpoint"]]+[sub]; save_subs(a)
            return s.j(200,{"ok":True,"count":len(a)})
        if s.path=="/api/test-push": return s.j(200,push("테스트 알림","봇 대시보드 푸시가 정상 동작합니다"))
        if s.path!="/api/command": return s.j(404,{"error":"not found"})
        try: b=json.loads(s.rfile.read(min(int(s.headers.get("Content-Length",0)),20000)))
        except Exception: return s.j(400,{"error":"bad json"})
        if not b.get("botId") or not str(b.get("prompt","")).strip(): return s.j(400,{"error":"botId/prompt required"})
        e={"id":str(uuid.uuid4()),"botId":b["botId"],"botName":b.get("botName"),"prompt":str(b["prompt"])[:5000],"queuedAt":datetime.datetime.now().astimezone().isoformat(),"status":"queued"}
        with L:
            q=json.load(open(Q)) if os.path.exists(Q) else []
            q.append(e); json.dump(q,open(Q,"w"),ensure_ascii=False,indent=1)
        s.j(200,e)
def load_subs():
    return json.load(open(SUBS)) if os.path.exists(SUBS) else []
def save_subs(a):
    json.dump(a,open(SUBS,"w")); os.chmod(SUBS,0o600)
def push(title,body):
    ok=bad=0; keep=[]
    for sub in load_subs():
        try: webpush(sub,json.dumps({"title":title,"body":body},ensure_ascii=False),vapid_private_key=SEC+"/vapid_private.pem",vapid_claims={"sub":"mailto:noreply@example.com"}); ok+=1; keep.append(sub)
        except WebPushException as e:
            bad+=1
            if not (e.response is not None and e.response.status_code in (404,410)): keep.append(sub)
        except Exception: bad+=1; keep.append(sub)
    with L: save_subs(keep)
    return {"sent":ok,"failed":bad}
def watcher():
    prev=None
    while True:
        subprocess.run(["python3",os.path.join(D,"scripts/update-data.py")],capture_output=True)
        try: cur={b["id"]:b for b in json.load(open(os.path.join(D,"data.json")))["bots"]}
        except Exception: cur=None
        if prev and cur:
            for i,b in cur.items():
                p=prev.get(i)
                if p and p["status"]!=b["status"]: push(b["name"],f"상태 변경: {p['status']} → {b['status']}")
                elif p and b.get("lastTurnAt") and b.get("lastTurnAt")!=p.get("lastTurnAt"): push(b["name"],f"새 활동: {b['lastActivity']}")
        prev=cur or prev; time.sleep(60)
threading.Thread(target=watcher,daemon=True).start()
http.server.ThreadingHTTPServer(("0.0.0.0",int(os.environ.get("PORT",8787))),H).serve_forever()
