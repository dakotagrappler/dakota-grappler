import React, { useState, useRef, useEffect } from 'react'
import { supabase } from './supabase'

const NAVY="#1a2744",GOLD="#c8960c",GOLD_LIGHT="#f5c842",WHITE="#ffffff",LIGHT_BG="#f4f6fa",BORDER="#dde2ef",RED="#c0392b",GREEN="#1a7a4a",MUTED="#6b7a99";

const getCurrentSeason=()=>{const now=new Date();const yr=now.getFullYear();const mo=now.getMonth();return mo>=7?`${yr}-${String(yr+1).slice(2)}`:`${yr-1}-${String(yr).slice(2)}`;};
const buildSeasons=()=>{const cur=getCurrentSeason();const [startYr]=cur.split("-").map((x,i)=>i===0?Number(x):Number("20"+x));const list=[];for(let i=0;i<5;i++){const y=startYr-i;list.push(`${y}-${String(y+1).slice(2)}`);}return list;};
const DEFAULT_SEASONS=buildSeasons();

const USERS=[{id:1,name:"Owner",password:"owner123",role:"owner"},{id:2,name:"Mike R.",password:"mike123",role:"salesperson"},{id:3,name:"Jess T.",password:"jess123",role:"salesperson"}];
const AD_SIZES=[{id:1,name:'1/24 Page (3.5"×0.75")',price:60},{id:2,name:'1/16 Page (3.5"×1.0")',price:75},{id:3,name:'Business Card (3.5"×2")',price:100},{id:4,name:'1/4 Page (3.5"×4")',price:175},{id:5,name:'1/2 Page (5.0"×8.0")',price:350},{id:6,name:'Full Page (10"×8")',price:800},{id:7,name:"Inside Front/Back Cover",price:1500},{id:8,name:"Rankings Ad - Weekly",price:100},{id:9,name:"Rankings Ad - Season",price:750},{id:10,name:"Website Ad - Small",price:60},{id:11,name:"Website Ad - Medium",price:150},{id:12,name:"Website Ad - Large",price:300}];
const RANKINGS=["SD Boys Class A","SD Boys Class B","SD Girls","ND Boys Class A","ND Boys Class B","ND Girls Class A","ND Girls Class B"];
const SHIRT_SIZES=["SM","MD","LG","XL","XXL","SO"];
const PRODUCT_OPTIONS=["Book (Digital)","Book (Print)","T-Shirt"];
const ALL_ITEM_OPTIONS=[{value:"__ad__",label:"── Ad Sizes ──",disabled:true},...AD_SIZES.map(a=>({value:a.name,label:a.name,disabled:false})),{value:"__prod__",label:"── Products ──",disabled:true},...PRODUCT_OPTIONS.map(n=>({value:n,label:n,disabled:false}))];
const PRODUCT_PRICES={"Book (Digital)":20,"Book (Print)":30,"T-Shirt":25};
const INIT_PRODS=[{id:1,name:"Dakota Grappler Book (Digital)",price:20,type:"Book",sizes:[],photo:null},{id:2,name:"Dakota Grappler Book (Print)",price:30,type:"Book",sizes:[],photo:null},{id:3,name:"Dakota Grappler T-Shirt",price:25,type:"Apparel",sizes:SHIRT_SIZES,photo:null}];
const INIT_BOOKS=[{id:1,season:"2024-25",name:"Dakota Grappler Preseason Book 2024-25",pages:198,uploaded:"2024-10-01",file:null},{id:2,season:"2023-24",name:"Dakota Grappler Preseason Book 2023-24",pages:192,uploaded:"2023-10-05",file:null}];
const INIT_SP=[{id:1,name:"Owner",commission:0},{id:2,name:"Mike R.",commission:10},{id:3,name:"Jess T.",commission:8}];

function Badge({text,color="navy"}){const s={navy:{bg:NAVY,col:GOLD_LIGHT},gold:{bg:GOLD,col:NAVY},red:{bg:"#fdecea",col:RED},green:{bg:"#eaf7ef",col:GREEN},orange:{bg:"#fff3e0",col:"#e65100"},blue:{bg:"#e8f0fe",col:"#1a56db"},purple:{bg:"#f3e8ff",col:"#7c3aed"}}[color]||{bg:NAVY,col:WHITE};return <span style={{background:s.bg,color:s.col,borderRadius:4,fontSize:11,fontWeight:600,padding:"2px 8px",whiteSpace:"nowrap"}}>{text}</span>;}
function Btn({children,onClick,color="navy",small,full,disabled}){const bg={navy:NAVY,gold:GOLD,green:GREEN,red:RED,light:LIGHT_BG}[color]||NAVY;const col={gold:NAVY,light:NAVY}[color]||WHITE;return <button disabled={disabled} onClick={onClick} style={{background:bg,color:col,border:color==="light"?`1px solid ${BORDER}`:"none",borderRadius:7,padding:small?"5px 11px":"8px 16px",fontWeight:600,cursor:disabled?"not-allowed":"pointer",fontSize:small?12:13,width:full?"100%":"auto",opacity:disabled?.6:1}}>{children}</button>;}
function Inp({label,value,onChange,type="text",placeholder,half}){return <div style={{marginBottom:10,flex:half?"1 1 48%":"1 1 100%"}}>{label&&<label style={{display:"block",color:MUTED,fontSize:12,marginBottom:3}}>{label}</label>}<input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder||label||""} style={{width:"100%",border:`1px solid ${BORDER}`,borderRadius:6,padding:"7px 10px",fontSize:13,boxSizing:"border-box",color:NAVY}}/></div>;}
function Sel({label,value,onChange,options,half}){return <div style={{marginBottom:10,flex:half?"1 1 48%":"1 1 100%"}}>{label&&<label style={{display:"block",color:MUTED,fontSize:12,marginBottom:3}}>{label}</label>}<select value={value} onChange={e=>onChange(e.target.value)} style={{width:"100%",border:`1px solid ${BORDER}`,borderRadius:6,padding:"7px 10px",fontSize:13,color:NAVY,background:WHITE,boxSizing:"border-box"}}>{options.map(o=>typeof o==="string"?<option key={o} value={o}>{o}</option>:<option key={o.value} value={o.value} disabled={o.disabled}>{o.label}</option>)}</select></div>;}
function Modal({title,onClose,children,wide}){return <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:"1rem"}} onClick={onClose}><div style={{background:WHITE,borderRadius:12,width:wide?640:420,maxWidth:"98vw",maxHeight:"92vh",display:"flex",flexDirection:"column",overflow:"hidden"}} onClick={e=>e.stopPropagation()}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"1.25rem 1.5rem 1rem",borderBottom:`1px solid ${BORDER}`,flexShrink:0}}><h3 style={{margin:0,color:NAVY,fontWeight:700,fontSize:16}}>{title}</h3><button onClick={onClose} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:MUTED,lineHeight:1}}>✕</button></div><div style={{overflowY:"auto",padding:"1.25rem 1.5rem 1.5rem",flex:1}}>{children}</div></div></div>;}
function StatCard({label,value,sub,color}){return <div style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:10,padding:"1rem 1.25rem",borderTop:`3px solid ${color||GOLD}`}}><div style={{color:MUTED,fontSize:11,fontWeight:500,marginBottom:4}}>{label}</div><div style={{fontSize:22,fontWeight:700,color:NAVY}}>{value}</div>{sub&&<div style={{fontSize:11,color:MUTED,marginTop:2}}>{sub}</div>}</div>;}
function InfoBox({children,color="blue"}){const s={blue:{bg:"#e8f0fe",border:"#93c5fd",col:"#1e3a8a"},yellow:{bg:"#fff8e1",border:"#ffe082",col:"#7d5a00"},orange:{bg:"#fff3e0",border:"#ffb74d",col:"#e65100"},green:{bg:"#eaf7ef",border:"#86efac",col:"#14532d"},red:{bg:"#fdecea",border:"#fca5a5",col:RED}}[color]||{bg:"#e8f0fe",border:"#93c5fd",col:"#1e3a8a"};return <div style={{background:s.bg,border:`1px solid ${s.border}`,borderRadius:7,padding:"9px 13px",fontSize:13,color:s.col,marginBottom:"1rem"}}>{children}</div>;}
function PhotoUp({label,value,onChange}){const ref=useRef();return <div style={{marginBottom:10}}>{label&&<label style={{display:"block",color:MUTED,fontSize:12,marginBottom:3}}>{label}</label>}<div style={{display:"flex",alignItems:"center",gap:10}}>{value?<img src={value} style={{width:56,height:56,objectFit:"cover",borderRadius:6,border:`1px solid ${BORDER}`}}/>:<div style={{width:56,height:56,borderRadius:6,border:`2px dashed ${BORDER}`,display:"flex",alignItems:"center",justifyContent:"center",color:MUTED,fontSize:10}}>None</div>}<Btn small color="light" onClick={()=>ref.current.click()}>📷 {value?"Change":"Upload"}</Btn>{value&&<Btn small color="red" onClick={()=>onChange(null)}>✕</Btn>}</div><input ref={ref} type="file" accept="image/*" style={{display:"none"}} onChange={e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>onChange(ev.target.result);r.readAsDataURL(f);}}/></div>;}

