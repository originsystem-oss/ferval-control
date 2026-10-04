import json, os, re, subprocess, tempfile
from flask import Flask, request, jsonify
app=Flask(__name__)
def run(cmd):
    p=subprocess.run(cmd,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,timeout=90)
    return p.stdout,p.stderr,p.returncode
@app.get("/health")
def health(): return jsonify({"ok":True,"organ":"iayo-ear","version":"0.2"})
@app.post("/analyze")
def analyze():
    f=request.files.get("audio")
    if not f: return jsonify({"error":"audio required"}),400
    ext=os.path.splitext(f.filename or "")[1][:10]
    with tempfile.NamedTemporaryFile(suffix=ext,delete=False) as t:
        f.save(t.name); path=t.name
    try:
        out,err,rc=run(["ffprobe","-v","error","-show_entries","format=duration,format_name,size,bit_rate","-show_entries","stream=codec_name,codec_type,sample_rate,channels","-of","json",path])
        if rc: return jsonify({"error":"ffprobe failed","detail":err[-1000:]}),422
        probe=json.loads(out)
        _,vol,_=run(["ffmpeg","-hide_banner","-i",path,"-af","volumedetect","-f","null","-"])
        _,sil,_=run(["ffmpeg","-hide_banner","-i",path,"-af","silencedetect=noise=-45dB:d=0.5","-f","null","-"])
        mean=re.search(r"mean_volume:\s*([-\d.]+) dB",vol); peak=re.search(r"max_volume:\s*([-\d.]+) dB",vol)
        starts=[float(x) for x in re.findall(r"silence_start:\s*([\d.]+)",sil)]
        ends=[float(x) for x in re.findall(r"silence_end:\s*([\d.]+)",sil)]
        return jsonify({"verified":True,"filename":f.filename,"probe":probe,"levels_db":{"mean":float(mean.group(1)) if mean else None,"peak":float(peak.group(1)) if peak else None},"silence":{"starts":starts[:100],"ends":ends[:100]},"claim":"Audio decoded and analyzed from real bytes."})
    finally:
        try: os.unlink(path)
        except: pass
if __name__=="__main__": app.run(host="0.0.0.0",port=int(os.environ.get("PORT","8080")))
