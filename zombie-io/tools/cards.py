#!/usr/bin/env python3
# Deploy card art (thumbnail 16:9 + favicon 1:1), STYLE FORMULA v1: flat vector cartoon,
# muted apocalyptic greens & grey asphalt, sickly grey-green zombies, signal-yellow accents,
# crisp dark outlines, strict top-down characters.
import os, math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

FD = "/mnt/skills/examples/canvas-design/canvas-fonts"
def font(name, size):
    try: return ImageFont.truetype(os.path.join(FD, name), size)
    except Exception: return ImageFont.load_default()

INK="#171411"; YEL="#ffd23f"; YELD="#e0a92a"; RED="#b23a2e"
NAVY="#3f548f"; RUST="#a85a34"; ZOM="#6f7d4e"; FLESH="#869160"; SKIN="#caa079"
OUT = "/home/user/claude-code/zombie-io/tools/cards"
os.makedirs(OUT, exist_ok=True)

def vgrad(w,h,c0,c1):
    base=Image.new("RGB",(w,h),c0); top=Image.new("RGB",(w,h),c1); mask=Image.new("L",(w,h))
    md=mask.load()
    for y in range(h):
        v=int(255*(y/h)**1.1)
        for x in range(0,w,1): md[x,y]=v
    base.paste(top,(0,0),mask); return base

def rot(points, cx, cy, a):
    s,c=math.sin(a),math.cos(a); out=[]
    for (x,y) in points:
        dx,dy=x-cx,y-cy; out.append((cx+dx*c-dy*s, cy+dx*s+dy*c))
    return out

def survivor(d, cx, cy, s, ang, tint):
    # top-down survivor facing +x rotated by ang, scaled by s
    def P(x,y):
        dx,dy=x*s,y*s; ca,sa=math.cos(ang),math.sin(ang)
        return (cx+dx*ca-dy*sa, cy+dx*sa+dy*ca)
    # shadow
    d.ellipse([cx-22*s,cy-14*s+8,cx+22*s,cy+18*s+8], fill=(10,12,9))
    # backpack
    d.ellipse([P(-13,-9)[0]-2,P(-13,-9)[1]-2,P(-1,9)[0]+2,P(-1,9)[1]+2], fill=INK)
    # arms
    d.line([P(3,-8),P(18,-4)], fill=INK, width=int(7*s)); d.line([P(3,8),P(18,4)], fill=INK, width=int(7*s))
    # body
    bb=[P(-15,-13),P(15,-13),P(15,13),P(-15,13)]
    d.polygon(_oval(cx,cy,15*s,13*s,ang), fill=tint, outline=INK, width=max(2,int(3.5*s)))
    # gun
    d.polygon(rotrect(P,10,-3.5,22,7), fill="#23211d", outline=INK, width=max(1,int(2*s)))
    tip=P(32,0); d.ellipse([tip[0]-4*s,tip[1]-4*s,tip[0]+4*s,tip[1]+4*s], fill=YEL)
    # head
    hd=P(3,0); d.ellipse([hd[0]-8*s,hd[1]-8*s,hd[0]+8*s,hd[1]+8*s], fill=SKIN, outline=INK, width=max(2,int(3*s)))

def zombie(d, cx, cy, s, ang):
    def P(x,y):
        dx,dy=x*s,y*s; ca,sa=math.cos(ang),math.sin(ang)
        return (cx+dx*ca-dy*sa, cy+dx*sa+dy*ca)
    d.ellipse([cx-20*s,cy-12*s+8,cx+20*s,cy+16*s+8], fill=(10,12,9))
    d.line([P(0,-7),P(18,-7)], fill="#4b5436", width=int(7*s)); d.line([P(0,7),P(18,7)], fill="#4b5436", width=int(7*s))
    h1=P(18,-7); h2=P(18,7)
    for h in (h1,h2): d.ellipse([h[0]-4*s,h[1]-4*s,h[0]+4*s,h[1]+4*s], fill=FLESH)
    d.polygon(_oval(cx,cy,14*s,12*s,ang), fill=ZOM, outline=INK, width=max(2,int(3.2*s)))
    hd=P(4,0); d.ellipse([hd[0]-7*s,hd[1]-7*s,hd[0]+7*s,hd[1]+7*s], fill=FLESH, outline=INK, width=max(2,int(3*s)))
    eye=P(7,-2); d.ellipse([eye[0]-2*s,eye[1]-2*s,eye[0]+2*s,eye[1]+2*s], fill="#cfe070")
    g=P(6,2); d.ellipse([g[0]-2*s,g[1]-2*s,g[0]+2*s,g[1]+2*s], fill="#6e1414")