function DatePicker({label,value,onChange,half}){
  const [open,setOpen]=useState(false);
  const ref=useRef();
  const parsed=value?new Date(value+"T12:00:00"):new Date();
  const [view,setView]=useState({month:parsed.getMonth(),year:parsed.getFullYear()});
  useEffect(()=>{const h=e=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false);};document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);},[]);
  const MONTHS=["January","February","March","April","May","June","July","August","September","October","November","December"];
  const DAYS=["Su","Mo","Tu","We","Th","Fr","Sa"];
  const firstDay=new Date(view.year,view.month,1).getDay();
  const daysInMonth=new Date(view.year,view.month+1,0).getDate();
  const cells=[];for(let i=0;i<firstDay;i++)cells.push(null);for(let d=1;d<=daysInMonth;d++)cells.push(d);
  const selDate=value?new Date(value+"T12:00:00"):null;
  const isSel=d=>selDate&&selDate.getFullYear()===view.year&&selDate.getMonth()===view.month&&selDate.getDate()===d;
  const pick=d=>{const dt=new Date(view.year,view.month,d);onChange(`${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}-${String(dt.getDate()).padStart(2,"0")}`);setOpen(false);};
  const display=value?new Date(value+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}):"Select date";
  return <div style={{marginBottom:10,flex:half?"1 1 48%":"1 1 100%",position:"relative"}} ref={ref}>
    {label&&<label style={{display:"block",color:MUTED,fontSize:12,marginBottom:3}}>{label}</label>}
    <button type="button" onClick={()=>setOpen(o=>!o)} style={{width:"100%",border:`1px solid ${open?NAVY:BORDER}`,borderRadius:6,padding:"7px 10px",fontSize:13,color:value?NAVY:MUTED,background:WHITE,textAlign:"left",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <span>📅 {display}</span><span style={{color:MUTED,fontSize:11}}>▾</span>
    </button>
    {open&&<div style={{position:"absolute",top:"calc(100% + 4px)",left:0,background:WHITE,border:`1px solid ${BORDER}`,borderRadius:10,boxShadow:"0 4px 20px rgba(0,0,0,0.12)",zIndex:300,width:260,padding:"12px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <button onClick={()=>setView(v=>{const m=v.month===0?11:v.month-1;const y=v.month===0?v.year-1:v.year;return{month:m,year:y};})} style={{background:"none",border:"none",cursor:"pointer",fontSize:16,color:NAVY,padding:"2px 6px"}}>‹</button>
        <div style={{fontWeight:600,color:NAVY,fontSize:13}}>{MONTHS[view.month]} {view.year}</div>
        <button onClick={()=>setView(v=>{const m=v.month===11?0:v.month+1;const y=v.month===11?v.year+1:v.year;return{month:m,year:y};})} style={{background:"none",border:"none",cursor:"pointer",fontSize:16,color:NAVY,padding:"2px 6px"}}>›</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:4}}>{DAYS.map(d=><div key={d} style={{textAlign:"center",fontSize:11,color:MUTED,fontWeight:600,padding:"2px 0"}}>{d}</div>)}</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>{cells.map((d,i)=>d?<button key={i} onClick={()=>pick(d)} style={{background:isSel(d)?NAVY:LIGHT_BG,color:isSel(d)?GOLD_LIGHT:NAVY,border:"none",borderRadius:5,padding:"5px 2px",fontSize:12,cursor:"pointer",fontWeight:isSel(d)?700:400,textAlign:"center"}}>{d}</button>:<div key={i}/>)}</div>
      <div style={{borderTop:`1px solid ${BORDER}`,marginTop:10,paddingTop:8,display:"flex",justifyContent:"center"}}>
        <button onClick={()=>{const now=new Date();pick(now.getDate());setView({month:now.getMonth(),year:now.getFullYear()});}} style={{background:LIGHT_BG,border:`1px solid ${BORDER}`,borderRadius:5,padding:"4px 14px",fontSize:12,cursor:"pointer",color:NAVY,fontWeight:500}}>Today</button>
      </div>
    </div>}
  </div>;
}

function SeasonPicker({value,onChange,seasons,setSeasons}){
  const [adding,setAdding]=useState(false);
  const [newStart,setNewStart]=useState("");
  const addSeason=()=>{
    const yr=Number(newStart.trim());
    if(!newStart.trim()||isNaN(yr)||yr<2000||yr>2200){alert("Please enter a valid 4-digit start year");return;}
    const label=`${yr}-${String(yr+1).slice(2)}`;
    if(seasons.includes(label)){alert("That season already exists.");setAdding(false);setNewStart("");return;}
    const updated=[...seasons,label].sort((a,b)=>b.localeCompare(a));
    setSeasons(updated);onChange(label);setAdding(false);setNewStart("");
  };
  return <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
    <select value={value} onChange={e=>onChange(e.target.value)} style={{border:`1px solid ${BORDER}`,borderRadius:6,padding:"6px 10px",fontSize:13,color:NAVY,background:WHITE}}>
      {seasons.map(s=><option key={s} value={s}>{s}</option>)}
    </select>
    {!adding
      ?<button onClick={()=>setAdding(true)} style={{background:LIGHT_BG,border:`1px solid ${BORDER}`,borderRadius:6,padding:"6px 10px",fontSize:12,cursor:"pointer",color:NAVY,fontWeight:500,whiteSpace:"nowrap"}}>+ New Season</button>
      :<div style={{display:"flex",gap:6,alignItems:"center"}}>
        <input type="number" placeholder="Start year e.g. 2026" value={newStart} onChange={e=>setNewStart(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addSeason()} autoFocus style={{width:170,border:`1px solid ${GOLD}`,borderRadius:6,padding:"5px 9px",fontSize:13,color:NAVY}}/>
        <button onClick={addSeason} style={{background:NAVY,color:WHITE,border:"none",borderRadius:6,padding:"5px 12px",fontSize:12,cursor:"pointer",fontWeight:600}}>Add</button>
        <button onClick={()=>{setAdding(false);setNewStart("");}} style={{background:"none",border:"none",color:MUTED,cursor:"pointer",fontSize:18,lineHeight:1}}>✕</button>
      </div>}
  </div>;
}

function SignaturePad({value,onChange}){
  const canvasRef=useRef();
  const drawing=useRef(false);
  const getPos=(e,canvas)=>{const r=canvas.getBoundingClientRect();const src=e.touches?e.touches[0]:e;return{x:(src.clientX-r.left)*(canvas.width/r.width),y:(src.clientY-r.top)*(canvas.height/r.height)};};
  const start=e=>{e.preventDefault();drawing.current=true;const c=canvasRef.current;const ctx=c.getContext("2d");const p=getPos(e,c);ctx.beginPath();ctx.moveTo(p.x,p.y);};
  const move=e=>{e.preventDefault();if(!drawing.current)return;const c=canvasRef.current;const ctx=c.getContext("2d");const p=getPos(e,c);ctx.lineWidth=2.5;ctx.lineCap="round";ctx.strokeStyle=NAVY;ctx.lineTo(p.x,p.y);ctx.stroke();};
  const end=e=>{e.preventDefault();drawing.current=false;onChange(canvasRef.current.toDataURL());};
  const clear=()=>{const c=canvasRef.current;c.getContext("2d").clearRect(0,0,c.width,c.height);onChange(null);};
  useEffect(()=>{if(value&&canvasRef.current){const img=new Image();img.onload=()=>canvasRef.current.getContext("2d").drawImage(img,0,0);img.src=value;}},[]);
  return <div>
    <div style={{border:`1px solid ${BORDER}`,borderRadius:8,overflow:"hidden",background:"#fafbff",position:"relative"}}>
      <canvas ref={canvasRef} width={560} height={120} style={{display:"block",width:"100%",height:120,cursor:"crosshair",touchAction:"none"}} onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end} onTouchStart={start} onTouchMove={move} onTouchEnd={end}/>
      {!value&&<div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",pointerEvents:"none",color:"#c0c8d8",fontSize:13,fontStyle:"italic"}}>Sign here with finger or mouse</div>}
    </div>
    <div style={{display:"flex",justifyContent:"flex-end",marginTop:4}}><button onClick={clear} style={{background:"none",border:"none",color:MUTED,fontSize:12,cursor:"pointer",textDecoration:"underline"}}>Clear signature</button></div>
  </div>;
}

function LineItemEditor({lineItems,setLineItems}){
  const updateLine=(idx,key,val)=>{setLineItems(prev=>{const lines=[...prev];lines[idx]={...lines[idx],[key]:val};if(key==="adSize"){const ad=AD_SIZES.find(a=>a.name===val);const pp=PRODUCT_PRICES[val];lines[idx].basePrice=ad?ad.price:pp||0;lines[idx].size="";}const bp=lines[idx].basePrice;const disc=lines[idx].discountType==="%"?(bp*Number(lines[idx].discount||0)/100):Number(lines[idx].discount||0);lines[idx].amount=Math.max(0,bp-disc);return lines;});};
  const addLine=()=>setLineItems(prev=>[...prev,{id:Date.now(),adSize:AD_SIZES[0].name,adType:"Book",basePrice:AD_SIZES[0].price,discount:0,discountType:"$",amount:AD_SIZES[0].price,size:"",qty:1}]);
  const removeLine=idx=>setLineItems(prev=>prev.filter((_,i)=>i!==idx));
  const total=lineItems.reduce((s,l)=>s+(l.amount*(l.qty||1)),0);
  return <div>
    <div style={{fontWeight:600,color:NAVY,fontSize:13,margin:"8px 0 6px"}}>Ad / Product Line Items</div>
    {lineItems.map((li,idx)=>{
      const disc=li.discountType==="%"?(li.basePrice*Number(li.discount||0)/100):Number(li.discount||0);
      const isTshirt=li.adSize==="T-Shirt";
      const isProd=PRODUCT_OPTIONS.includes(li.adSize);
      return <div key={li.id} style={{background:LIGHT_BG,borderRadius:8,padding:"10px 12px",marginBottom:8}}>
        <div style={{display:"flex",flexWrap:"wrap",gap:"0 12px"}}>
          <div style={{flex:"1 1 48%",marginBottom:10}}>
            <label style={{display:"block",color:MUTED,fontSize:12,marginBottom:3}}>Item</label>
            <select value={li.adSize} onChange={e=>updateLine(idx,"adSize",e.target.value)} style={{width:"100%",border:`1px solid ${BORDER}`,borderRadius:6,padding:"7px 10px",fontSize:13,color:NAVY,background:WHITE}}>
              {ALL_ITEM_OPTIONS.map(o=><option key={o.value} value={o.value} disabled={o.disabled}>{o.label}</option>)}
            </select>
          </div>
          {!isProd&&<div style={{flex:"1 1 48%",marginBottom:10}}>
            <label style={{display:"block",color:MUTED,fontSize:12,marginBottom:3}}>Ad Type</label>
            <select value={li.adType||"Book"} onChange={e=>updateLine(idx,"adType",e.target.value)} style={{width:"100%",border:`1px solid ${BORDER}`,borderRadius:6,padding:"7px 10px",fontSize:13,color:NAVY,background:WHITE}}>
              {["Book","Rankings - SD Boys A","Rankings - SD Boys B","Rankings - SD Girls","Rankings - ND Boys A","Rankings - ND Boys B","Rankings - ND Girls A","Rankings - ND Girls B","Website","Facebook","Future Project"].map(t=><option key={t}>{t}</option>)}
            </select>
          </div>}
          {isTshirt&&<div style={{flex:"1 1 48%",marginBottom:10}}>
            <label style={{display:"block",color:MUTED,fontSize:12,marginBottom:3}}>Size</label>
            <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{SHIRT_SIZES.map(sz=><button type="button" key={sz} onClick={()=>updateLine(idx,"size",sz)} style={{background:li.size===sz?NAVY:WHITE,color:li.size===sz?WHITE:NAVY,border:`1px solid ${li.size===sz?NAVY:BORDER}`,borderRadius:5,padding:"4px 10px",fontSize:12,cursor:"pointer",fontWeight:li.size===sz?600:400}}>{sz}</button>)}</div>
            {!li.size&&<div style={{color:"#e65100",fontSize:11,marginTop:3}}>⚠️ Select a size</div>}
          </div>}
          {isProd&&!isTshirt&&<div style={{flex:"1 1 48%",marginBottom:10}}>
            <label style={{display:"block",color:MUTED,fontSize:12,marginBottom:3}}>Qty</label>
            <input type="number" min="1" value={li.qty||1} onChange={e=>updateLine(idx,"qty",Number(e.target.value))} style={{width:"100%",border:`1px solid ${BORDER}`,borderRadius:6,padding:"7px 10px",fontSize:13,boxSizing:"border-box"}}/>
          </div>}
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
          <span style={{fontSize:12,color:MUTED}}>Base: ${li.basePrice}</span>
          <select value={li.discountType} onChange={e=>updateLine(idx,"discountType",e.target.value)} style={{border:`1px solid ${BORDER}`,borderRadius:5,padding:"5px 7px",fontSize:12,color:NAVY}}><option>$</option><option>%</option></select>
          <input type="number" min="0" value={li.discount||0} onChange={e=>updateLine(idx,"discount",e.target.value)} style={{width:58,border:`1px solid ${BORDER}`,borderRadius:5,padding:"5px 8px",fontSize:12}}/>
          <span style={{fontSize:12,color:MUTED}}>off</span>
          <span style={{fontWeight:700,color:NAVY,fontSize:13}}>= ${li.amount.toLocaleString()}{(li.qty||1)>1?` × ${li.qty} = $${(li.amount*(li.qty||1)).toLocaleString()}`:""}</span>
          {disc>0&&<span style={{color:GREEN,fontSize:11}}>−${disc.toFixed(0)} saved</span>}
          {lineItems.length>1&&<button onClick={()=>removeLine(idx)} style={{marginLeft:"auto",background:"none",border:"none",color:RED,cursor:"pointer",fontSize:16,lineHeight:1}}>✕</button>}
        </div>
      </div>;
    })}
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
      <Btn small color="light" onClick={addLine}>+ Add Line Item</Btn>
      <div style={{fontWeight:700,color:NAVY}}>Invoice Total: ${total.toLocaleString()}</div>
    </div>
  </div>;
}

function AdStatusPicker({f,set}){
  const opts=[{key:"sameAd",label:"Same Ad",desc:"Using last year's ad",color:"#1a7a4a",bg:"#eaf7ef"},{key:"newAd",label:"New Ad",desc:"New artwork this year",color:"#e65100",bg:"#fff3e0"},{key:"newAdvertiser",label:"New Advertiser",desc:"First time advertiser",color:"#1a56db",bg:"#e8f0fe"}];
  return <div style={{marginBottom:12}}>
    <label style={{display:"block",color:MUTED,fontSize:12,marginBottom:6}}>Ad Status</label>
    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
      {opts.map(opt=>{const active=f[opt.key];return <button type="button" key={opt.key} onClick={()=>{if(opt.key==="sameAd"){set("sameAd",!active);if(!active){set("newAd",false);set("newAdvertiser",false);}}else if(opt.key==="newAd"){set("newAd",!active);if(!active)set("sameAd",false);}else{set("newAdvertiser",!active);if(!active)set("sameAd",false);}}} style={{display:"flex",flexDirection:"column",alignItems:"flex-start",padding:"9px 14px",borderRadius:8,border:active?`2px solid ${opt.color}`:`1px solid ${BORDER}`,background:active?opt.bg:WHITE,cursor:"pointer",minWidth:130,textAlign:"left"}}>
        <div style={{display:"flex",alignItems:"center",gap:7}}><div style={{width:16,height:16,borderRadius:4,border:`2px solid ${active?opt.color:BORDER}`,background:active?opt.color:WHITE,display:"flex",alignItems:"center",justifyContent:"center"}}>{active&&<span style={{color:WHITE,fontSize:11,fontWeight:700}}>✓</span>}</div><span style={{fontWeight:600,fontSize:13,color:active?opt.color:NAVY}}>{opt.label}</span></div>
        <div style={{fontSize:11,color:MUTED,marginTop:3,marginLeft:23}}>{opt.desc}</div>
      </button>;})}
    </div>
    {f.sameAd&&<div style={{marginTop:8,background:"#eaf7ef",border:"1px solid #86efac",borderRadius:6,padding:"7px 12px",fontSize:12,color:"#14532d"}}>✓ Using last year's ad — no artwork update needed</div>}
    {f.newAd&&<div style={{marginTop:8,background:"#fff3e0",border:"1px solid #ffb74d",borderRadius:6,padding:"7px 12px",fontSize:12,color:"#e65100"}}>⚠️ New ad — remember to update artwork in the upcoming book</div>}
    {f.newAdvertiser&&<div style={{marginTop:8,background:"#e8f0fe",border:"1px solid #93c5fd",borderRadius:6,padding:"7px 12px",fontSize:12,color:"#1e3a8a"}}>🌟 New advertiser — welcome to Dakota Grappler!</div>}
  </div>;
}

function AdvForm({existing,onSave,onClose,salespeople,user,seasons,allAdvertisers}){
  const makeBlank=()=>({business:"",contact:"",email:"",phone:"",address:"",city:"",state:"ND",zip:"",season:seasons[0]||getCurrentSeason(),salesperson:user.name,lineItems:[{id:1,adSize:AD_SIZES[0].name,adType:"Book",basePrice:AD_SIZES[0].price,discount:0,discountType:"$",amount:AD_SIZES[0].price,size:"",qty:1}],paid:false,dateSale:new Date().toISOString().slice(0,10),datePaid:"",payMethod:"check",checkNum:"",newAd:false,newAdvertiser:true,sameAd:false,overdue:false,notes:"",adPhoto:null,lastYearPhoto:null,history:[]});
  const [f,setF]=useState(existing?{...existing}:makeBlank());
  const [lineItems,setLineItems]=useState(existing?[...existing.lineItems]:[{id:1,adSize:AD_SIZES[0].name,adType:"Book",basePrice:AD_SIZES[0].price,discount:0,discountType:"$",amount:AD_SIZES[0].price,size:"",qty:1}]);
  const [search,setSearch]=useState("");
  const [results,setResults]=useState([]);
  const [showDrop,setShowDrop]=useState(false);
  const [pulledFrom,setPulledFrom]=useState(null);
  const [dupWarn,setDupWarn]=useState(false);
  const searchRef=useRef();
  const set=(k,v)=>setF(p=>({...p,[k]:v}));
  useEffect(()=>{if(!search.trim()||existing){setResults([]);setShowDrop(false);return;}const q=search.toLowerCase();const seen=new Set();const found=[];[...allAdvertisers].sort((a,b)=>b.season.localeCompare(a.season)).forEach(a=>{if(!seen.has(a.business.toLowerCase())&&a.business.toLowerCase().includes(q)){seen.add(a.business.toLowerCase());found.push(a);}});setResults(found.slice(0,6));setShowDrop(found.length>0);},[search]);
  useEffect(()=>{const h=e=>{if(searchRef.current&&!searchRef.current.contains(e.target))setShowDrop(false);};document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);},[]);
  const pullAdvertiser=a=>{const dup=allAdvertisers.find(x=>x.business.toLowerCase()===a.business.toLowerCase()&&x.season===f.season&&(!existing||x.id!==existing.id));if(dup){setDupWarn(true);setShowDrop(false);setSearch(a.business);return;}setDupWarn(false);const refreshed=a.lineItems.map(li=>{const cur=AD_SIZES.find(s=>s.name===li.adSize);const pp=PRODUCT_PRICES[li.adSize];const bp=cur?cur.price:pp||li.basePrice;return{...li,id:Date.now()+Math.random(),basePrice:bp,discount:0,discountType:"$",amount:bp,size:"",qty:1};});const hist=[...new Set([...(a.history||[]),a.season])].sort((x,y)=>y.localeCompare(x));setF(prev=>({...a,id:undefined,season:prev.season,salesperson:prev.salesperson,paid:false,dateSale:new Date().toISOString().slice(0,10),datePaid:"",checkNum:"",payMethod:"check",newAd:false,newAdvertiser:false,sameAd:true,overdue:false,lastYearPhoto:a.adPhoto||a.lastYearPhoto||null,adPhoto:null,history:hist}));setLineItems(refreshed);setPulledFrom(a);setSearch(a.business);setShowDrop(false);};
  const total=lineItems.reduce((s,l)=>s+(l.amount*(l.qty||1)),0);
  const handleSave=()=>onSave({...f,lineItems,totalAmount:total,id:existing?existing.id:Date.now(),overdue:!f.paid});
  return <div>
    {!existing&&<div style={{marginBottom:14}}>
      <label style={{display:"block",color:MUTED,fontSize:12,marginBottom:3}}>🔍 Search Returning Advertiser</label>
      <div style={{position:"relative"}} ref={searchRef}>
        <input value={search} onChange={e=>{setSearch(e.target.value);setDupWarn(false);setPulledFrom(null);}} placeholder="Start typing a business name…" style={{width:"100%",border:`1px solid ${pulledFrom?GREEN:BORDER}`,borderRadius:6,padding:"8px 10px",fontSize:13,boxSizing:"border-box",color:NAVY,background:pulledFrom?"#eaf7ef":WHITE}}/>
        {showDrop&&<div style={{position:"absolute",top:"100%",left:0,right:0,background:WHITE,border:`1px solid ${BORDER}`,borderRadius:8,boxShadow:"0 4px 16px rgba(0,0,0,0.12)",zIndex:400,overflow:"hidden"}}>
          {results.map(a=><button key={a.id} type="button" onClick={()=>pullAdvertiser(a)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",width:"100%",padding:"10px 14px",border:"none",borderBottom:`1px solid ${BORDER}`,background:WHITE,cursor:"pointer",textAlign:"left",fontSize:13}} onMouseEnter={e=>e.currentTarget.style.background=LIGHT_BG} onMouseLeave={e=>e.currentTarget.style.background=WHITE}>
            <div><div style={{fontWeight:600,color:NAVY}}>{a.business}</div><div style={{color:MUTED,fontSize:11}}>{a.contact}{a.city?` · ${a.city}`:""}{a.state?`, ${a.state}`:""}</div></div>
            <div style={{textAlign:"right",flexShrink:0,marginLeft:12}}><Badge text={a.season} color="navy"/><div style={{color:MUTED,fontSize:11,marginTop:3}}>${a.totalAmount?.toLocaleString()}</div></div>
          </button>)}
          <button type="button" onClick={()=>setShowDrop(false)} style={{width:"100%",padding:"8px",border:"none",background:LIGHT_BG,cursor:"pointer",fontSize:12,color:MUTED}}>✕ Close</button>
        </div>}
      </div>
      {dupWarn&&<InfoBox color="red">⚠️ <strong>{search}</strong> already has a record in the {f.season} season.</InfoBox>}
      {pulledFrom&&!dupWarn&&<InfoBox color="green">✓ Info pulled from <strong>{pulledFrom.season}</strong> — review and update below.</InfoBox>}
      {!pulledFrom&&!dupWarn&&!search&&<div style={{fontSize:11,color:MUTED,marginTop:4}}>Search to auto-fill a returning advertiser, or leave blank to add a new one.</div>}
    </div>}
    {pulledFrom&&<div style={{background:"#fff8e1",border:"1px solid #ffe082",borderRadius:8,padding:"10px 14px",marginBottom:12,fontSize:13}}>
      <div style={{fontWeight:600,color:"#7d5a00",marginBottom:6}}>📋 Last Year ({pulledFrom.season})</div>
      <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>{pulledFrom.lineItems.map((li,i)=><span key={i} style={{color:"#7d5a00",fontSize:12}}>{li.adSize} — <strong>${li.amount}</strong></span>)}<span style={{color:"#7d5a00",fontSize:12}}>Total: <strong>${pulledFrom.totalAmount?.toLocaleString()}</strong></span></div>
    </div>}
    <div style={{display:"flex",flexWrap:"wrap",gap:"0 12px"}}>
      <Inp label="Business Name" value={f.business} onChange={v=>set("business",v)} half/>
      <Inp label="Contact Name" value={f.contact} onChange={v=>set("contact",v)} half/>
      <Inp label="Email" value={f.email} onChange={v=>set("email",v)} type="email" half/>
      <Inp label="Phone" value={f.phone} onChange={v=>set("phone",v)} half/>
      <Inp label="Street Address" value={f.address} onChange={v=>set("address",v)}/>
      <Inp label="City" value={f.city||""} onChange={v=>set("city",v)} half/>
      <Inp label="State" value={f.state||"ND"} onChange={v=>set("state",v)} half/>
      <Inp label="Zip Code" value={f.zip||""} onChange={v=>set("zip",v)} half/>
      <Sel label="Season" value={f.season} onChange={v=>set("season",v)} options={seasons} half/>
      <Sel label="Salesperson" value={f.salesperson} onChange={v=>set("salesperson",v)} options={salespeople.map(s=>s.name)} half/>
    </div>
    <LineItemEditor lineItems={lineItems} setLineItems={setLineItems}/>
    <div style={{display:"flex",flexWrap:"wrap",gap:"0 12px"}}>
      <DatePicker label="Date of Sale" value={f.dateSale} onChange={v=>set("dateSale",v)} half/>
      <Sel label="Payment Method" value={f.payMethod} onChange={v=>set("payMethod",v)} options={["check","cash","Square","PayPal","Venmo"]} half/>
      {f.payMethod==="check"&&<Inp label="Check #" value={f.checkNum} onChange={v=>set("checkNum",v)} half/>}
    </div>
    <div style={{display:"flex",gap:20,marginBottom:12,flexWrap:"wrap",alignItems:"center"}}>
      <label style={{display:"flex",alignItems:"center",gap:7,fontSize:13,color:NAVY,cursor:"pointer"}}><input type="checkbox" checked={f.paid} onChange={e=>set("paid",e.target.checked)}/> Paid</label>
      {f.paid&&<DatePicker label="Date Paid" value={f.datePaid} onChange={v=>set("datePaid",v)} half/>}
    </div>
    <AdStatusPicker f={f} set={set}/>
    <PhotoUp label="Current Ad Photo" value={f.adPhoto} onChange={v=>set("adPhoto",v)}/>
    <PhotoUp label="Last Year's Ad Photo" value={f.lastYearPhoto} onChange={v=>set("lastYearPhoto",v)}/>
    <Inp label="Notes" value={f.notes} onChange={v=>set("notes",v)} placeholder="Notes about this advertiser…"/>
    <div style={{display:"flex",gap:8,marginTop:"1rem"}}><Btn full color="light" onClick={onClose}>Cancel</Btn><Btn full onClick={handleSave}>Save Advertiser</Btn></div>
  </div>;
}

function ImportAdvertisers({onImport,seasons}){
  const [showForm,setShowForm]=useState(false);
  const [preview,setPreview]=useState([]);
  const [error,setError]=useState("");
  const fileRef=useRef();
  const handleFile=e=>{const file=e.target.files[0];if(!file)return;const reader=new FileReader();reader.onload=ev=>{try{const text=ev.target.result;const lines=text.split("\n").filter(l=>l.trim());const headers=lines[0].split(",").map(h=>h.trim().toLowerCase().replace(/"/g,""));const rows=lines.slice(1).map(line=>{const vals=line.split(",").map(v=>v.trim().replace(/"/g,""));const obj={};headers.forEach((h,i)=>obj[h]=vals[i]||"");return obj;}).filter(r=>r.business||r["business name"]);setPreview(rows);setError("");}catch(err){setError("Could not read file.");}};reader.readAsText(file);};
  const doImport=()=>{const imported=preview.map((r,idx)=>({id:Date.now()+idx,business:r.business||r["business name"]||"",contact:r.contact||r["contact name"]||"",email:r.email||"",phone:r.phone||"",address:r.address||"",city:r.city||"",state:r.state||"ND",zip:r.zip||"",season:r.season||seasons[0]||getCurrentSeason(),salesperson:r.salesperson||"Owner",lineItems:[{id:1,adSize:r["ad size"]||AD_SIZES[0].name,adType:r["ad type"]||"Book",basePrice:Number(r.amount||0),discount:0,discountType:"$",amount:Number(r.amount||0),size:"",qty:1}],totalAmount:Number(r.amount||r.total||0),paid:(r.paid||"").toLowerCase()==="yes",dateSale:r["date sale"]||new Date().toISOString().slice(0,10),datePaid:r["date paid"]||"",payMethod:r["pay method"]||"check",checkNum:r["check #"]||"",newAd:false,newAdvertiser:false,sameAd:true,overdue:false,notes:r.notes||"",adPhoto:null,lastYearPhoto:null,history:[],signature:null}));onImport(imported);setShowForm(false);setPreview([]);alert(`✓ Successfully imported ${imported.length} advertisers!`);};
  return <div style={{marginBottom:"1rem"}}>
    <Btn color="light" onClick={()=>setShowForm(true)}>📥 Import from CSV</Btn>
    {showForm&&<Modal title="Import Advertisers from CSV" onClose={()=>{setShowForm(false);setPreview([]);setError("");}} wide>
      <div style={{marginBottom:"1rem"}}>
        <div style={{fontWeight:600,color:NAVY,fontSize:14,marginBottom:8}}>Step 1 — Download the template</div>
        <Btn small color="light" onClick={()=>{const csv=`Business Name,Contact Name,Email,Phone,Address,City,State,Zip,Season,Salesperson,Ad Size,Ad Type,Amount,Paid,Date Sale,Date Paid,Pay Method,Check #,Notes\nBismarck Hardware Co.,Tom Fischer,tom@bisco.com,701-555-0101,123 Main St,Bismarck,ND,58501,2024-25,Owner,Full Page (10"x8"),Book,800,Yes,2024-09-10,2024-09-20,check,4421,Returning advertiser`;const blob=new Blob([csv],{type:"text/csv"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="dakota-grappler-import-template.csv";a.click();}}>⬇️ Download Template CSV</Btn>
        <div style={{fontSize:12,color:MUTED,marginTop:6}}>Fill this out in Excel or Google Sheets, save as CSV, then upload below.</div>
      </div>
      <div style={{marginBottom:"1rem"}}>
        <div style={{fontWeight:600,color:NAVY,fontSize:14,marginBottom:8}}>Step 2 — Upload your filled CSV</div>
        <Btn small color="light" onClick={()=>fileRef.current.click()}>📁 Choose CSV File</Btn>
        <input ref={fileRef} type="file" accept=".csv" style={{display:"none"}} onChange={handleFile}/>
      </div>
      {error&&<InfoBox color="red">⚠️ {error}</InfoBox>}
      {preview.length>0&&<div>
        <div style={{fontWeight:600,color:NAVY,fontSize:14,marginBottom:8}}>Step 3 — Preview ({preview.length} advertisers found)</div>
        <div style={{background:LIGHT_BG,borderRadius:8,overflow:"auto",maxHeight:240,marginBottom:"1rem"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:500}}>
            <thead><tr style={{background:NAVY,color:WHITE}}>{["Business","Contact","Season","Ad Size","Amount","Paid"].map(h=><th key={h} style={{padding:"7px 10px",textAlign:"left",fontWeight:600}}>{h}</th>)}</tr></thead>
            <tbody>{preview.map((r,i)=><tr key={i} style={{background:i%2===0?WHITE:LIGHT_BG}}><td style={{padding:"6px 10px",color:NAVY,fontWeight:500}}>{r.business||r["business name"]}</td><td style={{padding:"6px 10px",color:MUTED}}>{r.contact||r["contact name"]}</td><td style={{padding:"6px 10px",color:MUTED}}>{r.season}</td><td style={{padding:"6px 10px",color:MUTED}}>{r["ad size"]}</td><td style={{padding:"6px 10px",color:MUTED}}>${r.amount}</td><td style={{padding:"6px 10px"}}>{(r.paid||"").toLowerCase()==="yes"?<Badge text="Yes" color="green"/>:<Badge text="No" color="orange"/>}</td></tr>)}</tbody>
          </table>
        </div>
        <div style={{display:"flex",gap:8}}><Btn full color="light" onClick={()=>{setPreview([]);setShowForm(false);}}>Cancel</Btn><Btn full color="green" onClick={doImport}>✓ Import {preview.length} Advertisers</Btn></div>
      </div>}
    </Modal>}
  </div>;
}

function InvoicePreview({a,onSigned,settings}){
  const [sig,setSig]=useState(a.signature||null);
  const [saved,setSaved]=useState(!!a.signature);
  const total=a.lineItems.reduce((s,l)=>s+(l.amount*(l.qty||1)),0);
  const saveSig=()=>{if(onSigned)onSigned(sig);setSaved(true);};
  const clearSig=()=>{setSig(null);setSaved(false);if(onSigned)onSigned(null);};
  const brandName=settings?.brand||"DAKOTA GRAPPLER";
  const footerMsg=settings?.footer||"Thanks from Dakota Grappler!";
  const paypalUser=settings?.paypalUsername||"dakotagrappler";
  const venmoUser=settings?.venmoUsername||"dakotagrappler";
const squareLink=settings?.squareLink||"https://square.link/u/9eXw7aSp";
  return <div>
    <div style={{borderBottom:`3px solid ${GOLD}`,paddingBottom:"1rem",marginBottom:"1rem"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div><div style={{fontWeight:800,fontSize:20,color:NAVY}}>🤼 {brandName}</div><div style={{color:GOLD,fontWeight:600,fontSize:11,marginTop:2}}>Preseason Wrestling Book · {a.season}</div></div>
        <div style={{textAlign:"right",fontSize:11,color:MUTED}}><div>Date: {a.dateSale}</div><div>Invoice #: DG-{String(a.id).padStart(4,"0")}</div></div>
      </div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:"1rem",fontSize:13}}>
      <div style={{background:LIGHT_BG,borderRadius:6,padding:"10px 12px"}}><div style={{color:MUTED,fontSize:10,marginBottom:3}}>BILL TO</div><div style={{fontWeight:600,color:NAVY}}>{a.business}</div><div style={{color:MUTED}}>{a.contact}</div><div style={{color:MUTED}}>{[a.address,a.city,a.state,a.zip].filter(Boolean).join(", ")}</div><div style={{color:MUTED}}>{a.email}</div></div>
      <div style={{background:LIGHT_BG,borderRadius:6,padding:"10px 12px"}}><div style={{color:MUTED,fontSize:10,marginBottom:3}}>ACCOUNT REP</div><div style={{fontWeight:600,color:NAVY}}>{a.salesperson}</div><div style={{color:MUTED,marginTop:6,fontSize:10}}>STATUS</div><div style={{fontWeight:700,color:a.paid?GREEN:a.overdue?RED:GOLD,fontSize:13}}>{a.paid?"✓ PAID":a.overdue?"⚠️ OVERDUE":"OUTSTANDING"}</div>{a.datePaid&&<div style={{color:MUTED,fontSize:11}}>Paid {a.datePaid}</div>}</div>
    </div>
    <table style={{width:"100%",borderCollapse:"collapse",fontSize:13,marginBottom:"1rem"}}>
      <thead><tr style={{background:NAVY,color:WHITE}}><th style={{padding:"8px 12px",textAlign:"left",fontWeight:600}}>Description</th><th style={{padding:"8px 12px",textAlign:"right",fontWeight:600}}>Base</th><th style={{padding:"8px 12px",textAlign:"right",fontWeight:600}}>Discount</th><th style={{padding:"8px 12px",textAlign:"right",fontWeight:600}}>Total</th></tr></thead>
      <tbody>
        {a.lineItems.map((li,i)=>{const disc=li.discountType==="%"?(li.basePrice*Number(li.discount||0)/100):Number(li.discount||0);return <tr key={i} style={{background:i%2===0?LIGHT_BG:WHITE,borderBottom:`1px solid ${BORDER}`}}><td style={{padding:"8px 12px"}}><div style={{color:NAVY,fontWeight:500}}>{li.adSize}{li.size?` (${li.size})`:""}{(li.qty||1)>1?` × ${li.qty}`:""}</div><div style={{color:MUTED,fontSize:11}}>{li.adType}</div></td><td style={{padding:"8px 12px",textAlign:"right",color:MUTED}}>${li.basePrice}</td><td style={{padding:"8px 12px",textAlign:"right",color:disc>0?GREEN:MUTED}}>{disc>0?`−$${disc.toFixed(0)}`:"—"}</td><td style={{padding:"8px 12px",textAlign:"right",fontWeight:700,color:NAVY}}>${(li.amount*(li.qty||1)).toLocaleString()}</td></tr>;})}
        <tr style={{background:NAVY+"11"}}><td colSpan={3} style={{padding:"9px 12px",fontWeight:700,color:NAVY}}>TOTAL DUE</td><td style={{padding:"9px 12px",textAlign:"right",fontWeight:800,color:NAVY,fontSize:16}}>${total.toLocaleString()}</td></tr>
      </tbody>
    </table>
    {a.payMethod&&<div style={{fontSize:12,color:MUTED,marginBottom:"1rem"}}>Payment method: {a.payMethod}{a.checkNum?" #"+a.checkNum:""}</div>}
    <div style={{borderTop:`2px solid ${GOLD}`,paddingTop:"1rem",marginBottom:"1rem"}}>
      <div style={{fontWeight:700,color:NAVY,fontSize:13,marginBottom:6}}>📋 Terms &amp; Agreement</div>
      <p style={{fontSize:12,color:MUTED,lineHeight:1.7,margin:"0 0 1rem 0"}}>By signing below, the advertiser agrees to purchase the advertising described above in the Dakota Grappler Preseason Wrestling Book and/or associated media. <strong style={{color:NAVY}}>Payment is due within 15 days of purchase</strong> unless an alternative arrangement has been agreed upon with Dakota Grappler management. Dakota Grappler reserves the right to withhold ad placement until payment is received.</p>
      <div style={{fontWeight:600,color:NAVY,fontSize:13,marginBottom:6}}>✍️ Advertiser Signature</div>
      <SignaturePad value={sig} onChange={v=>{setSig(v);setSaved(false);}}/>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:8,flexWrap:"wrap",gap:6}}>
        <div style={{fontSize:11,color:MUTED}}>Signed: <strong>{a.contact}</strong> · {a.dateSale}</div>
        <div style={{display:"flex",gap:6}}>{sig&&!saved&&<Btn small color="green" onClick={saveSig}>✓ Save Signature</Btn>}{sig&&<Btn small color="light" onClick={clearSig}>Clear</Btn>}{saved&&<span style={{color:GREEN,fontSize:12,fontWeight:600}}>✓ Saved</span>}</div>
      </div>
    </div>
    <div style={{background:NAVY,borderRadius:8,padding:"12px 16px",marginBottom:"1rem",textAlign:"center"}}>
      <div style={{color:WHITE,fontSize:12,marginBottom:6,fontWeight:500}}>{footerMsg} Find us at <span style={{color:GOLD_LIGHT}}>dakotagrappler.com</span></div>
    </div>
    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
      <Btn full onClick={()=>alert("📧 Invoice emailed to "+a.email)}>📧 Email to {a.contact}</Btn>
      <Btn full color="gold" onClick={()=>window.print()}>🖨️ Print</Btn>
      <Btn full color="green" onClick={()=>window.open(`https://www.paypal.com/paypalme/${paypalUser}/${total}`,'_blank')}>🅿 PayPal ${total.toLocaleString()}</Btn>
      <Btn full color="light" onClick={()=>window.open(`https://venmo.com/${venmoUser}?txn=pay&amount=${total}&note=DakotaGrappler-DG-${String(a.id).padStart(4,"0")}`,'_blank')}>💸 Venmo ${total.toLocaleString()}</Btn>
      <Btn full color="light" onClick={()=>window.open(squareLink,'_blank')}>◻️ Square ${total.toLocaleString()}</Btn>
    </div>
  </div>;
}

function Login({onLogin}){
  const [u,setU]=useState("");const [p,setP]=useState("");const [err,setErr]=useState("");
  const go=()=>{const f=USERS.find(x=>x.name===u&&x.password===p);f?onLogin(f):setErr("Invalid username or password.");};
  return <div style={{minHeight:"100vh",background:NAVY,display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem"}}><div style={{background:WHITE,borderRadius:14,padding:"2.5rem 2rem",width:340,maxWidth:"100%"}}><div style={{textAlign:"center",marginBottom:"1.75rem"}}><div style={{fontSize:42}}>🤼</div><div style={{fontWeight:800,fontSize:24,color:NAVY}}>DAKOTA GRAPPLER</div><div style={{color:GOLD,fontWeight:600,fontSize:13,marginTop:2}}>Business Management</div></div>{err&&<InfoBox color="orange">⚠️ {err}</InfoBox>}<Sel label="Select User" value={u} onChange={setU} options={[{value:"",label:"— Choose —"},...USERS.map(x=>({value:x.name,label:`${x.name} (${x.role})`}))]}/><Inp label="Password" type="password" value={p} onChange={setP} placeholder="Password"/><div style={{marginBottom:"1.25rem"}}><Btn full onClick={go}>Sign In</Btn></div><div style={{background:LIGHT_BG,borderRadius:8,padding:"10px 12px",fontSize:12,color:MUTED}}><strong style={{color:NAVY}}>Demo logins:</strong><br/>Owner: owner123 · Mike R.: mike123 · Jess T.: jess123</div></div></div>;
}

function Sidebar({active,setActive,user,onLogout}){
  const items=[{id:"dashboard",icon:"📊",label:"Dashboard"},{id:"advertisers",icon:"🏢",label:"Advertisers"},{id:"invoices",icon:"🧾",label:"Invoices"},{id:"products",icon:"📦",label:"Products"},{id:"rankings",icon:"🏆",label:"Rankings Ads"},{id:"website",icon:"🌐",label:"Website Ads"},{id:"books",icon:"📚",label:"Book Library"},{id:"event",icon:"🛒",label:"Event Sale"},{id:"mileage",icon:"🚗",label:"Mileage"},{id:"reports",icon:"📈",label:"Reports"},...(user.role==="owner"?[{id:"settings",icon:"⚙️",label:"Settings"}]:[])];
  return <div style={{width:190,minWidth:190,background:NAVY,minHeight:"100vh",display:"flex",flexDirection:"column"}}><div style={{padding:"1.2rem 1rem .75rem",borderBottom:"1px solid rgba(200,150,12,.25)"}}><div style={{color:GOLD_LIGHT,fontWeight:800,fontSize:15}}>🤼 DAKOTA</div><div style={{color:GOLD,fontWeight:800,fontSize:15}}>GRAPPLER</div><div style={{color:"rgba(255,255,255,.45)",fontSize:11,marginTop:3}}>{user.name} · {user.role}</div></div><nav style={{flex:1,padding:".4rem 0"}}>{items.map(it=><button key={it.id} onClick={()=>setActive(it.id)} style={{display:"flex",alignItems:"center",gap:9,width:"100%",background:active===it.id?"rgba(200,150,12,.18)":"transparent",border:"none",borderLeft:active===it.id?`3px solid ${GOLD}`:"3px solid transparent",color:active===it.id?GOLD_LIGHT:"rgba(255,255,255,.7)",padding:"9px 1rem",cursor:"pointer",fontSize:13,fontWeight:active===it.id?600:400,textAlign:"left"}}><span>{it.icon}</span>{it.label}</button>)}</nav><button onClick={onLogout} style={{margin:".75rem",background:"rgba(255,255,255,.08)",color:"rgba(255,255,255,.6)",border:"1px solid rgba(255,255,255,.12)",borderRadius:7,padding:"8px",fontSize:12,cursor:"pointer"}}>Sign Out</button></div>;
}

function Dashboard({advertisers,user,seasons,setSeasons}){
  const [season,setSeason]=useState(seasons[0]||getCurrentSeason());
  const [cmpSeason,setCmpSeason]=useState("");
  const mine=user.role==="owner"?advertisers:advertisers.filter(a=>a.salesperson===user.name);
  const cur=mine.filter(a=>a.season===season);
  const cmp=cmpSeason?mine.filter(a=>a.season===cmpSeason):null;
  const total=cur.reduce((s,a)=>s+a.totalAmount,0);
  const paid=cur.filter(a=>a.paid).reduce((s,a)=>s+a.totalAmount,0);
  const overdue=cur.filter(a=>a.overdue);
  const newAds=cur.filter(a=>a.newAd);
  const newAdvs=cur.filter(a=>a.newAdvertiser);
  const cmpTotal=cmp?cmp.reduce((s,a)=>s+a.totalAmount,0):null;
  const cmpPaid=cmp?cmp.filter(a=>a.paid).reduce((s,a)=>s+a.totalAmount,0):null;
  const delta=(a,b)=>b===null?null:{val:Math.abs(a-b),up:a>=b};
  return <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.25rem",flexWrap:"wrap",gap:10}}>
      <h2 style={{color:NAVY,fontWeight:700,margin:0}}>Dashboard</h2>
      <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
        <SeasonPicker value={season} onChange={v=>{setSeason(v);setCmpSeason("");}} seasons={seasons} setSeasons={setSeasons}/>
        <div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:12,color:MUTED,whiteSpace:"nowrap"}}>Compare to:</span><select value={cmpSeason} onChange={e=>setCmpSeason(e.target.value)} style={{border:`1px solid ${BORDER}`,borderRadius:6,padding:"6px 10px",fontSize:13,color:NAVY,background:WHITE}}><option value="">— none —</option>{seasons.filter(s=>s!==season).map(s=><option key={s} value={s}>{s}</option>)}</select></div>
      </div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:12,marginBottom:"1.5rem"}}>
      {[{label:"Total Sales",val:`$${total.toLocaleString()}`,color:NAVY,d:delta(total,cmpTotal)},{label:"Collected",val:`$${paid.toLocaleString()}`,color:GREEN,d:delta(paid,cmpPaid)},{label:"Outstanding",val:`$${(total-paid).toLocaleString()}`,color:GOLD,d:null},{label:"Overdue",val:overdue.length,color:RED,d:null,sub:"Past 15 days"},{label:"New Ads",val:newAds.length,color:"#7c3aed",d:null,sub:"Book update needed"},{label:"New Advertisers",val:newAdvs.length,color:"#0ea5e9",d:null,sub:"This season"}].map(({label,val,color,d,sub})=>(
        <div key={label} style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:10,padding:"1rem 1.25rem",borderTop:`3px solid ${color}`}}>
          <div style={{color:MUTED,fontSize:11,fontWeight:500,marginBottom:4}}>{label}</div>
          <div style={{fontSize:22,fontWeight:700,color:NAVY}}>{val}</div>
          {d&&<div style={{fontSize:11,fontWeight:600,color:d.up?GREEN:RED,marginTop:2}}>{d.up?"▲":"▼"} ${d.val.toLocaleString()} vs {cmpSeason}</div>}
          {!d&&sub&&<div style={{fontSize:11,color:MUTED,marginTop:2}}>{sub}</div>}
        </div>
      ))}
    </div>
    {cmp&&<div style={{background:"#e8f0fe",border:"1px solid #93c5fd",borderRadius:9,padding:"10px 16px",marginBottom:"1.25rem",fontSize:13,color:"#1e3a8a",display:"flex",gap:24,flexWrap:"wrap"}}><span><strong>{cmpSeason}:</strong> ${cmpTotal.toLocaleString()} total</span><span style={{color:GREEN}}>Collected: ${cmpPaid.toLocaleString()}</span><span style={{color:GOLD}}>Outstanding: ${(cmpTotal-cmpPaid).toLocaleString()}</span><span>{cmp.length} advertiser{cmp.length!==1?"s":""}</span></div>}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
      <div style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:10,padding:"1rem"}}>
        <div style={{fontWeight:600,color:NAVY,marginBottom:10,fontSize:14}}>⚠️ Overdue</div>
        {overdue.length===0&&<div style={{color:MUTED,fontSize:13}}>No overdue accounts.</div>}
        {overdue.map(a=><div key={a.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:`1px solid ${BORDER}`,fontSize:13}}><div><div style={{fontWeight:500,color:NAVY}}>{a.business}</div><div style={{color:MUTED,fontSize:11}}>{a.salesperson} · {a.dateSale}</div></div><div style={{textAlign:"right",display:"flex",flexDirection:"column",gap:3}}><div style={{color:RED,fontWeight:700}}>${a.totalAmount.toLocaleString()}</div><Btn small onClick={()=>alert("📧 Reminder sent to "+a.email)}>📧 Remind</Btn></div></div>)}
      </div>
      <div style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:10,padding:"1rem"}}>
        <div style={{fontWeight:600,color:NAVY,marginBottom:10,fontSize:14}}>🆕 New Ads</div>
        {newAds.length===0&&<div style={{color:MUTED,fontSize:13}}>No new ads pending.</div>}
        {newAds.map(a=><div key={a.id} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:`1px solid ${BORDER}`,fontSize:13}}><div><div style={{fontWeight:500,color:NAVY}}>{a.business}</div><div style={{color:MUTED,fontSize:11}}>{a.lineItems[0]?.adSize}</div></div><Badge text="NEW AD" color="orange"/></div>)}
        {newAdvs.length>0&&<><div style={{fontWeight:600,color:NAVY,margin:"12px 0 8px",fontSize:13}}>🌟 New Advertisers</div>{newAdvs.map(a=><div key={a.id} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",fontSize:13}}><div style={{color:NAVY}}>{a.business}</div><Badge text="NEW" color="blue"/></div>)}</>}
      </div>
    </div>
  </div>;
}

function Advertisers({advertisers,setAdvertisers,salespeople,user,seasons,setSeasons,settings}){
  const [filter,setFilter]=useState("all");
  const [sort,setSort]=useState("business");
  const [season,setSeason]=useState(seasons[0]||getCurrentSeason());
  const [showForm,setShowForm]=useState(false);
  const [editing,setEditing]=useState(null);
  const [selected,setSelected]=useState(null);
  const [invoiceView,setInvoiceView]=useState(null);
  const filtered=advertisers.filter(a=>a.season===season).filter(a=>{if(filter==="paid")return a.paid;if(filter==="unpaid")return!a.paid;if(filter==="overdue")return a.overdue;if(filter==="newad")return a.newAd;if(filter==="newadv")return a.newAdvertiser;if(filter==="samead")return a.sameAd;return true;}).sort((a,b)=>{if(sort==="business")return a.business.localeCompare(b.business);if(sort==="amount")return b.totalAmount-a.totalAmount;if(sort==="salesperson")return a.salesperson.localeCompare(b.salesperson);if(sort==="date")return a.dateSale.localeCompare(b.dateSale);return 0;});
  const save=async adv=>{
    try{
      let advertiserId;
      if(editing){
        await supabase.from('advertisers').update({business:adv.business,contact:adv.contact,email:adv.email,phone:adv.phone,address:adv.address,city:adv.city,state:adv.state,zip:adv.zip,notes:adv.notes,ad_photo:adv.adPhoto,last_year_photo:adv.lastYearPhoto}).eq('id',adv.advertiser_id||adv.id);
        advertiserId=adv.advertiser_id||adv.id;
      }else{
        const {data}=await supabase.from('advertisers').insert({business:adv.business,contact:adv.contact,email:adv.email,phone:adv.phone,address:adv.address,city:adv.city,state:adv.state,zip:adv.zip,notes:adv.notes,ad_photo:adv.adPhoto,last_year_photo:adv.lastYearPhoto}).select();
        advertiserId=data[0].id;
      }
      const seasonData={advertiser_id:advertiserId,season:adv.season,salesperson:adv.salesperson,paid:adv.paid,date_sale:adv.dateSale||null,date_paid:adv.datePaid||null,pay_method:adv.payMethod,check_num:adv.checkNum,new_ad:adv.newAd,new_advertiser:adv.newAdvertiser,same_ad:adv.sameAd,overdue:adv.overdue,signature:adv.signature,total_amount:adv.totalAmount};
      let seasonId;
      if(editing){await supabase.from('advertiser_seasons').update(seasonData).eq('id',adv.id);seasonId=adv.id;}
      else{const {data}=await supabase.from('advertiser_seasons').insert(seasonData).select();seasonId=data[0].id;}
      await supabase.from('line_items').delete().eq('advertiser_season_id',seasonId);
      await supabase.from('line_items').insert(adv.lineItems.map(li=>({advertiser_season_id:seasonId,ad_size:li.adSize,ad_type:li.adType,base_price:li.basePrice,discount:li.discount,discount_type:li.discountType,amount:li.amount,size:li.size,qty:li.qty})));
      setAdvertisers(prev=>editing?prev.map(a=>a.id===adv.id?{...adv,advertiser_id:advertiserId}:a):[...prev,{...adv,id:seasonId,advertiser_id:advertiserId}]);
      setShowForm(false);setEditing(null);
    }catch(err){console.error(err);alert("Error saving. Please try again.");}
  };
  const markPaid=async id=>{await supabase.from('advertiser_seasons').update({paid:true,date_paid:new Date().toISOString().slice(0,10),overdue:false}).eq('id',id);setAdvertisers(prev=>prev.map(a=>a.id===id?{...a,paid:true,datePaid:new Date().toISOString().slice(0,10),overdue:false}:a));};
  const unmarkPaid=async id=>{await supabase.from('advertiser_seasons').update({paid:false,date_paid:null,overdue:false}).eq('id',id);setAdvertisers(prev=>prev.map(a=>a.id===id?{...a,paid:false,datePaid:"",overdue:false}:a));};
  const clearNewAd=async id=>{await supabase.from('advertiser_seasons').update({new_ad:false}).eq('id',id);setAdvertisers(prev=>prev.map(a=>a.id===id?{...a,newAd:false}:a));};
  return <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem",flexWrap:"wrap",gap:8}}>
      <h2 style={{color:NAVY,fontWeight:700,margin:0}}>Advertisers</h2>
      <div style={{display:"flex",gap:8}}>
        <ImportAdvertisers onImport={imported=>setAdvertisers(prev=>[...prev,...imported])} seasons={seasons}/>
        <Btn onClick={()=>{setEditing(null);setShowForm(true);}}>+ Add Advertiser</Btn>
      </div>
    </div>
    <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:"1rem",alignItems:"center"}}>
      <SeasonPicker value={season} onChange={setSeason} seasons={seasons} setSeasons={setSeasons}/>
      <select value={filter} onChange={e=>setFilter(e.target.value)} style={{border:`1px solid ${BORDER}`,borderRadius:6,padding:"6px 10px",fontSize:13,color:NAVY,background:WHITE}}><option value="all">All</option><option value="paid">Paid</option><option value="unpaid">Unpaid</option><option value="overdue">Overdue</option><option value="newad">New Ads</option><option value="samead">Same Ad</option><option value="newadv">New Advertisers</option></select>
      <select value={sort} onChange={e=>setSort(e.target.value)} style={{border:`1px solid ${BORDER}`,borderRadius:6,padding:"6px 10px",fontSize:13,color:NAVY,background:WHITE}}><option value="business">Sort: Business</option><option value="amount">Sort: Amount</option><option value="salesperson">Sort: Rep</option><option value="date">Sort: Date</option></select>
    </div>
    <div style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:10,overflowX:"auto"}}>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:13,minWidth:580}}>
        <thead><tr style={{background:NAVY,color:WHITE}}>{["Business","Items","Total","Rep","Status","Actions"].map(h=><th key={h} style={{padding:"10px 12px",textAlign:h==="Total"?"right":"left",fontWeight:600,whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
        <tbody>{filtered.map((a,i)=><tr key={a.id} style={{background:i%2===0?LIGHT_BG:WHITE,borderBottom:`1px solid ${BORDER}`}}>
          <td style={{padding:"9px 12px"}}><div style={{fontWeight:600,color:NAVY}}>{a.business}</div><div style={{color:MUTED,fontSize:11}}>{a.contact}</div><div style={{display:"flex",gap:3,marginTop:3,flexWrap:"wrap"}}>{a.newAd&&<Badge text="NEW AD" color="orange"/>}{a.sameAd&&<Badge text="SAME AD" color="green"/>}{a.newAdvertiser&&<Badge text="NEW" color="blue"/>}{a.history?.length>0&&<Badge text={`${a.history.length}yr`} color="purple"/>}</div></td>
          <td style={{padding:"9px 12px",color:MUTED,fontSize:12}}>{a.lineItems.length} item{a.lineItems.length!==1?"s":""}</td>
          <td style={{padding:"9px 12px",textAlign:"right",fontWeight:700,color:NAVY}}>${a.totalAmount.toLocaleString()}</td>
          <td style={{padding:"9px 12px",color:MUTED,fontSize:12}}>{a.salesperson}</td>
          <td style={{padding:"9px 12px"}}>{a.paid?<Badge text="Paid" color="green"/>:a.overdue?<Badge text="Overdue" color="red"/>:<Badge text="Unpaid" color="orange"/>}</td>
          <td style={{padding:"9px 12px"}}><div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
            <Btn small onClick={()=>setSelected(a)}>View</Btn>
            <Btn small color="gold" onClick={()=>{setEditing(a);setShowForm(true);}}>Edit</Btn>
            <Btn small onClick={()=>setInvoiceView(a)}>Invoice</Btn>
            {!a.paid&&<Btn small color="green" onClick={()=>markPaid(a.id)}>✓ Pay</Btn>}
            {a.paid&&<Btn small color="light" onClick={()=>unmarkPaid(a.id)}>↩ Unpay</Btn>}
            {a.newAd&&<Btn small color="red" onClick={()=>clearNewAd(a.id)}>Clear</Btn>}
            <Btn small color="red" onClick={async()=>{if(window.confirm(`Delete ${a.business}?`)){await supabase.from('advertiser_seasons').delete().eq('id',a.id);setAdvertisers(prev=>prev.filter(x=>x.id!==a.id));}}}>🗑</Btn>
          </div></td>
        </tr>)}</tbody>
      </table>
      {filtered.length===0&&<div style={{padding:"2rem",textAlign:"center",color:MUTED}}>No advertisers found for this season.</div>}
    </div>
    {showForm&&<Modal title={editing?"Edit Advertiser":"Add New Advertiser"} onClose={()=>{setShowForm(false);setEditing(null);}} wide><AdvForm existing={editing} onSave={save} onClose={()=>{setShowForm(false);setEditing(null);}} salespeople={salespeople} user={user} seasons={seasons} allAdvertisers={advertisers}/></Modal>}
    {selected&&<Modal title={selected.business} onClose={()=>setSelected(null)} wide>
      {selected.newAd&&<InfoBox color="orange">⚠️ NEW AD — remember to update the upcoming book</InfoBox>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,fontSize:13,marginBottom:"1rem"}}>{[["Contact",selected.contact],["Email",selected.email],["Phone",selected.phone],["Address",[selected.address,selected.city,selected.state,selected.zip].filter(Boolean).join(", ")],["Season",selected.season],["Salesperson",selected.salesperson],["Total","$"+selected.totalAmount?.toLocaleString()],["Date of Sale",selected.dateSale],["Date Paid",selected.datePaid||"—"],["Payment",selected.payMethod+(selected.checkNum?" #"+selected.checkNum:"")],["Status",selected.paid?"✓ Paid":selected.overdue?"⚠️ Overdue":"Unpaid"],["History",selected.history?.length>0?selected.history.join(", "):"First year"]].map(([k,v])=><div key={k} style={{background:LIGHT_BG,borderRadius:6,padding:"8px 10px"}}><div style={{color:MUTED,fontSize:11}}>{k}</div><div style={{fontWeight:500,color:NAVY,fontSize:13}}>{v}</div></div>)}</div>
      <div style={{fontWeight:600,color:NAVY,fontSize:13,marginBottom:8}}>Line Items</div>
      {selected.lineItems.map((li,i)=><div key={i} style={{background:LIGHT_BG,borderRadius:6,padding:"8px 12px",marginBottom:6,display:"flex",justifyContent:"space-between",fontSize:13}}><div><div style={{fontWeight:500,color:NAVY}}>{li.adSize}{li.size?` (${li.size})`:""}</div><div style={{color:MUTED,fontSize:11}}>{li.adType}</div></div><div style={{fontWeight:700,color:NAVY}}>${(li.amount*(li.qty||1)).toLocaleString()}</div></div>)}
      {selected.notes&&<div style={{background:LIGHT_BG,borderRadius:6,padding:"8px 12px",fontSize:13,marginTop:"1rem"}}><span style={{color:MUTED}}>Notes: </span>{selected.notes}</div>}
      <div style={{display:"flex",gap:8,marginTop:"1rem",flexWrap:"wrap"}}>
        <Btn full onClick={()=>{setSelected(null);setInvoiceView(selected);}}>🧾 Invoice</Btn>
        <Btn full onClick={()=>alert("📧 Invoice emailed to "+selected.email)}>📧 Email</Btn>
        {!selected.paid&&<Btn full color="green" onClick={()=>{markPaid(selected.id);setSelected(prev=>({...prev,paid:true}));}}>✓ Mark Paid</Btn>}
        {selected.paid&&<Btn full color="light" onClick={()=>{unmarkPaid(selected.id);setSelected(prev=>({...prev,paid:false,datePaid:""}));}}>↩ Unmark Paid</Btn>}
      </div>
    </Modal>}
    {invoiceView&&<Modal title="Invoice" onClose={()=>setInvoiceView(null)} wide>
      <InvoicePreview a={invoiceView} settings={settings} onSigned={sig=>{const updated={...invoiceView,signature:sig};setAdvertisers(prev=>prev.map(a=>a.id===invoiceView.id?{...a,signature:sig}:a));setInvoiceView(updated);}}/>
    </Modal>}
  </div>;
}

function Invoices({advertisers,setAdvertisers,seasons,setSeasons,settings}){
  const [season,setSeason]=useState(seasons[0]||getCurrentSeason());
  const [sel,setSel]=useState(null);
  const [sf,setSf]=useState("all");
  const list=advertisers.filter(a=>a.season===season).filter(a=>{if(sf==="paid")return a.paid;if(sf==="unpaid")return!a.paid;if(sf==="overdue")return a.overdue;return true;});
  return <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem",flexWrap:"wrap",gap:8}}>
      <h2 style={{color:NAVY,fontWeight:700,margin:0}}>Invoices</h2>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
        <SeasonPicker value={season} onChange={setSeason} seasons={seasons} setSeasons={setSeasons}/>
        <select value={sf} onChange={e=>setSf(e.target.value)} style={{border:`1px solid ${BORDER}`,borderRadius:6,padding:"6px 10px",fontSize:13,color:NAVY,background:WHITE}}><option value="all">All</option><option value="paid">Paid</option><option value="unpaid">Unpaid</option><option value="overdue">Overdue</option></select>
      </div>
    </div>
    <div style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:10,overflowX:"auto"}}>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:13,minWidth:520}}>
        <thead><tr style={{background:NAVY,color:WHITE}}>{["Business","Items","Total","Status","Actions"].map(h=><th key={h} style={{padding:"10px 12px",textAlign:h==="Total"?"right":"left",fontWeight:600}}>{h}</th>)}</tr></thead>
        <tbody>{list.map((a,i)=><tr key={a.id} style={{background:i%2===0?LIGHT_BG:WHITE,borderBottom:`1px solid ${BORDER}`}}>
          <td style={{padding:"9px 12px"}}><div style={{fontWeight:500,color:NAVY}}>{a.business}</div><div style={{color:MUTED,fontSize:11}}>#{String(a.id).padStart(4,"0")} · {a.dateSale}</div></td>
          <td style={{padding:"9px 12px",color:MUTED,fontSize:12}}>{a.lineItems.length} line item{a.lineItems.length!==1?"s":""}</td>
          <td style={{padding:"9px 12px",textAlign:"right",fontWeight:700,color:NAVY}}>${a.totalAmount.toLocaleString()}</td>
          <td style={{padding:"9px 12px"}}>{a.paid?<Badge text="Paid" color="green"/>:a.overdue?<Badge text="Overdue" color="red"/>:<Badge text="Unpaid" color="orange"/>}</td>
          <td style={{padding:"9px 12px"}}><div style={{display:"flex",gap:5}}>
            <Btn small onClick={()=>setSel(a)}>View</Btn>
            <Btn small color="green" onClick={()=>alert("📧 Invoice emailed to "+a.email)}>📧</Btn>
            <Btn small color="gold" onClick={()=>window.print()}>🖨️</Btn>
            {a.overdue&&<Btn small color="red" onClick={()=>alert("📧 Reminder sent to "+a.email)}>⚠️</Btn>}
            <Btn small color="red" onClick={async()=>{if(window.confirm(`Delete invoice for ${a.business}?`)){await supabase.from('advertiser_seasons').delete().eq('id',a.id);setAdvertisers(prev=>prev.filter(x=>x.id!==a.id));}}}>🗑</Btn>
          </div></td>
        </tr>)}</tbody>
      </table>
    </div>
    {sel&&<Modal title="Invoice" onClose={()=>setSel(null)} wide><InvoicePreview a={sel} settings={settings} onSigned={sig=>setSel(prev=>({...prev,signature:sig}))}/></Modal>}
  </div>;
}

