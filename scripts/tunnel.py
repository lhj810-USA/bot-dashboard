#!/usr/bin/env python3
"""Reverse SSH tunnel to Pinggy over port 443 (cloudflared's port 7844 is blocked on this box).
Writes current public URL to tunnel-url.txt and config.js; reconnects forever (free tunnels expire ~60 min, URL changes)."""
import paramiko, socket, threading, time, re, os, select
D=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def pipe(ch):
    s=socket.create_connection(("127.0.0.1",8787))
    while True:
        r,_,_=select.select([s,ch],[],[])
        if s in r:
            d=s.recv(16384)
            if not d: break
            ch.sendall(d)
        if ch in r:
            d=ch.recv(16384)
            if not d: break
            s.sendall(d)
    ch.close(); s.close()
while True:
    try:
        c=paramiko.SSHClient(); c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        c.connect("a.pinggy.io",port=443,username="tcp" if False else "a",password="",look_for_keys=False,allow_agent=False,timeout=20)
        t=c.get_transport(); t.set_keepalive(30)
        t.request_port_forward("",0)
        sh=t.open_session(); sh.get_pty(); sh.invoke_shell()
        buf=""; url=None; t0=time.time()
        while t.is_active():
            if sh.recv_ready():
                buf+=sh.recv(65536).decode("utf8","ignore")
                m=re.findall(r"https://[a-z0-9.-]+\.pinggy\.(?:link|online|io)",buf)
                if m and m[0]!=url:
                    url=m[0]; open(os.path.join(D,"tunnel-url.txt"),"w").write(url+"\n"); print("URL",url,flush=True)
            ch=t.accept(1)
            if ch: threading.Thread(target=pipe,args=(ch,),daemon=True).start()
    except Exception as e: print("err",e,flush=True)
    time.sleep(5)