def _oval(cx,cy,rx,ry,ang,n=28):
    pts=[]
    for i in range(n):
        a=i/n*2*math.pi; x=math.cos(a)*rx; y=math.sin(a)*ry
        ca,sa=math.cos(ang),math.sin(ang); pts.append((cx+x*ca-y*sa, cy+x*sa+y*ca))
    return pts
def rotrect(P,x,y,w,h):
    return [P(x,y),P(x+w,y),P(x+w,y+h),P(x,y+h)]

# ---------------- thumbnail ----------------
W,H=1280,720
img=vgrad(W,H,"#10130c","#2c3327")
d=ImageDraw.Draw(img,"RGBA")
# danger glow + zone ring motif
d.ellipse([W-560,H-560,W+200,H+200], outline=(200,70,55,160), width=10)
d.ellipse([W-440,H-440,W+120,H+120], outline=(200,70,55,90), width=6)
# ground patches
for (x,y,r) in [(180,640,60),(420,690,40),(900,660,80),(1150,600,50)]:
    d.ellipse([x-r,y-r//2,x+r,y+r//2], fill=(58,66,55))
# scene: survivor vs horde
survivor(d, 430, 470, 3.0, -0.15, NAVY)
zombie(d, 720, 430, 2.7, math.pi-0.2)
zombie(d, 840, 520, 2.9, math.pi+0.1)
zombie(d, 700, 560, 2.5, math.pi-0.5)
zombie(d, 950, 470, 2.6, math.pi)
# tracer
d.line([(500,455),(690,440)], fill=YEL, width=5)
# title
tf=font("BigShoulders-Bold.ttf",170); sf=font("InstrumentSans-Bold.ttf",40); cf=font("InstrumentSans-Bold.ttf",30)
d.text((64,70),"ZOMBIE",font=tf,fill=YEL,stroke_width=8,stroke_fill=INK)
d.text((64,210),"ZONE",font=tf,fill="#9fbf5e",stroke_width=8,stroke_fill=INK)
io=font("BigShoulders-Bold.ttf",90); d.text((360,250),".io",font=io,fill="#e9ead8",stroke_width=6,stroke_fill=INK)
d.text((70,360),"TOP-DOWN ZOMBIE BATTLE ROYALE",font=sf,fill="#e9ead8")
d.text((70,408),"Scavenge · Survive · Outlast the horde",font=cf,fill="#c7b56a")
# vignette
v=Image.new("L",(W,H),0); vd=ImageDraw.Draw(v); vd.ellipse([-200,-200,W+200,H+200],fill=255); v=v.filter(ImageFilter.GaussianBlur(180))
dark=Image.new("RGB",(W,H),(6,8,5)); img=Image.composite(img,dark,v)
img.save(os.path.join(OUT,"thumbnail.png")); print("thumbnail", img.size)

# ---------------- favicon ----------------
S=512
fav=Image.new("RGB",(S,S),"#15180f"); fd=ImageDraw.Draw(fav,"RGBA")
fd.rounded_rectangle([10,10,S-10,S-10],radius=90,fill="#222a18",outline=YEL,width=14)
# big zombie head
cx,cy=S//2,S//2+10
fd.ellipse([cx-150,cy-150,cx+150,cy+150],fill=ZOM,outline=INK,width=14)
fd.ellipse([cx-150,cy-150,cx+150,cy+150])
# brow + eyes
fd.ellipse([cx-92,cy-60,cx-22,cy+6],fill=INK)
fd.ellipse([cx+22,cy-60,cx+92,cy+6],fill=INK)
fd.ellipse([cx-74,cy-44,cx-44,cy-14],fill="#cfe070")
fd.ellipse([cx+44,cy-44,cx+74,cy-14],fill="#cfe070")
# stitched mouth
fd.line([(cx-80,cy+70),(cx+80,cy+70)],fill=INK,width=12)
for x in range(cx-70,cx+71,28): fd.line([(x,cy+52),(x,cy+88)],fill=INK,width=8)
# gore
fd.ellipse([cx+30,cy+96,cx+58,cy+150],fill="#6e1414")
fav.save(os.path.join(OUT,"favicon.png")); print("favicon", fav.size)
