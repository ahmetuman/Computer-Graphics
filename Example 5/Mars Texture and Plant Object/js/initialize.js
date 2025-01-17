
async function loadMTL(url) {
    const resp = await fetch(url);
    if(!resp.ok){
        console.error("MTL fetch error:", url);
        return null;
    }
    const text = await resp.text();

    let diffuseMap = null;
    let normalMap  = null; // look for map_Bump or bump
    const lines = text.split('\n');

    for(let line of lines){
        line=line.trim();
        if(line.startsWith('#')||line==='') continue;
        // e.g. "map_Kd textures/indoor plant_2_COL.jpg"
        if(line.toLowerCase().startsWith('map_kd')){
            const parts=line.split(/\s+/);
            if(parts.length>=2){
                diffuseMap=parts[1];
            }
        }
        // e.g. "map_Bump textures/indoor plant_2_NOR.jpg" or "bump textures/.."
        else if(line.toLowerCase().startsWith('map_bump') || line.toLowerCase().startsWith('bump')){
            const parts=line.split(/\s+/);
            if(parts.length>=2){
                normalMap=parts[1];
            }
        }
    }
    return { diffuseMap, normalMap };
}

async function loadOBJ(url) {
    const resp = await fetch(url);
    if(!resp.ok){
        console.error("OBJ fetch error:", url);
        return null;
    }
    const text = await resp.text();

    const positions=[], normals=[], texcoords=[], indices=[];
    const tmpPos=[[0,0,0]], tmpNor=[[0,0,1]], tmpUV=[[0,0]];

    const lines=text.split('\n');
    for(let line of lines){
        line=line.trim();
        if(line.startsWith('#')||line==='') continue;
        const parts=line.split(/\s+/);
        const kw=parts[0];
        if(kw==='v' && parts.length>=4){
            tmpPos.push([+parts[1], +parts[2], +parts[3]]);
        }
        else if(kw==='vt' && parts.length>=3){
            tmpUV.push([+parts[1], +parts[2]]);
        }
        else if(kw==='vn' && parts.length>=4){
            tmpNor.push([+parts[1], +parts[2], +parts[3]]);
        }
        else if(kw==='f'){
            const face=parts.slice(1);
            for(let fv of face){
                // v/t/n
                const [vIdx,tIdx,nIdx] = fv.split('/').map(x=>parseInt(x)||0);
                const p=tmpPos[vIdx], uv=tmpUV[tIdx]||[0,0], no=tmpNor[nIdx]||[0,0,1];
                positions.push(p[0],p[1],p[2]);
                texcoords.push(uv[0],uv[1]);
                normals.push(no[0],no[1],no[2]);
                indices.push(indices.length);
            }
        }
    }

    return {positions, normals, texcoords, indices};
}