// ── PRODUCTS (Supabase connected) ──────────────────────────────────────────
function Products({user}){
  const [prods,setProds]=useState([]);
  const [loading,setLoading]=useState(true);
  const [adPrices,setAdPrices]=useState(AD_SIZES);
  const [tab,setTab]=useState("products");
  const [showForm,setShowForm]=useState(false);
  const [editProd,setEditProd]=useState(null);
  const [np,setNp]=useState({name:"",price:"",type:"Apparel",sizes:[],photo:null});
  const [ep,setEp]=useState({});

  useEffect(()=>{
    const load=async()=>{
      const {data,error}=await supabase.from('products').select('*').order('created_at');
      if(error){console.error(error);setLoading(false);return;}
      if(data&&data.length>0){
        setProds(data.map(p=>({id:p.id,name:p.name,price:p.price,type:p.type,sizes:p.sizes||[],photo:p.photo})));
      }else{
        // seed with defaults if empty
        const {data:inserted}=await supabase.from('products').insert(INIT_PRODS.map(p=>({name:p.name,price:p.price,type:p.type,sizes:p.sizes,photo:p.photo}))).select();
        if(inserted)setProds(inserted.map(p=>({id:p.id,name:p.name,price:p.price,type:p.type,sizes:p.sizes||[],photo:p.photo})));
      }
      setLoading(false);
    };
    load();
  },[]);

  const openEdit=p=>{setEditProd({...p});setShowForm(true);};
  const openAdd=()=>{setEditProd(null);setNp({name:"",price:"",type:"Apparel",sizes:[],photo:null});setShowForm(true);};

  const saveProduct=async()=>{
    if(editProd){
      await supabase.from('products').update({name:editProd.name,price:Number(editProd.price),type:editProd.type,sizes:editProd.sizes,photo:editProd.photo}).eq('id',editProd.id);
      setProds(prev=>prev.map(p=>p.id===editProd.id?{...editProd,price:Number(editProd.price)}:p));
    }else{
      const {data}=await supabase.from('products').insert({name:np.name,price:Number(np.price),type:np.type,sizes:np.sizes,photo:np.photo}).select();
      if(data)setProds(prev=>[...prev,{id:data[0].id,name:np.name,price:Number(np.price),type:np.type,sizes:np.sizes,photo:np.photo}]);
    }
    setShowForm(false);setEditProd(null);
  };

  const deleteProduct=async id=>{
    if(!window.confirm("Delete this product?"))return;
    await supabase.from('products').delete().eq('id',id);
    setProds(prev=>prev.filter(p=>p.id!==id));
  };

  const f=editProd||np;
  const setF=(k,v)=>editProd?setEditProd(p=>({...p,[k]:v})):setNp(p=>({...p,[k]:v}));

  if(loading)return <div style={{padding:"2rem",color:MUTED}}>Loading products…</div>;

  return <div>
    <h2 style={{color:NAVY,fontWeight:700,marginBottom:"1rem"}}>Products & Pricing</h2>
    <div style={{display:"flex",gap:8,marginBottom:"1rem"}}>{["products",...(user.role==="owner"?["adprices"]:[])].map(t=><Btn key={t} color={tab===t?"navy":"light"} small onClick={()=>setTab(t)}>{t==="products"?"Products":"Ad Prices (Owner)"}</Btn>)}</div>
    {tab==="products"&&<div>
      <div style={{display:"grid",gap:10,marginBottom:"1rem"}}>{prods.map(p=><div key={p.id} style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:10,padding:"1rem 1.25rem",display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap"}}>
        <div style={{display:"flex",gap:12,alignItems:"center"}}>{p.photo?<img src={p.photo} style={{width:56,height:56,objectFit:"cover",borderRadius:6,border:`1px solid ${BORDER}`}}/>:<div style={{width:56,height:56,borderRadius:6,border:`2px dashed ${BORDER}`,display:"flex",alignItems:"center",justifyContent:"center",color:MUTED,fontSize:10}}>No photo</div>}<div><div style={{fontWeight:600,color:NAVY}}>{p.name}</div><div style={{color:MUTED,fontSize:12}}>{p.type}{p.sizes&&p.sizes.length>0?" · "+p.sizes.join(", "):""}</div></div></div>
        <div style={{display:"flex",alignItems:"center",gap:10}}><div style={{fontWeight:700,color:NAVY,fontSize:16}}>${p.price}</div><Btn small color="gold" onClick={()=>openEdit(p)}>Edit</Btn><Btn small color="red" onClick={()=>deleteProduct(p.id)}>Delete</Btn></div>
      </div>)}</div>
      <Btn onClick={openAdd}>+ Add Product</Btn>
      {showForm&&<Modal title={editProd?"Edit Product":"Add Product"} onClose={()=>{setShowForm(false);setEditProd(null);}}>
        <Inp label="Product Name" value={f.name} onChange={v=>setF("name",v)}/>
        <Inp label="Price ($)" value={f.price} onChange={v=>setF("price",v)} type="number"/>
        <Sel label="Type" value={f.type} onChange={v=>setF("type",v)} options={["Apparel","Book","Other"]}/>
        {f.type==="Apparel"&&<div style={{marginBottom:10}}><label style={{display:"block",color:MUTED,fontSize:12,marginBottom:6}}>Sizes</label><div style={{display:"flex",gap:10,flexWrap:"wrap"}}>{SHIRT_SIZES.map(sz=><label key={sz} style={{display:"flex",alignItems:"center",gap:4,fontSize:13,cursor:"pointer"}}><input type="checkbox" checked={(f.sizes||[]).includes(sz)} onChange={e=>setF("sizes",e.target.checked?[...(f.sizes||[]),sz]:(f.sizes||[]).filter(s=>s!==sz))}/>{sz}</label>)}</div></div>}
        <PhotoUp label="Product Photo" value={f.photo} onChange={v=>setF("photo",v)}/>
        <div style={{display:"flex",gap:8,marginTop:"1rem"}}><Btn full color="light" onClick={()=>{setShowForm(false);setEditProd(null);}}>Cancel</Btn><Btn full onClick={saveProduct}>{editProd?"Save Changes":"Add Product"}</Btn></div>
      </Modal>}
    </div>}
    {tab==="adprices"&&user.role==="owner"&&<div>
      <InfoBox color="yellow">🔒 Owner only — changes apply to new sales going forward</InfoBox>
      <div style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:10,overflow:"hidden"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
          <thead><tr style={{background:NAVY,color:WHITE}}><th style={{padding:"10px 12px",textAlign:"left",fontWeight:600}}>Ad Size</th><th style={{padding:"10px 12px",textAlign:"right",fontWeight:600}}>Price</th><th style={{padding:"10px",textAlign:"right"}}></th></tr></thead>
          <tbody>{adPrices.map((a,i)=><tr key={a.id} style={{background:i%2===0?LIGHT_BG:WHITE,borderBottom:`1px solid ${BORDER}`}}>
            <td style={{padding:"9px 12px",color:NAVY,fontWeight:500}}>{a.name}</td>
            <td style={{padding:"9px 12px",textAlign:"right"}}><input type="number" value={ep[a.id]!==undefined?ep[a.id]:a.price} onChange={e=>setEp(p=>({...p,[a.id]:e.target.value}))} style={{width:85,border:`1px solid ${BORDER}`,borderRadius:5,padding:"5px 8px",textAlign:"right",fontSize:13}}/></td>
            <td style={{padding:"9px 12px",textAlign:"right"}}><Btn small color="gold" onClick={()=>setAdPrices(p=>p.map(x=>x.id===a.id?{...x,price:Number(ep[a.id]||a.price)}:x))}>Save</Btn></td>
          </tr>)}</tbody>
        </table>
      </div>
    </div>}
  </div>;
}

