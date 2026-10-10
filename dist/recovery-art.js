// Scenery is derived from the original save seed; it never consumes game RNG.
const destinations=['mountain','sea','city','bed'];
const rect=(x,y,w,h,c,extra='')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"${extra}/>`;
const path=(d,c,extra='')=>`<path d="${d}" fill="${c}"${extra}/>`;
const placed=(x,y,content,cls='')=>`<g transform="translate(${x} ${y})"><g${cls?` class="${cls}"`:''}>${content}</g></g>`;
const cloud=(x,y,scale=1)=>`<g transform="translate(${x} ${y}) scale(${scale})"><g class="recovery-cloud-drift">${path('M0 12h8V6h12V0h18v6h12v6h10v8H0z','#fff7e7')}${rect(6,20,48,3,'#d9e7e3')}</g></g>`;
const birds=(x,y)=>placed(x,y,'<path d="M0 4h4V0h4v4h4m12 4h4V4h4v4h4" fill="none" stroke="#708da0" stroke-width="2"/>','recovery-bird-float');
const pine=(x,y,size=1,palette=['#6b8c70','#497867','#b4c797'])=>`<g transform="translate(${x} ${y}) scale(${size})">${rect(-3,-9,6,12,'#786f5c')}<g class="recovery-leaf-sway">${path('M-20-11h7v-6h-4v-5h8v-6h-4v-5h8v-6h-4v-5h6v-8h6v8h6v5H5v6h8v5H9v6h8v5h-4v6h7v7h-40z',palette[1])}${path('M-14-11v-4h9v-6H1v-7h3v-7h2v-9h2v12h3v6h5v6h-3v9z',palette[0])}${rect(-5,-35,5,2,palette[2])}${rect(-10,-22,7,2,palette[2])}${rect(3,-12,7,2,palette[2])}</g></g>`;
const grass=(x,y,c='#749079')=>placed(x,y,`<path d="M0 7V2h2v5h3V0h2v7h3V3h2v7H0z" fill="${c}"/>`,'recovery-grass-sway');
const flowers=(x,y)=>placed(x,y,rect(1,3,2,8,'#7c9273')+rect(0,0,4,4,'#edd5c9')+rect(7,7,2,6,'#7c9273')+rect(6,4,4,4,'#f0df9f'));

export function recoveryDestination(state,result={},index=0){
 if(destinations.includes(result.destination))return result.destination;
 return destinations[(Math.imul((state.creationSeed??state.seed)^(state.month*31+index),2654435761)>>>0)%4];
}
export function recoveryVariant(state,index=0){return (Math.imul((state.creationSeed??state.seed)^(state.month*127+index*17),2246822519)>>>0)%3;}

