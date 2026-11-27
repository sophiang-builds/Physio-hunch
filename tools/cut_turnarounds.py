"""Cut assets/characters/patient-turnarounds.png into 20 sprites (assets/characters/sprites/<case>-<view>.png).
Removes the sheet background, row labels and neighbouring-cell slivers, then aligns each patient's four views
on one shared, bottom-centred canvas. Run from the repository root: python3 tools/cut_turnarounds.py"""
# Cuts assets/characters/patient-turnarounds.png into 20 sprites on shared anchors.
import numpy as np, sys
from PIL import Image
from scipy import ndimage
src=np.array(Image.open('assets/characters/patient-turnarounds.png').convert('RGB')).astype(int)
H,W,_=src.shape; bg=np.array([245,241,233])
rows=[(120,402),(414,704),(716,990),(1003,1264),(1276,H)]
cols=[(100,373),(378,590),(590,808),(808,W)]
ids=['ankle','sciatica','stroke','postop','cardiac']; views=['front','right','back','left']
out={}
for r,(y0,y1) in enumerate(rows):
  for c,(x0,x1) in enumerate(cols):
    cell=src[y0:y1,x0:x1]; h,w,_=cell.shape
    near=np.abs(cell-bg).sum(2)<30
    lab,n=ndimage.label(near)
    edge=set(np.unique(np.concatenate([lab[0],lab[:,0],lab[:,-1]])))-{0}
    bgmask=np.isin(lab,list(edge))
    fl,fn=ndimage.label(~bgmask)
    sizes=ndimage.sum(np.ones_like(fl),fl,range(1,fn+1)); big=int(np.argmax(sizes))+1
    near_big=ndimage.binary_dilation(fl==big,iterations=3)
    touching=set(np.unique(fl[near_big]))-{0}
    keep=np.isin(fl,list(touching))
    # restore pale areas enclosed by the figure (blouse, eye whites); the bust is cut at the bottom, so close it first
    closed=keep.copy(); closed[-1,:]|=keep[-2,:]|keep[-3,:]
    keep=ndimage.binary_fill_holes(closed)&~bgmask | keep
    # halo: pale near-cream pixels touching transparency go transparent (two passes)
    for _ in range(2):
      outside=~keep; outside[-1,:]=False
      edgepx=keep & ndimage.binary_dilation(outside)
      pale=np.abs(cell-bg).sum(2)<70
      keep&=~(edgepx&pale)
    rgba=np.dstack([cell.astype(np.uint8),np.where(keep,255,0).astype(np.uint8)])
    ys,xs=np.where(keep)
    out[(ids[r],views[c])]=Image.fromarray(rgba,'RGBA').crop((xs.min(),ys.min(),xs.max()+1,ys.max()+1))
for pid in ids:
  ims=[out[(pid,v)] for v in views]; CW=max(i.width for i in ims)+8; CH=max(i.height for i in ims)+8
  for v,im in zip(views,ims):
    cv=Image.new('RGBA',(CW,CH),(0,0,0,0)); cv.paste(im,((CW-im.width)//2,CH-im.height),im); cv.save(f'assets/characters/sprites/{pid}-{v}.png')