// ── RANKINGS ADS (Supabase connected) ──────────────────────────────────────
function Rankings(){
  const [entries,setEntries]=useState([]);
  const [loading,setLoading]=useState(true);
  const [showForm,setShowForm]=useState(false);
  const [f,setF]=useState({business:"",ranking:RANKINGS[0],type:"Season",weeks:[],paid:false});
  const set=(k,v)=>setF(p=>({...p,[k]:v}));

  useEffect(()=>{
    const load=async()=>{
      const {data,error}=await supabase.from('rankings_ads').select('*').order('created_at',{ascending:false});
      if(error){console.error(error);setLoading(false);return;}
      if(data)setEntries(data.map(r=>({id:r.id,business:r.business,ranking:r.ranking,type:r.type,weeks:r.weeks||[],amount:r.amount,paid:r.paid})));
      setLoading(false);
    };
    load();
  },[]);

  const total=f.type==="Season"?750:f.weeks.length*100;

  const save=async()=>{
    if(!f.business)return;
    const row={business:f.business,ranking:f.ranking,type:f.type,weeks:f.weeks,amount:total,paid:f.paid};
    const {data}=await supabase.from('rankings_ads').insert(row).select();
    if(data)setEntries(p=>[{id:data[0].id,...row},...p]);
    setShowForm(false);
    setF({business:"",ranking:RANKINGS[0],type:"Season",weeks:[],paid:false});
  };

  const deletEntry=async id=>{
    if(!window.confirm("Delete this rankings ad?"))return;
    await supabase.from('rankings_ads').delete().eq('id',id);
    setEntries(p=>p.filter(e=>e.id!==id));
  };

  const togglePaid=async(id,paid)=>{
    await supabase.from('rankings_ads').update({paid:!paid}).eq('id',id);
    setEntries(p=>p.map(e=>e.id===id?{...e,paid:!paid}:e));
  };

  if(loading)return <div style={{padding:"2rem",color:MUTED}}>Loading rankings ads…</div>;

  return <div>
    <h2 style={{color:NAVY,fontWeight:700,marginBottom:"1rem"}}>Wrestling Rankings Ads</h2>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:8,marginBottom:"1.25rem"}}>{RANKINGS.map(r=>{const c=entries.filter(e=>e.ranking===r).length;return <div key={r} style={{background:NAVY,color:GOLD_LIGHT,borderRadius:8,padding:"9px 12px",fontSize:12,fontWeight:500,display:"flex",justifyContent:"space-between",alignItems:"center"}}><span>🏆 {r}</span>{c>0&&<span style={{background:GOLD,color:NAVY,borderRadius:10,fontSize:10,padding:"1px 7px",fontWeight:700}}>{c}</span>}</div>;})}
    </div>
    <div style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:10,overflowX:"auto",marginBottom:"1rem"}}>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:13,minWidth:480}}>
        <thead><tr style={{background:NAVY,color:WHITE}}>{["Business","Ranking","Type","Weeks","Amount","Status",""].map(h=><th key={h} style={{padding:"10px 12px",textAlign:h==="Amount"?"right":"left",fontWeight:600}}>{h}</th>)}</tr></thead>
        <tbody>{entries.length===0&&<tr><td colSpan={7} style={{padding:"2rem",textAlign:"center",color:MUTED}}>No rankings ads yet.</td></tr>}
        {entries.map((e,i)=><tr key={e.id} style={{background:i%2===0?LIGHT_BG:WHITE,borderBottom:`1px solid ${BORDER}`}}>
          <td style={{padding:"9px 12px",fontWeight:500,color:NAVY}}>{e.business}</td>
          <td style={{padding:"9px 12px",color:MUTED,fontSize:12}}>{e.ranking}</td>
          <td style={{padding:"9px 12px"}}><Badge text={e.type} color={e.type==="Season"?"navy":"blue"}/></td>
          <td style={{padding:"9px 12px",color:MUTED,fontSize:12}}>{e.weeks&&e.weeks.length>0?e.weeks.join(", "):"Full Season"}</td>
          <td style={{padding:"9px 12px",textAlign:"right",fontWeight:700,color:NAVY}}>${e.amount}</td>
          <td style={{padding:"9px 12px"}}>{e.paid?<Badge text="Paid" color="green"/>:<Badge text="Unpaid" color="orange"/>}</td>
          <td style={{padding:"9px 12px"}}><div style={{display:"flex",gap:4}}>
            <Btn small color={e.paid?"light":"green"} onClick={()=>togglePaid(e.id,e.paid)}>{e.paid?"↩":"✓ Pay"}</Btn>
            <Btn small color="red" onClick={()=>deletEntry(e.id)}>🗑</Btn>
          </div></td>
        </tr>)}</tbody>
      </table>
    </div>
    <Btn onClick={()=>setShowForm(true)}>+ Add Rankings Ad</Btn>
    {showForm&&<Modal title="Add Rankings Ad" onClose={()=>setShowForm(false)}>
      <Inp label="Business Name" value={f.business} onChange={v=>set("business",v)}/>
      <Sel label="Ranking" value={f.ranking} onChange={v=>set("ranking",v)} options={RANKINGS}/>
      <Sel label="Type" value={f.type} onChange={v=>set("type",v)} options={[{value:"Season",label:"Full Season — $750"},{value:"Weekly",label:"Weekly — $100/wk"}]}/>
      {f.type==="Weekly"&&<div style={{marginBottom:10}}><label style={{display:"block",color:MUTED,fontSize:12,marginBottom:6}}>Select Weeks</label><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{["Wk 1","Wk 2","Wk 3","Wk 4","Wk 5","Wk 6","Wk 7","Wk 8"].map(w=><label key={w} style={{display:"flex",alignItems:"center",gap:4,fontSize:13,cursor:"pointer"}}><input type="checkbox" checked={f.weeks.includes(w)} onChange={e=>set("weeks",e.target.checked?[...f.weeks,w]:f.weeks.filter(x=>x!==w))}/>{w}</label>)}</div></div>}
      <div style={{background:LIGHT_BG,borderRadius:6,padding:"9px 12px",fontSize:13,marginBottom:10}}>Total: <strong>${total}</strong></div>
      <label style={{display:"flex",alignItems:"center",gap:7,fontSize:13,color:NAVY,cursor:"pointer",marginBottom:"1rem"}}><input type="checkbox" checked={f.paid} onChange={e=>set("paid",e.target.checked)}/> Mark as Paid</label>
      <div style={{display:"flex",gap:8}}><Btn full color="light" onClick={()=>setShowForm(false)}>Cancel</Btn><Btn full onClick={save}>Save</Btn></div>
    </Modal>}
  </div>;
}