function mountain(variant){
 const p=[{sky:'#d5e9e6',far:'#b8cec6',mid:'#90af9e',near:'#709589',grass:'#a0b899'}, {sky:'#e7e6d8',far:'#c6cbb9',mid:'#a5b3a0',near:'#849c87',grass:'#b9bf9c'}, {sky:'#dce3ef',far:'#bac6d8',mid:'#97afba',near:'#758e9f',grass:'#a4b3a2'}][variant];
 let a=rect(0,0,600,255,p.sky)+rect(0,83,600,20,'#e6ede2')+rect(0,103,600,20,'#dce8dc');
 a+=placed(496,23,rect(0,6,28,18,'#f0ddac')+rect(5,0,18,30,'#f0ddac'),'recovery-sun-glow')+cloud(37,35,.9)+cloud(245,18,.65)+birds(370,48);
 a+=path('M0 125h18v-9h20v-11h18V91h22V77h18V61h20v16h18v11h20v12h20v12h22v13h20v-8h20v-12h20V91h20V80h20V66h18V54h20v16h18v13h18v14h20v14h20v10h22v-7h18v-12h20V88h18V75h20V61h18v-9h18v16h20v14h16v13h20v12h20v12h18v136H0z',p.far);
 a+=path('M0 166h20v-10h22v-9h24v-14h22v-10h20v-11h22v11h20v12h24v12h24v12h30v-9h24v-12h22v-14h24v-10h20v-11h22v12h18v12h22v11h24v13h20v12h26v-9h24v-11h22v-14h22v-9h22v13h20v13h22v9h22v12h16v89H0z',p.mid);
 a+=path('M0 191h26v-7h28v-8h32v-8h30v7h32v9h30v7h34v7h30v7h28v-9h28v-6h30v-6h30v-8h32v6h30v7h26v7h30v-7h28v-10h28v-8h30v7h28v6h20v76H0z',p.near);
 for(let i=0;i<13;i++)a+=pine(20+i*46,170+(i%3)*5,.36,['#6e8f7b','#668a78','#a9bea0']);
 a+=path('M0 213h36v-5h40v-6h42v4h44v9h48v-4h50v-4h52v2h52v-3h52v-6h52v7h58v7h44v41H0z',p.grass);
 // A switchback trail keeps the walking character on clear ground.
 a+=path('M238 255h139v-15h-19v-12h-18v-12h-17v-9h-13v-9h-11v-9h8v-8h17v-7h-28v7h-16v10h-7v11h11v12h12v11h-20v13h-38z','#ded1b4');
 a+=path('M246 253h20v-12h19v-12h19v-14h-10v-12h-11v-10h9v-12h10v-5h8v-2h-14v7h-16v10h-7v11h11v12h12v11h-20v13h-38v17h8z','#c8bb9e');
 a+=pine(76,233,1.12)+pine(553,226,.95)+pine(591,243,1.2)+pine(25,239,.76);
 a+=path('M143 226h10v-6h18v5h8v8h-36z','#879891')+rect(151,220,13,3,'#b5bdb0')+path('M400 232h7v-5h18v4h7v8h-32z','#8b9991')+rect(410,227,9,3,'#bdc2ad');
 a+=placed(189,204,rect(0,-28,4,42,'#8d8067')+path('M-16-27h35l8 7-8 7h-35z','#aa9879')+rect(-9,-22,25,2,'#f0e8d5')+rect(-7,-17,16,2,'#f0e8d5'));
 a+=[ [115,238],[168,248],[211,229],[376,243],[437,219],[484,247] ].map(([x,y])=>grass(x,y)).join('')+flowers(130,245)+flowers(467,231);
 for(const [x,y] of [[174,235],[211,250],[421,248],[470,221],[366,229]])a+=rect(x,y,3,2,'#ded5b8');
 return a;
}

