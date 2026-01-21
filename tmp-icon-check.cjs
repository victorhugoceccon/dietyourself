const fs=require("fs");
const path=require("path");
const exportsFile=path.join("node_modules","@phosphor-icons","react","dist","index.d.ts");
const exportsText=fs.readFileSync(exportsFile,"utf8");
const exportNames=new Set([...exportsText.matchAll(/\.\/csr\/([A-Za-z0-9]+)/g)].map(m=>m[1]));
const exts=new Set([".js",".jsx",".ts",".tsx"]);
function walk(dir){
  const out=[];
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    if(entry.name.startsWith(".")) continue;
    const full=path.join(dir,entry.name);
    if(entry.isDirectory()) out.push(...walk(full));
    else if(exts.has(path.extname(entry.name))) out.push(full);
  }
  return out;
}
const files=walk("src");
const missing=new Map();
for(const f of files){
  const text=fs.readFileSync(f,"utf8");
  const importMatches=[...text.matchAll(/import\s*\{([^}]+)\}\s*from\s*["']@phosphor-icons\/react["']/g)];
  for(const im of importMatches){
    const names=im[1].split(",").map(s=>s.trim()).filter(Boolean);
    for(const name of names){
      if(!exportNames.has(name)){
        if(!missing.has(name)) missing.set(name,[]);
        missing.get(name).push(f);
      }
    }
  }
}
if(missing.size===0){
  console.log("OK: nenhum icon faltando");
} else {
  for(const [name,filesList] of missing){
    console.log(name+":");
    filesList.forEach(f=>console.log("  "+f));
  }
}