// ── WEBSITE ADS (Supabase connected) ───────────────────────────────────────
function WebsiteAds(){
  const [ads,setAds]=useState([]);
  const [loading,setLoading]=useState(true);
  const [showForm,setShowForm]=useState(false);
  const [f,setF]=useState({business:"",size:"Small",months:1,paid:false});
  const set=(k,v)=>setF(p=>({...p,[k]:v}));
  const priceMap={Small:60,Medium:150,Large:300};

  useEffect(()=>{
    const load=async()=>{
      const {data,error}=await supabase.from('website_ads').select('*').order('created_at',{ascending:false});
      if(error){console.error(error);setLoading(false);return;}
      if(data)setAds(data.map(r=>({id:r.id,business:r.business,size:r.size,price:r.price,months:r.months,paid:r.paid})));
      setLoading(false);
    };
    load();
  },[]);

  const save=async()=>{
    if(!f.business)return;
    const price=priceMap[f.size]||60;
    const row={business:f.business,size:f.size,price,months:Number(f.months||1),paid:f.paid};
    const {data}=await supabase.from('website_ads').insert(row).select();
    if(data)setAds(p=>[{id:data[0].id,...row},...p]);
    setShowForm(false);
    setF({business:"",size:"Small",months:1,paid:false});
  };

  const deleteAd=async id=>{
    if(!window.confirm("Delete this website ad?"))return;
    await supabase.from('website_ads').delete().eq('id',id);
    setAds(p=>p.filter(a=>a.id!==id));
  };

  const togglePaid=async(id,paid)=>{
    await supabase.from('website_ads').update({paid:!paid}).eq('id',id);
    setAds(p=>p.map(a=>a.id===id?{...a,paid:!paid}:a));
  };

  if(loading)return <div style={{padding:"2rem",color:MUTED}}>Loading website ads…</div>;

  return <div>
    <h2 style={{color:NAVY,fontWeight:700,marginBottom:"1rem"}}>Website Ads</h2>
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:"1.5rem"}}>{[{l:"Small",p:60},{l:"Medium",p:150},{l:"Large",p:300}].map(t=><div key={t.l} style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:9,padding:"1rem",textAlign:"center"}}><div style={{fontWeight:600,color:NAVY}}>{t.l}</div><div style={{fontWeight:800,color:GOLD,fontSize:20,margin:"4px 0"}}>${t.p}<span style={{fontSize:12,color:MUTED,fontWeight:400}}>/mo</span></div><div style={{fontSize:11,color:MUTED}}>{ads.filter(a=>a.size===t.l).length} active</div></div>)}</div>
    <div style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:10,overflowX:"auto",marginBottom:"1rem"}}>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:13,minWidth:400}}>
        <thead><tr style={{background:NAVY,color:WHITE}}>{["Business","Size","Months","Monthly","Total","Status",""].map(h=><th key={h} style={{padding:"10px 12px",textAlign:["Monthly","Total"].includes(h)?"right":"left",fontWeight:600}}>{h}</th>)}</tr></thead>
        <tbody>{ads.length===0&&<tr><td colSpan={7} style={{padding:"2rem",textAlign:"center",color:MUTED}}>No website ads yet.</td></tr>}
        {ads.map((a,i)=><tr key={a.id} style={{background:i%2===0?LIGHT_BG:WHITE,borderBottom:`1px solid ${BORDER}`}}>
          <td style={{padding:"9px 12px",fontWeight:500,color:NAVY}}>{a.business}</td>
          <td style={{padding:"9px 12px",color:MUTED}}>{a.size}</td>
          <td style={{padding:"9px 12px",color:MUTED}}>{a.months}</td>
          <td style={{padding:"9px 12px",textAlign:"right",color:MUTED}}>${a.price}/mo</td>
          <td style={{padding:"9px 12px",textAlign:"right",fontWeight:700,color:NAVY}}>${a.price*a.months}</td>
          <td style={{padding:"9px 12px"}}>{a.paid?<Badge text="Paid" color="green"/>:<Badge text="Unpaid" color="orange"/>}</td>
          <td style={{padding:"9px 12px"}}><div style={{display:"flex",gap:4}}>
            <Btn small color={a.paid?"light":"green"} onClick={()=>togglePaid(a.id,a.paid)}>{a.paid?"↩":"✓ Pay"}</Btn>
            <Btn small color="red" onClick={()=>deleteAd(a.id)}>🗑</Btn>
          </div></td>
        </tr>)}</tbody>
      </table>
    </div>
    <Btn onClick={()=>setShowForm(true)}>+ Add Website Ad</Btn>
    {showForm&&<Modal title="Add Website Ad" onClose={()=>setShowForm(false)}>
      <Inp label="Business Name" value={f.business} onChange={v=>set("business",v)}/>
      <Sel label="Ad Size" value={f.size} onChange={v=>set("size",v)} options={[{value:"Small",label:"Small — $60/mo"},{value:"Medium",label:"Medium — $150/mo"},{value:"Large",label:"Large — $300/mo"}]}/>
      <Inp label="Number of Months" value={f.months} onChange={v=>set("months",v)} type="number"/>
      <div style={{background:LIGHT_BG,borderRadius:6,padding:"9px 12px",fontSize:13,marginBottom:10}}>Total: <strong>${(priceMap[f.size]||60)*Number(f.months||0)}</strong></div>
      <label style={{display:"flex",alignItems:"center",gap:7,fontSize:13,color:NAVY,cursor:"pointer",marginBottom:"1rem"}}><input type="checkbox" checked={f.paid} onChange={e=>set("paid",e.target.checked)}/> Paid</label>
      <div style={{display:"flex",gap:8}}><Btn full color="light" onClick={()=>setShowForm(false)}>Cancel</Btn><Btn full onClick={save}>Save</Btn></div>
    </Modal>}
  </div>;
}

