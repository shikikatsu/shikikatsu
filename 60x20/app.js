'use strict';
const settings=window.HEKIGA_CONFIG || {};
const COLS=settings.cols || 30, ROWS=settings.rows || 10, WHITE='#ffffff';
const colors=settings.colors || [['白','#ffffff'],['黒','#252b32'],['灰色','#8b949e'],['茶色','#885334'],['赤','#e84444'],['オレンジ','#f38b32'],['黄色','#ffdc45'],['クリーム','#fff0a6'],['黄緑','#a7d948'],['緑','#3da55b'],['深緑','#22755c'],['水色','#7dd9ed'],['空色','#42a5e5'],['青','#3669d6'],['紺','#34417e'],['紫','#8a60c7'],['うす紫','#c7abea'],['ピンク','#ef8db6'],['もも色','#ffd1bd'],['ベージュ','#d8ba8d']];
let pixels=Array(COLS*ROWS).fill(WHITE), selected=colors[settings.initialColor ?? 4], erasing=false, history=[], future=[], drag=null;
const $=id=>document.getElementById(id), cells=[];
$('grid').style.setProperty('--rows',ROWS);
$('grid').style.setProperty('--cols',COLS);
for(let y=0;y<ROWS;y++){
 const row=document.createElement('div');row.setAttribute('role','row');row.setAttribute('aria-rowindex',y+1);
 for(let x=0;x<COLS;x++){
  const cell=document.createElement('div'),i=y*COLS+x;
  cell.setAttribute('role','gridcell');cell.setAttribute('aria-colindex',x+1);cell.dataset.index=i;cell.tabIndex=i===0?0:-1;
  row.append(cell);cells.push(cell);
 }
 $('grid').append(row);
}
colors.forEach(([name,color])=>{
 const b=document.createElement('button');b.style.background=color;b.style.setProperty('--check',(parseInt(color.slice(1,3),16)*299+parseInt(color.slice(3,5),16)*587+parseInt(color.slice(5,7),16)*114)/1000<145?'#fff':'#223b34');b.title=name;b.setAttribute('aria-label',name);b.dataset.color=color;
 b.onclick=()=>{selected=[name,color];erasing=false;updateMode();};$('palette').append(b);
});
function updateMode(){
 $('palette').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',!erasing&&b.dataset.color===selected[1]));
 $('eraser').setAttribute('aria-pressed',erasing);
 $('mode').replaceChildren();const dot=document.createElement('span');dot.className='swatch-dot';dot.style.background=erasing?WHITE:selected[1];$('mode').append(dot,document.createTextNode(erasing?'けしゴムでけす':selected[0]+'でぬる'));
}
function render(){
 pixels.forEach((color,i)=>{cells[i].style.backgroundColor=color;cells[i].classList.remove('preview');cells[i].setAttribute('aria-label',`${Math.floor(i/COLS)+1}行 ${i%COLS+1}列 ${colors.find(c=>c[1]===color)?.[0]||color}`);});
 $('undo').disabled=!history.length;$('redo').disabled=!future.length;
}
function indices(a,b){const x1=Math.min(a%COLS,b%COLS),x2=Math.max(a%COLS,b%COLS),y1=Math.min(Math.floor(a/COLS),Math.floor(b/COLS)),y2=Math.max(Math.floor(a/COLS),Math.floor(b/COLS)),out=[];for(let y=y1;y<=y2;y++)for(let x=x1;x<=x2;x++)out.push(y*COLS+x);return out;}
function commit(next){if(next.every((v,i)=>v===pixels[i]))return;history.push(pixels.slice());future=[];pixels=next;render();}
function preview(){render();indices(drag.start,drag.end).forEach(i=>{cells[i].style.backgroundColor=drag.color;cells[i].classList.add('preview');});}
function hit(e){const r=$('grid').getBoundingClientRect();const x=Math.max(0,Math.min(COLS-1,Math.floor((e.clientX-r.left)/r.width*COLS)));const y=Math.max(0,Math.min(ROWS-1,Math.floor((e.clientY-r.top)/r.height*ROWS)));return y*COLS+x;}
$('grid').addEventListener('pointerdown',e=>{if(e.button!==0||drag)return;e.preventDefault();drag={id:e.pointerId,start:hit(e),end:hit(e),color:erasing?WHITE:selected[1]};$('grid').setPointerCapture(e.pointerId);preview();});
$('grid').addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;e.preventDefault();drag.end=hit(e);preview();});
$('grid').addEventListener('pointerup',e=>{if(!drag||drag.id!==e.pointerId)return;drag.end=hit(e);const next=pixels.slice();indices(drag.start,drag.end).forEach(i=>next[i]=drag.color);drag=null;commit(next);render();if($('grid').hasPointerCapture(e.pointerId))$('grid').releasePointerCapture(e.pointerId);});
function cancel(){if(drag){drag=null;render();}}
$('grid').addEventListener('pointercancel',cancel);$('grid').addEventListener('lostpointercapture',cancel);
document.addEventListener('keydown',e=>{if(e.key==='Escape')cancel();});
$('grid').addEventListener('dragstart',e=>e.preventDefault());
$('grid').addEventListener('keydown',e=>{const i=Number(e.target.dataset.index);if(!Number.isInteger(i))return;const offsets={ArrowLeft:-1,ArrowRight:1,ArrowUp:-COLS,ArrowDown:COLS};if(e.key in offsets){e.preventDefault();const n=Math.max(0,Math.min(pixels.length-1,i+offsets[e.key]));cells[i].tabIndex=-1;cells[n].tabIndex=0;cells[n].focus();}else if(e.key===' '||e.key==='Enter'){e.preventDefault();const next=pixels.slice();next[i]=erasing?WHITE:selected[1];commit(next);}});
$('eraser').onclick=()=>{erasing=true;updateMode();};
$('undo').onclick=()=>{if(!history.length)return;future.push(pixels.slice());pixels=history.pop();render();};
$('redo').onclick=()=>{if(!future.length)return;history.push(pixels.slice());pixels=future.pop();render();};
$('clear').onclick=()=>$('clear-dialog').showModal();$('do-clear').onclick=()=>{commit(Array(COLS*ROWS).fill(WHITE));$('clear-dialog').close();};
function artwork(lines){
 const canvas=document.createElement('canvas');canvas.width=3000;canvas.height=1000;const ctx=canvas.getContext('2d'),cellWidth=canvas.width/COLS,cellHeight=canvas.height/ROWS;ctx.fillStyle=WHITE;ctx.fillRect(0,0,3000,1000);
 pixels.forEach((color,i)=>{ctx.fillStyle=color;ctx.fillRect(i%COLS*cellWidth,Math.floor(i/COLS)*cellHeight,cellWidth,cellHeight);});
 if(lines){ctx.strokeStyle='#65756d';ctx.lineWidth=2;ctx.beginPath();for(let x=1;x<COLS;x++){ctx.moveTo(x*cellWidth,0);ctx.lineTo(x*cellWidth,1000);}for(let y=1;y<ROWS;y++){ctx.moveTo(0,y*cellHeight);ctx.lineTo(3000,y*cellHeight);}ctx.stroke();}
 ctx.strokeStyle='#273e34';ctx.lineWidth=4;ctx.strokeRect(2,2,2996,996);return canvas;
}
$('save').onclick=()=>$('save-dialog').showModal();
$('download').onclick=()=>{const lines=document.querySelector('input[name=lines]:checked').value==='yes';artwork(lines).toBlob(blob=>{if(!blob){$('announcement').textContent='ほぞんできませんでした。もういちどためしてね。';return;}const url=URL.createObjectURL(blob),a=document.createElement('a');const now=new Date(),date=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;a.href=url;a.download=`へきがの下絵${settings.fileLabel || ''}_${date}_${lines?'方眼あり':'方眼なし'}.jpg`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);$('save-dialog').close();$('announcement').textContent='画像をほぞんしました。';},'image/jpeg',0.96);};
function preparePrint(){$('print-image').src=artwork(true).toDataURL('image/png');}
window.addEventListener('beforeprint',preparePrint);
$('print').onclick=()=>$('print-dialog').showModal();$('do-print').onclick=async()=>{preparePrint();await $('print-image').decode();$('print-dialog').close();window.print();};
updateMode();render();