function sea(variant){
 const p=[{sky:'#d3e8eb',water:'#79afbf',deep:'#689daf',sand:'#e9d6ad',shade:'#d5c49f'}, {sky:'#ebe1d8',water:'#90b8bf',deep:'#7aa3b0',sand:'#e6ceaf',shade:'#d1bda5'}, {sky:'#dce6ee',water:'#82adbd',deep:'#6d96ae',sand:'#dfd8bd',shade:'#c6c6b0'}][variant];
 let a=rect(0,0,600,255,p.sky)+rect(0,81,600,28,'#e7eee4')+rect(0,107,600,83,p.water)+rect(0,109,600,17,p.deep);
 a+=cloud(36,26,.7)+cloud(344,17,.9)+birds(274,43)+placed(509,34,rect(0,5,20,12,'#f5e7bf')+rect(4,0,12,22,'#f5e7bf'),'recovery-sun-glow');
 a+=path('M0 124h16v-7h20v-10h24V96h26v10h20v12h22v9h20v15H0z','#94aaa1')+path('M0 129h20v-6h16v-9h24v-10h18v14h18v10h22v14H0z','#7d9891');
 a+=path('M475 124h22v-5h26v-6h25v7h26v5h26v13H475z','#b4c7bc');
 // Wave groups keep their placement outside the animated group.
 for(let i=0;i<5;i++)a+=placed(22+i*126,139+(i%2)*16,path('M0 0h17v-2h20v2h26v2H17v2H0z','#c6e2de'),`recovery-wave wave-${i%3}`);
 a+=path('M0 181h52v5h62v-3h57v5h61v-3h57v4h66v-4h72v-4h58v-3h52v-5h63v82H0z',p.sand);
 a+=placed(0,176,path('M0 0h51v5h62v-3h59v5h60v-3h57v4h64v-4h72v-4h59v-3h53v-5h63v5h-60v5h-53v3h-58v4h-72v4h-64v-4h-57v3h-64v-5h-56v3H50V5H0z','#f5f1dc'),'recovery-shore-foam');
 // Timber boardwalk and a short pier, with visible supports.
 a+=path('M15 227h44v-21h10v-21h10v-21h10v-21h11v-18h13v18h-8v21h-9v21h-10v21h-10v21h-11v24H15z','#b19979');
 for(let i=0;i<5;i++)a+=rect(78-i*10,145+i*21,28,3,'#d0b58e');
 a+=rect(60,191,5,33,'#8e795f')+rect(84,164,5,24,'#8e795f')+rect(107,139,5,24,'#8e795f');
 a+=path('M123 216h12v-8h18v6h13v10h-43z',p.shade)+rect(133,210,13,4,'#eee2c6');
 // Umbrella and woven beach mat frame, rather than cover, the actor.
 a+=placed(478,175,rect(-2,-15,4,44,'#9e8a73')+path('M-48-14h8v-8h10v-9h13v-6h15v-4h5v4h15v6h13v9h10v8h8v4h-97z','#c89584')+path('M-15-37h15v-4h5v4h15v6h-8v8H8v9H-9v-9h-4v-8h-2z','#f4e7ca')+rect(-44,-12,86,3,'#ab7f70'));
 a+=rect(443,214,78,21,'#ddad98')+rect(448,214,5,21,'#f2e7d0')+rect(469,214,5,21,'#f2e7d0')+rect(490,214,5,21,'#f2e7d0')+rect(511,214,5,21,'#f2e7d0');
 a+=placed(388,124,rect(0,8,22,3,'#758a8f')+path('M10 0v8H3z','#f8efdb')+rect(10,-2,2,13,'#8e9691'),'recovery-boat-rock');
 a+=path('M0 230h19v-6h25v4h18v10h19v17H0z','#9ea789')+path('M560 234h17v-9h23v30h-54v-12h14z','#a0ad8d');
 a+=[ [7,222],[28,227],[55,236],[568,230],[587,219] ].map(([x,y])=>grass(x,y,'#7f9278')).join('');
 for(const [x,y] of [[181,216],[228,244],[381,220],[420,244],[527,218]])a+=placed(x,y,rect(0,0,4,2,'#cfb998')+rect(2,-2,2,2,'#f5e7cc'));
 a+=placed(226,197,rect(0,0,3,2,'#bd9c81')+rect(11,5,3,2,'#bd9c81')+rect(21,11,3,2,'#bd9c81'));
 return a;
}