function BookLibrary(){
  const [books,setBooks]=useState(INIT_BOOKS);
  const [sellModal,setSellModal]=useState(null);
  const [sale,setSale]=useState({buyer:"",email:"",price:"20",payment:"Cash"});
  const fileRef=useRef();
  return <div>
    <h2 style={{color:NAVY,fontWeight:700,marginBottom:"1rem"}}>Book Library</h2>
    <div style={{display:"grid",gap:12,marginBottom:"1rem"}}>{books.map(b=><div key={b.id} style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:10,padding:"1rem 1.25rem"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
        <div><div style={{fontWeight:700,color:NAVY,fontSize:15}}>📘 {b.name}</div><div style={{color:MUTED,fontSize:12,marginTop:2}}>{b.pages} pages · Uploaded {b.uploaded}{b.file&&<span style={{color:GREEN}}> · ✓ PDF ready</span>}</div></div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}><Btn small color="light">👁 View</Btn><Btn small onClick={()=>{setSale({buyer:"",email:"",price:"20",payment:"Cash"});setSellModal(b);}}>💰 Sell Digital</Btn><Btn small color="green" onClick={()=>alert("📧 Enter email to send PDF")}>📧 Email</Btn><Btn small color="red" onClick={()=>{if(window.confirm(`Delete ${b.name}?`))setBooks(prev=>prev.filter(x=>x.id!==b.id));}}>🗑</Btn></div>
      </div>
    </div>)}</div>
    <div style={{display:"flex",gap:8}}><Btn onClick={()=>fileRef.current.click()}>+ Upload Book PDF</Btn><input ref={fileRef} type="file" accept=".pdf" style={{display:"none"}} onChange={e=>{const f=e.target.files[0];if(!f)return;setBooks(p=>[{id:Date.now(),season:DEFAULT_SEASONS[0],name:f.name.replace(".pdf",""),pages:0,uploaded:new Date().toISOString().slice(0,10),file:f.name},...p]);}}/></div>
    {sellModal&&<Modal title="Sell Digital Book" onClose={()=>setSellModal(null)}>
      <div style={{background:LIGHT_BG,borderRadius:6,padding:"9px 12px",marginBottom:"1rem",fontSize:13,color:MUTED}}>📘 {sellModal.name}</div>
      <Inp label="Buyer Name" value={sale.buyer} onChange={v=>setSale(p=>({...p,buyer:v}))} placeholder="Walk-up customer"/>
      <Inp label="Email" value={sale.email} onChange={v=>setSale(p=>({...p,email:v}))} type="email"/>
      <Inp label="Sale Price ($)" value={sale.price} onChange={v=>setSale(p=>({...p,price:v}))} type="number"/>
      <Sel label="Payment" value={sale.payment} onChange={v=>setSale(p=>({...p,payment:v}))} options={["Cash","Square","PayPal","Venmo","Free / Comp"]}/>
      <div style={{display:"flex",gap:8,marginTop:"1rem"}}><Btn full color="light" onClick={()=>setSellModal(null)}>Cancel</Btn><Btn full color="green" onClick={()=>{alert(`✓ PDF sent · $${sale.price} via ${sale.payment}`);setSellModal(null);}}>📧 Complete Sale & Send PDF</Btn></div>
    </Modal>}
  </div>;
}

function EventSale({products}){
  const [eventName,setEventName]=useState("East West Tourney Sale");
  const [editingName,setEditingName]=useState(false);
  const [cart,setCart]=useState([]);
  const [selSize,setSelSize]=useState({});
  const [checkoutModal,setCheckoutModal]=useState(false);
  const [buyer,setBuyer]=useState({name:"",email:""});
  const [salesLog,setSalesLog]=useState([]);
  const total=cart.reduce((s,i)=>s+i.price,0);
  const addToCart=p=>{if(p.sizes&&p.sizes.length>0&&!selSize[p.id]){alert("Please select a size.");return;}setCart(prev=>[...prev,{id:Date.now(),name:p.name+(selSize[p.id]?" ("+selSize[p.id]+")":""),price:p.price}]);};
  const completeSale=method=>{setSalesLog(p=>[{id:Date.now(),event:eventName,items:cart.length,total,method,buyer:buyer.name||"Walk-up",time:new Date().toLocaleTimeString()},...p]);setCart([]);setBuyer({name:"",email:""});setCheckoutModal(false);alert(`✓ Sale complete! $${total} via ${method}`);};
  return <div>
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:"1.25rem",flexWrap:"wrap"}}>
      <h2 style={{color:NAVY,fontWeight:700,margin:0}}>Event Sale</h2>
      {editingName?<input value={eventName} onChange={e=>setEventName(e.target.value)} onBlur={()=>setEditingName(false)} autoFocus style={{border:`2px solid ${GOLD}`,borderRadius:6,padding:"6px 12px",fontSize:14,fontWeight:600,color:NAVY,outline:"none"}}/>:<div onClick={()=>setEditingName(true)} style={{background:GOLD+"22",border:`1px dashed ${GOLD}`,borderRadius:6,padding:"6px 14px",fontSize:14,fontWeight:600,color:NAVY,cursor:"pointer"}}>{eventName} ✏️</div>}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
      <div><div style={{fontWeight:600,color:NAVY,marginBottom:10,fontSize:14}}>Products</div>
        <div style={{display:"grid",gap:10}}>{(products||INIT_PRODS).map(p=><div key={p.id} style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:9,padding:"12px 14px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:p.sizes&&p.sizes.length>0?8:0}}><div><div style={{fontWeight:600,color:NAVY,fontSize:13}}>{p.name}</div><div style={{fontWeight:700,color:GOLD,fontSize:15}}>${p.price}</div></div><Btn small onClick={()=>addToCart(p)}>+ Add</Btn></div>
          {p.sizes&&p.sizes.length>0&&<div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{p.sizes.map(sz=><button key={sz} onClick={()=>setSelSize(prev=>({...prev,[p.id]:sz}))} style={{background:selSize[p.id]===sz?NAVY:LIGHT_BG,color:selSize[p.id]===sz?WHITE:NAVY,border:`1px solid ${selSize[p.id]===sz?NAVY:BORDER}`,borderRadius:5,padding:"3px 10px",fontSize:12,cursor:"pointer",fontWeight:selSize[p.id]===sz?600:400}}>{sz}</button>)}</div>}
        </div>)}</div>
      </div>
      <div><div style={{fontWeight:600,color:NAVY,marginBottom:10,fontSize:14}}>Cart</div>
        <div style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:9,padding:"1rem",minHeight:140}}>
          {cart.length===0&&<div style={{color:MUTED,fontSize:13,textAlign:"center",paddingTop:"1.5rem"}}>No items yet.</div>}
          {cart.map(item=><div key={item.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:`1px solid ${BORDER}`,fontSize:13}}><div style={{color:NAVY}}>{item.name}</div><div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontWeight:700,color:NAVY}}>${item.price}</span><button onClick={()=>setCart(prev=>prev.filter(i=>i.id!==item.id))} style={{background:"none",border:"none",color:RED,cursor:"pointer",fontSize:16,lineHeight:1}}>✕</button></div></div>)}
          {cart.length>0&&<div><div style={{display:"flex",justifyContent:"space-between",padding:"10px 0 0",fontWeight:700,fontSize:16,color:NAVY}}><span>Total</span><span>${total}</span></div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:10}}><Btn color="green" onClick={()=>setCheckoutModal("Cash")}>💵 Cash</Btn><Btn onClick={()=>setCheckoutModal("Square")}>💳 Square</Btn><Btn color="light" onClick={()=>setCheckoutModal("PayPal")}>🅿 PayPal</Btn><Btn color="light" onClick={()=>setCheckoutModal("Venmo")}>💸 Venmo</Btn><Btn color="red" onClick={()=>setCart([])}>🗑 Clear</Btn></div>
          </div>}
        </div>
        {salesLog.length>0&&<div style={{marginTop:12}}><div style={{fontWeight:600,color:NAVY,fontSize:13,marginBottom:8}}>Today's Sales</div>{salesLog.map(s=><div key={s.id} style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:7,padding:"8px 12px",marginBottom:6,fontSize:12}}><div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontWeight:500,color:NAVY}}>{s.buyer}</span><span style={{fontWeight:700,color:GREEN}}>${s.total}</span></div><div style={{color:MUTED}}>{s.items} item{s.items!==1?"s":""} · {s.method} · {s.time}</div></div>)}</div>}
      </div>
    </div>
    {checkoutModal&&<Modal title={`Checkout — ${checkoutModal}`} onClose={()=>setCheckoutModal(false)}>
      <div style={{background:LIGHT_BG,borderRadius:6,padding:"12px",marginBottom:"1rem",textAlign:"center"}}><div style={{color:MUTED,fontSize:12}}>Total</div><div style={{fontWeight:800,fontSize:26,color:NAVY}}>${total}</div><div style={{color:MUTED,fontSize:12}}>{eventName} · {cart.length} item{cart.length!==1?"s":""}</div></div>
      <Inp label="Buyer Name (optional)" value={buyer.name} onChange={v=>setBuyer(p=>({...p,name:v}))} placeholder="Walk-up customer"/>
      <Inp label="Email for receipt (optional)" value={buyer.email} onChange={v=>setBuyer(p=>({...p,email:v}))} type="email"/>
      <div style={{display:"flex",gap:8,marginTop:"1rem"}}><Btn full color="light" onClick={()=>setCheckoutModal(false)}>Cancel</Btn><Btn full color="green" onClick={()=>completeSale(checkoutModal)}>✓ Complete Sale</Btn></div>
    </Modal>}
  </div>;
}

function Mileage({user}){
  const [logs,setLogs]=useState([]);
  const [filter,setFilter]=useState(user.role==="salesperson"?user.name:"All");
  const [showForm,setShowForm]=useState(false);
  const [f,setF]=useState({user:user.name,date:new Date().toISOString().slice(0,10),miles:"",note:""});
  const set=(k,v)=>setF(p=>({...p,[k]:v}));
  useEffect(()=>{
    const load=async()=>{
      const {data}=await supabase.from('mileage').select('*').order('date',{ascending:false});
      if(data)setLogs(data.map(r=>({id:r.id,user:r.user_name,date:r.date,miles:r.miles,note:r.note})));
    };
    load();
  },[]);
  const filtered=filter==="All"?logs:logs.filter(l=>l.user===filter);
  const total=filtered.reduce((s,l)=>s+Number(l.miles),0);
  return <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem",flexWrap:"wrap",gap:8}}>
      <h2 style={{color:NAVY,fontWeight:700,margin:0}}>Mileage Tracker</h2>
      <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
        {user.role==="owner"&&<select value={filter} onChange={e=>setFilter(e.target.value)} style={{border:`1px solid ${BORDER}`,borderRadius:6,padding:"6px 10px",fontSize:13,color:NAVY,background:WHITE}}><option>All</option>{USERS.map(u=><option key={u.id}>{u.name}</option>)}</select>}
        <div style={{background:NAVY,color:GOLD_LIGHT,borderRadius:7,padding:"7px 14px",fontWeight:700,fontSize:13}}>{total} miles</div>
        <Btn onClick={()=>setShowForm(true)}>+ Log Trip</Btn>
      </div>
    </div>
    <div style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:10,overflowX:"auto"}}>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:13,minWidth:380}}>
        <thead><tr style={{background:NAVY,color:WHITE}}>{["Date","Person","Miles","Purpose",""].map(h=><th key={h} style={{padding:"10px 12px",textAlign:h==="Miles"?"right":"left",fontWeight:600}}>{h}</th>)}</tr></thead>
        <tbody>{filtered.map((l,i)=><tr key={l.id} style={{background:i%2===0?LIGHT_BG:WHITE,borderBottom:`1px solid ${BORDER}`}}>
          <td style={{padding:"9px 12px",color:MUTED}}>{l.date}</td>
          <td style={{padding:"9px 12px",fontWeight:500,color:NAVY}}>{l.user}</td>
          <td style={{padding:"9px 12px",textAlign:"right",fontWeight:700,color:NAVY}}>{l.miles}</td>
          <td style={{padding:"9px 12px",color:MUTED}}>{l.note}</td>
          <td style={{padding:"9px 12px"}}><Btn small color="red" onClick={async()=>{if(window.confirm("Delete this trip log?")){await supabase.from('mileage').delete().eq('id',l.id);setLogs(prev=>prev.filter(x=>x.id!==l.id));}}}>🗑</Btn></td>
        </tr>)}</tbody>
      </table>
    </div>
    {showForm&&<Modal title="Log Trip" onClose={()=>setShowForm(false)}>
      {user.role==="owner"&&<Sel label="Person" value={f.user} onChange={v=>set("user",v)} options={USERS.map(u=>u.name)}/>}
      <DatePicker label="Date" value={f.date} onChange={v=>set("date",v)}/>
      <Inp label="Miles" value={f.miles} onChange={v=>set("miles",v)} type="number" placeholder="0"/>
      <Inp label="Destination / Purpose" value={f.note} onChange={v=>set("note",v)} placeholder="e.g. Bismarck Hardware visit"/>
      <div style={{display:"flex",gap:8,marginTop:"1rem"}}>
        <Btn full color="light" onClick={()=>setShowForm(false)}>Cancel</Btn>
        <Btn full onClick={async()=>{
          if(!f.miles)return;
          const {data}=await supabase.from('mileage').insert({user_name:f.user,date:f.date,miles:Number(f.miles),note:f.note}).select();
          if(data)setLogs(p=>[{id:data[0].id,user:f.user,date:f.date,miles:Number(f.miles),note:f.note},...p]);
          setShowForm(false);
        }}>Save Trip</Btn>
      </div>
    </Modal>}
  </div>;
}