function shop(x,y,w,h,wall,roof,sign,variant){
 let a=rect(x+3,y,w-6,h,wall)+rect(x,y-5,w,6,roof)+rect(x+4,y+h-5,w-8,5,'#b3aaa0');
 a+=rect(x+9,y+9,w-18,8,'#ebdec3')+rect(x+14,y+12,w-28,2,sign);
 a+=rect(x+10,y+26,w-20,7,roof);
 for(let i=0;i<Math.floor((w-20)/12);i++)a+=rect(x+10+i*12,y+26,6,7,'#f4ecdb');
 const door=x+w-25;
 a+=rect(x+11,y+35,w-44,h-43,'#779497')+rect(x+14,y+38,w-50,h-51,'#c6d9d5')+rect(door,y+35,16,h-40,'#786e63')+rect(door+3,y+38,10,h-49,'#b8cdc9')+rect(door+11,y+h-17,2,2,'#ead8ba');
 a+=rect(x+15,y+h-17,w-52,3,'#8e9d93')+rect(x+17,y+h-23,3,6,'#6b8671')+rect(x+25,y+h-25,5,8,'#809a78');
 return a+rect(x+14,y+42,5,5,variant===1?'#f1dcaa':'#e9e8d8',' class="recovery-window-glow"');
}
function city(variant){
 const p=[{sky:'#dce7e8',road:'#a4adae',path:'#d8d5c5',roof:'#958c8b'}, {sky:'#e5dedb',road:'#a5a6ae',path:'#d9cdbc',roof:'#9a8181'}, {sky:'#d6e1eb',road:'#a0acb5',path:'#d4d3c9',roof:'#82919a'}][variant];
 let a=rect(0,0,600,255,p.sky)+rect(0,93,600,68,'#e7e8dc')+cloud(184,22,.6)+cloud(422,12,.75)+birds(313,37);
 for(let i=0;i<9;i++){const x=i*73-14,h=35+(i%3)*14,y=98-h;a+=rect(x,y,55,h,'#bac8c8')+rect(x+4,y-4,47,4,'#b2c0c2');for(let r=0;r<3;r++)for(let c=0;c<3;c++)if(y+8+r*12<96)a+=rect(x+7+c*15,y+8+r*12,6,6,'#d9e2de');}
 a+=rect(0,156,600,28,'#a4b199')+rect(0,177,600,30,p.path)+rect(0,207,600,48,p.road)+rect(0,204,600,3,'#ede4d3');
 // Small neighborhood shops, with doors and display windows at human scale.
 a+=shop(32,91,88,90,'#cdb99e','#9c8879','#718f87',variant)+shop(126,106,77,75,'#d9ccaf','#8f9c8e','#a48575',variant)+shop(377,97,90,84,'#d2beb2','#a18783','#a88b6f',variant)+shop(474,76,91,105,'#c2c9bc','#8f9d93','#728d98',variant);
 for(const x of [480,506,532])a+=rect(x,88,16,17,'#849da1')+rect(x+2,90,12,13,'#e9dfbc',' class="recovery-window-glow"')+rect(x+7,90,2,13,'#9aa8a4');
 a+=rect(473,116,93,3,'#8f9d93');
 // A plaza and fountain form a deliberate gap behind the walking actor.
 a+=path('M216 176h128v-8h-128z','#c6bba6')+rect(223,160,114,11,'#c1c6bc')+rect(231,162,98,5,'#a7c6c6')+rect(271,141,20,21,'#a7b4ac')+rect(261,138,40,6,'#dce1d6');
 a+=placed(280,139,'<path d="M0 0v-18h-2v-6h-5m7 7h5v5h4v6m-10-8h-5v5h-4v6" stroke="#d9eeea" stroke-width="2" fill="none"/>','recovery-fountain');
 for(const [x,y] of [[17,174],[352,187],[581,163]]){a+=rect(x-3,y-49,6,57,'#938473')+placed(x,y-52,path('M-24-3v-9h6v-9h11v-5h15v5h12v9h6v19h-6v8H-19V7h-5z','#91a48a')+rect(-14,-15,12,3,'#bac5a1')+rect(8,-3,9,3,'#718b77'),'recovery-leaf-sway')+rect(x-17,y+5,35,6,'#beaf97');}
 for(const [x,y] of [[87,187],[486,189]])a+=rect(x,y,58,5,'#a28870')+rect(x+3,y-11,52,8,'#b49a7e')+rect(x+6,y+5,4,10,'#7d827d')+rect(x+47,y+5,4,10,'#7d827d');
 a+=rect(215,185,36,2,'#b9b4a4')+rect(256,197,42,2,'#b9b4a4')+rect(307,183,37,2,'#b9b4a4');
 for(let i=0;i<8;i++)a+=rect(17+i*80,234,32,3,'#d7d9d1');
 // Bicycle, café steam and an unoccupied street give the scene small motions.
 a+=placed(156,192,'<path d="M0 0h-8v5h-4v8h4v5H1v-5h4V5H1zm33 0h-8v5h-4v8h4v5h9v-5h4V5h-4zM-3 7L8-7 20 7H-3l9-19m14 19 8-20h7m-7 0v-5" fill="none" stroke="#657e7e" stroke-width="2"/>'+rect(4,-15,10,3,'#937d6c'));
 a+=placed(406,161,rect(-2,0,10,10,'#f0e7d5')+rect(8,2,3,5,'#e6d4b9')+'<path d="M0-4v-5h3v-5m3 10v-5h3v-5" stroke="#f4ece0" stroke-width="2" fill="none" class="recovery-steam"/>');
 a+=rect(36,190,21,3,'#8d9f89')+flowers(42,178)+rect(541,188,26,4,'#a49988')+flowers(547,176);
 return a;
}