function Reports({advertisers,salespeople,seasons,setSeasons}){
  const [season,setSeason]=useState(seasons[0]||getCurrentSeason());
  const ads=advertisers.filter(a=>a.season===season);
  const total=ads.reduce((s,a)=>s+a.totalAmount,0);
  const paid=ads.filter(a=>a.paid).reduce((s,a)=>s+a.totalAmount,0);
  const bySP={};
  salespeople.forEach(sp=>{const spAds=ads.filter(a=>a.salesperson===sp.name);const spS=spAds.reduce((s,a)=>s+a.totalAmount,0);const spP=spAds.filter(a=>a.paid).reduce((s,a)=>s+a.totalAmount,0);bySP[sp.name]={sales:spS,paid:spP,due:spS*sp.commission/100,payable:spP*sp.commission/100,rate:sp.commission,count:spAds.length};});
  const bySize={};
  ads.forEach(a=>a.lineItems.forEach(li=>{if(!bySize[li.adSize])bySize[li.adSize]={count:0,total:0};bySize[li.adSize].count++;bySize[li.adSize].total+=li.amount*(li.qty||1);}));
  return <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem",flexWrap:"wrap",gap:8}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",width:"100%",flexWrap:"wrap",gap:8}}>
        <h2 style={{color:NAVY,fontWeight:700,margin:0}}>Reports</h2>
        <div style={{display:"flex",gap:8}}>
          <SeasonPicker value={season} onChange={setSeason} seasons={seasons} setSeasons={setSeasons}/>
          <Btn color="gold" onClick={()=>window.print()}>🖨️ Print / Save PDF</Btn>
        </div>
      </div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:12,marginBottom:"1.5rem"}}>
      <StatCard label="Total Sales" value={`$${total.toLocaleString()}`} color={NAVY}/>
      <StatCard label="Collected" value={`$${paid.toLocaleString()}`} color={GREEN}/>
      <StatCard label="Outstanding" value={`$${(total-paid).toLocaleString()}`} color={GOLD}/>
      <StatCard label="Advertisers" value={ads.length} color="#7c3aed"/>
      <StatCard label="Overdue" value={ads.filter(a=>a.overdue).length} color={RED}/>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
      <div style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:10,padding:"1rem"}}>
        <div style={{fontWeight:600,color:NAVY,marginBottom:10,fontSize:14}}>Sales by Representative</div>
        {Object.entries(bySP).map(([sp,d])=><div key={sp} style={{padding:"8px 0",borderBottom:`1px solid ${BORDER}`}}><div style={{display:"flex",justifyContent:"space-between",fontSize:13}}><div style={{fontWeight:500,color:NAVY}}>{sp}</div><div style={{fontWeight:700,color:NAVY}}>${d.sales.toLocaleString()}</div></div><div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:MUTED,marginTop:2}}><span>{d.count} advertiser{d.count!==1?"s":""} · {d.rate}% comm</span><span style={{color:GREEN}}>Paid: ${d.paid.toLocaleString()}</span></div></div>)}
      </div>
      <div style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:10,padding:"1rem"}}>
        <div style={{fontWeight:600,color:NAVY,marginBottom:10,fontSize:14}}>Sales by Ad Size</div>
        {Object.entries(bySize).sort((a,b)=>b[1].total-a[1].total).map(([size,d])=><div key={size} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:`1px solid ${BORDER}`,fontSize:13}}><div style={{color:NAVY,fontSize:12}}>{size}</div><div style={{textAlign:"right"}}><div style={{fontWeight:700,color:NAVY}}>${d.total.toLocaleString()}</div><div style={{color:MUTED,fontSize:11}}>{d.count} sold</div></div></div>)}
      </div>
    </div>
    <div style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:10,padding:"1rem",marginBottom:16}}>
      <div style={{fontWeight:600,color:NAVY,marginBottom:10,fontSize:14}}>Commission Report — {season}</div>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
        <thead><tr style={{background:NAVY,color:WHITE}}>{["Rep","Rate","Total Sales","Comm. Due","Comm. Payable"].map(h=><th key={h} style={{padding:"9px 12px",textAlign:h==="Rep"?"left":"right",fontWeight:600}}>{h}</th>)}</tr></thead>
        <tbody>{Object.entries(bySP).map(([sp,d],i)=><tr key={sp} style={{background:i%2===0?LIGHT_BG:WHITE,borderBottom:`1px solid ${BORDER}`}}><td style={{padding:"9px 12px",fontWeight:500,color:NAVY}}>{sp}</td><td style={{padding:"9px 12px",textAlign:"right",color:MUTED}}>{d.rate}%</td><td style={{padding:"9px 12px",textAlign:"right",fontWeight:600,color:NAVY}}>${d.sales.toLocaleString()}</td><td style={{padding:"9px 12px",textAlign:"right",color:GOLD,fontWeight:600}}>${d.due.toFixed(2)}</td><td style={{padding:"9px 12px",textAlign:"right",color:GREEN,fontWeight:600}}>${d.payable.toFixed(2)}</td></tr>)}</tbody>
      </table>
      <div style={{fontSize:11,color:MUTED,marginTop:8}}>Comm. Due = all sales · Comm. Payable = paid invoices only</div>
    </div>
    <div style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:10,padding:"1rem"}}>
      <div style={{fontWeight:600,color:NAVY,marginBottom:10,fontSize:14}}>Overdue Accounts</div>
      {ads.filter(a=>a.overdue).length===0&&<div style={{color:MUTED,fontSize:13}}>No overdue accounts.</div>}
      {ads.filter(a=>a.overdue).map(a=><div key={a.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${BORDER}`,fontSize:13}}><div><div style={{fontWeight:500,color:NAVY}}>{a.business}</div><div style={{color:MUTED,fontSize:11}}>{a.salesperson} · {a.dateSale}</div></div><div style={{display:"flex",alignItems:"center",gap:10}}><div style={{fontWeight:700,color:RED}}>${a.totalAmount.toLocaleString()}</div><Btn small onClick={()=>alert("📧 Reminder sent to "+a.email)}>📧 Remind</Btn></div></div>)}
    </div>
  </div>;
}

// ── SETTINGS (Supabase connected) ──────────────────────────────────────────
function Settings({salespeople,setSalespeople,settings,setSettings}){
  const [lsp,setLsp]=useState(salespeople.map(s=>({...s,rate:s.commission})));
  const [days,setDays]=useState(settings?.overdueDays||15);
  const [brand,setBrand]=useState(settings?.brand||"Dakota Grappler");
  const [footer,setFooter]=useState(settings?.footer||"Thank you for supporting Dakota wrestling!");
  const [paypalUsername,setPaypalUsername]=useState(settings?.paypalUsername||"dakotagrappler");
  const [venmoUsername,setVenmoUsername]=useState(settings?.venmoUsername||"dakotagrappler");
  const [saved,setSaved]=useState(false);

  const showSaved=()=>{setSaved(true);setTimeout(()=>setSaved(false),3000);};

  const saveCommissions=async()=>{
    setSalespeople(lsp.map(s=>({...s,commission:s.rate})));
    await supabase.from('settings').upsert({key:'commissions',value:lsp.map(s=>({name:s.name,commission:s.rate}))},{onConflict:'key'});
    showSaved();
  };

  const saveBranding=async()=>{
    const newSettings={...settings,brand,footer,paypalUsername,venmoUsername};
    await supabase.from('settings').upsert({key:'branding',value:{brand,footer,paypalUsername,venmoUsername,squareLink:settings?.squareLink||"https://square.link/u/9eXw7aSp"}},{onConflict:'key'});
    setSettings(newSettings);
    showSaved();
  };

  const saveOverdue=async()=>{
    const newSettings={...settings,overdueDays:Number(days)};
    await supabase.from('settings').upsert({key:'overdue',value:{days:Number(days)}},{onConflict:'key'});
    setSettings(newSettings);
    showSaved();
  };

  return <div>
    <h2 style={{color:NAVY,fontWeight:700,marginBottom:"1rem"}}>Settings</h2>
    {saved&&<InfoBox color="green">✓ Settings saved successfully.</InfoBox>}
    <div style={{display:"grid",gap:16}}>
      <div style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:10,padding:"1.25rem"}}>
        <div style={{fontWeight:600,color:NAVY,marginBottom:"1rem",fontSize:15}}>Commission Rates</div>
        <InfoBox color="yellow">🔒 Owner only</InfoBox>
        {lsp.map((s,i)=><div key={s.id} style={{display:"flex",alignItems:"center",gap:12,marginBottom:10,fontSize:13}}><div style={{flex:1,fontWeight:500,color:NAVY}}>{s.name}</div><input type="number" min="0" max="100" value={s.rate} onChange={e=>setLsp(p=>p.map((x,j)=>j===i?{...x,rate:Number(e.target.value)}:x))} style={{width:65,border:`1px solid ${BORDER}`,borderRadius:6,padding:"6px 10px",textAlign:"center",fontSize:13}}/><div style={{color:MUTED}}>%</div></div>)}
        <Btn small onClick={saveCommissions}>Save Commission Rates</Btn>
      </div>

      <div style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:10,padding:"1.25rem"}}>
        <div style={{fontWeight:600,color:NAVY,marginBottom:"1rem",fontSize:15}}>Invoice Branding</div>
        <Inp label="Business Name on Invoices" value={brand} onChange={setBrand}/>
        <Inp label="Invoice Footer Message" value={footer} onChange={setFooter}/>
        <Btn small onClick={saveBranding}>Save Branding</Btn>
      </div>

      <div style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:10,padding:"1.25rem"}}>
        <div style={{fontWeight:600,color:NAVY,marginBottom:"1rem",fontSize:15}}>Payment Links</div>
        <InfoBox color="blue">These usernames appear on invoices so advertisers can pay online.</InfoBox>
        <Inp label="PayPal.me username (e.g. dakotagrappler)" value={paypalUsername} onChange={setPaypalUsername}/>
        <Inp label="Venmo username (e.g. dakotagrappler)" value={venmoUsername} onChange={setVenmoUsername}/>
        <div style={{fontSize:12,color:MUTED,marginBottom:10}}>
          PayPal link: paypal.com/paypalme/<strong>{paypalUsername}</strong><br/>
          Venmo link: venmo.com/<strong>{venmoUsername}</strong>
        </div>
        <Inp label="Square payment link" value={settings?.squareLink||""} onChange={v=>setSettings(p=>({...p,squareLink:v}))}/>
        <Btn small onClick={saveBranding}>Save Payment Links</Btn>
      </div>

      <div style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:10,padding:"1.25rem"}}>
        <div style={{fontWeight:600,color:NAVY,marginBottom:"1rem",fontSize:15}}>Overdue & Reminders</div>
        <div style={{display:"flex",alignItems:"center",gap:10,fontSize:13,marginBottom:12}}><span style={{color:MUTED}}>Flag overdue after</span><input type="number" value={days} onChange={e=>setDays(e.target.value)} style={{width:60,border:`1px solid ${BORDER}`,borderRadius:6,padding:"6px 10px",textAlign:"center",fontSize:13}}/><span style={{color:MUTED}}>days</span></div>
        <label style={{display:"flex",alignItems:"center",gap:8,fontSize:13,color:NAVY,cursor:"pointer",marginBottom:12}}><input type="checkbox" defaultChecked/> Auto-send email reminders to overdue accounts</label>
        <Btn small onClick={saveOverdue}>Save Settings</Btn>
      </div>

      <div style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:10,padding:"1.25rem"}}>
        <div style={{fontWeight:600,color:NAVY,marginBottom:"1rem",fontSize:15}}>User Logins (up to 10)</div>
        {USERS.map(u=><div key={u.id} style={{display:"flex",alignItems:"center",gap:10,background:LIGHT_BG,borderRadius:6,padding:"8px 12px",marginBottom:8,fontSize:13}}><div style={{flex:1,fontWeight:500,color:NAVY}}>{u.name}</div><Badge text={u.role} color={u.role==="owner"?"navy":"blue"}/><Btn small color="light">Edit</Btn></div>)}
        <Btn small>+ Add User</Btn>
      </div>
    </div>
  </div>;
}

// ── APP ROOT ───────────────────────────────────────────────────────────────
export default function App(){
  const [currentUser,setCurrentUser]=useState(null);
  const [active,setActive]=useState("dashboard");
  const [advertisers,setAdvertisers]=useState([]);
  const [salespeople,setSalespeople]=useState(INIT_SP);
  const [seasons,setSeasons]=useState(DEFAULT_SEASONS);
  const [products,setProducts]=useState(INIT_PRODS);
  const [settings,setSettings]=useState({brand:"Dakota Grappler",footer:"Thank you for supporting Dakota wrestling!",paypalUsername:"dakotagrappler",venmoUsername:"dakotagrappler",squareLink:"https://square.link/u/9eXw7aSp",overdueDays:15});

  // Load advertisers
  useEffect(()=>{
    if(!currentUser)return;
    const load=async()=>{
      const {data,error}=await supabase.from('advertiser_seasons').select(`*,advertiser:advertisers(*),line_items(*)`);
      if(error){console.error(error);return;}
      if(data){
        const mapped=data.map(r=>({
          id:r.id,advertiser_id:r.advertiser_id,
          business:r.advertiser?.business||"",contact:r.advertiser?.contact||"",
          email:r.advertiser?.email||"",phone:r.advertiser?.phone||"",
          address:r.advertiser?.address||"",city:r.advertiser?.city||"",
          state:r.advertiser?.state||"ND",zip:r.advertiser?.zip||"",
          season:r.season||"",salesperson:r.salesperson||"",
          lineItems:(r.line_items||[]).map(li=>({id:li.id,adSize:li.ad_size,adType:li.ad_type,basePrice:li.base_price,discount:li.discount,discountType:li.discount_type,amount:li.amount,size:li.size||"",qty:li.qty||1})),
          totalAmount:r.total_amount||0,paid:r.paid||false,
          dateSale:r.date_sale||"",datePaid:r.date_paid||"",
          payMethod:r.pay_method||"",checkNum:r.check_num||"",
          newAd:r.new_ad||false,newAdvertiser:r.new_advertiser||false,
          sameAd:r.same_ad||false,overdue:r.overdue||false,
          notes:r.advertiser?.notes||"",signature:r.signature||null,
          adPhoto:r.advertiser?.ad_photo||null,lastYearPhoto:r.advertiser?.last_year_photo||null,
          history:[],
        }));
        setAdvertisers(mapped);
      }
    };
    load();
  },[currentUser]);

  // Load settings
  useEffect(()=>{
    if(!currentUser)return;
    const load=async()=>{
      const {data}=await supabase.from('settings').select('*');
      if(data){
        const branding=data.find(r=>r.key==='branding');
        const commissions=data.find(r=>r.key==='commissions');
        const overdue=data.find(r=>r.key==='overdue');
        if(branding?.value)setSettings(p=>({...p,...branding.value}));
        if(commissions?.value){
          setSalespeople(INIT_SP.map(sp=>{const found=commissions.value.find(c=>c.name===sp.name);return found?{...sp,commission:found.commission}:sp;}));
        }
        if(overdue?.value)setSettings(p=>({...p,overdueDays:overdue.value.days}));
      }
    };
    load();
  },[currentUser]);

  if(!currentUser)return <Login onLogin={u=>{setCurrentUser(u);setActive("dashboard");}}/>;

  const pages={
    dashboard:<Dashboard advertisers={advertisers} user={currentUser} seasons={seasons} setSeasons={setSeasons}/>,
    advertisers:<Advertisers advertisers={advertisers} setAdvertisers={setAdvertisers} salespeople={salespeople} user={currentUser} seasons={seasons} setSeasons={setSeasons} settings={settings}/>,
    invoices:<Invoices advertisers={advertisers} setAdvertisers={setAdvertisers} seasons={seasons} setSeasons={setSeasons} settings={settings}/>,
    products:<Products user={currentUser}/>,
    rankings:<Rankings/>,
    website:<WebsiteAds/>,
    books:<BookLibrary/>,
    event:<EventSale products={products}/>,
    mileage:<Mileage user={currentUser}/>,
    reports:<Reports advertisers={advertisers} salespeople={salespeople} seasons={seasons} setSeasons={setSeasons}/>,
    settings:<Settings salespeople={salespeople} setSalespeople={setSalespeople} settings={settings} setSettings={setSettings}/>,
  };

  return <div style={{display:"flex",minHeight:"100vh",fontFamily:"system-ui,-apple-system,sans-serif",background:LIGHT_BG}}>
    <Sidebar active={active} setActive={setActive} user={currentUser} onLogout={()=>setCurrentUser(null)}/>
    <div style={{flex:1,padding:"1.75rem",overflowY:"auto",minWidth:0}}>{pages[active]}</div>
  </div>;
}