function bedroom(variant){
 const p=[{wall:'#eee6d8',linen:'#b8c9c1',accent:'#c5a898'}, {wall:'#e9e2dd',linen:'#b5bfd4',accent:'#c7b49b'}, {wall:'#e7e8df',linen:'#d5bfc0',accent:'#a8b9a7'}][variant];
 let a=rect(0,0,600,255,p.wall)+rect(0,182,600,73,'#d8c6ab')+rect(0,176,600,6,'#bbac95');
 for(let i=0;i<5;i++)a+=rect(0,195+i*15,600,2,'#c8b497');
 for(let i=0;i<8;i++)a+=rect(45+i*83,183+(i%2)*14,2,72,'#c8b497');
 a+=rect(58,24,132,132,'#b7ad98')+rect(64,30,120,120,'#e0e8d9')+rect(69,35,110,107,'#c7dce0')+rect(69,98,110,44,'#b0c8bc')+path('M69 121h25v-7h18v6h23v-10h21v5h23v27H69z','#94b0a2')+rect(121,35,5,110,'#f5eddb')+rect(69,81,110,5,'#f5eddb')+rect(53,151,142,6,'#c4b89e');
 a+=placed(48,22,rect(0,0,10,136,p.accent)+path('M3 9h12v119H3z','#d8c5b1')+rect(129,0,10,136,p.accent)+path('M124 9h12v119h-12z','#d8c5b1'),'recovery-curtain');
 a+=rect(232,33,45,57,'#ab927a')+rect(237,38,35,47,'#f5ead8')+path('M242 72h24V58h-5v-8h-6v10h-6v7h-7z','#a2b6a5')+rect(243,78,21,2,'#c6b592');
 // Low bookshelf, individual spines, and a reading lamp.
 a+=rect(19,164,112,58,'#b59c7b')+rect(24,169,102,21,'#dcc8a6')+rect(24,195,102,20,'#dcc8a6');
 for(let i=0;i<10;i++){const c=['#a0b9b0','#c3a29a','#bab68f','#94a7b6'][i%4];a+=rect(29+i*9,171+(i%3),6,16-(i%3),c)+rect(30+i*9,174+(i%3),4,1,'#ede4cd');}
 a+=rect(29,199,42,7,'#acb9ac')+rect(32,207,35,5,'#ddd5bf')+rect(83,199,24,14,'#b99483')+rect(87,202,16,2,'#e8d2bd');
 a+=rect(499,164,50,43,'#baa184')+rect(495,159,58,7,'#d4bc98')+rect(506,174,36,2,'#927d69')+rect(519,179,8,3,'#e4d4b7');
 a+=rect(519,120,4,39,'#8e978d')+path('M499 120h43l-8-25h-26z','#eadfc0')+placed(502,101,rect(0,0,36,14,'#f4e7b7'),'recovery-lamp-glow');
 // Bed silhouette remains separate from the moving quilt highlight.
 a+=rect(214,143,266,17,'#b99e82')+rect(214,160,266,67,'#c9b295')+rect(222,226,8,19,'#a08b71')+rect(460,226,8,19,'#a08b71')+rect(221,153,254,64,'#f0e7d8');
 a+=rect(233,149,72,31,'#f8f1e3')+rect(237,153,64,22,'#eee7d8')+rect(307,151,79,29,'#f8f1e3')+rect(311,155,71,21,'#eee7d8');
 a+=rect(222,176,253,40,p.linen)+placed(228,180,rect(0,0,241,5,'#dfe6d9')+rect(0,7,241,2,'#ccd9ce')+rect(0,30,241,3,'#a0b3a9'),'recovery-quilt-breathe');
 a+=rect(178,229,329,20,'#c4b8a2')+rect(185,231,315,2,'#e3d6bb')+rect(185,243,315,2,'#e3d6bb');
 a+=placed(554,194,rect(-3,-27,6,27,'#89a285')+path('M0-15h12v-8H6v-6H0z','#a4b493')+path('M0-7h-11v-8h5v-6h6z','#789785')+rect(-13,0,27,19,'#b89d80')+rect(-14,-3,29,4,'#ccb499'),'recovery-leaf-sway');
 a+=placed(506,146,rect(0,0,13,9,'#98abb7')+rect(13,2,3,5,'#b1c0c3')+'<path d="M3-4v-5h2v-5" stroke="#f9f2e7" stroke-width="2" fill="none" class="recovery-steam"/>');
 return a;
}

export function recoveryArt(state,result={},index=0){
 const destination=recoveryDestination(state,result,index),variant=recoveryVariant(state,index);
 const draw={mountain,sea,city,bed:bedroom}[destination];
 return `<g class="recovery-scenery scenery-${destination}" data-destination="${destination}" data-recovery-variant="${variant}">${draw(variant)}</g>`;
}
