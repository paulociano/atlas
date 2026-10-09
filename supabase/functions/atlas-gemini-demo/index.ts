import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
const scenarios={
 reuniao:{question:"Quais foram os encaminhamentos da reunião fictícia?",answer:"A equipe fictícia decidiu revisar o cronograma na segunda-feira.",id:"DEMO-ATA-001",title:"Ata fictícia"},
 treinamento:{question:"O que foi definido no treinamento demonstrativo?",answer:"O treinamento fictício definiu uma rotina semanal de revisão.",id:"DEMO-TREINO-002",title:"Treinamento fictício"}
} as const;
Deno.serve(async req=>{
 const headers={"Content-Type":"application/json","Cache-Control":"no-store","Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization,apikey,content-type"};
 if(req.method==="OPTIONS")return new Response(null,{headers,status:204});
 if(req.method!=="POST")return Response.json({error:"Método inválido"},{status:405,headers});
 const auth=req.headers.get("Authorization")||"";
 if(!auth.startsWith("Bearer "))return Response.json({error:"Autenticação necessária"},{status:401,headers});
 const url=Deno.env.get("SUPABASE_URL"),key=Deno.env.get("SUPABASE_ANON_KEY");
 if(!url||!key)return Response.json({error:"Configuração indisponível"},{status:503,headers});
 const client=createClient(url,key,{global:{headers:{Authorization:auth}},auth:{persistSession:false}});
 const {data:{user},error}=await client.auth.getUser();
 if(error||!user)return Response.json({error:"Sessão inválida"},{status:401,headers});
 let value:unknown;try{value=await req.json()}catch{return Response.json({error:"JSON inválido"},{status:400,headers})}
 const scenario=(value&&typeof value==="object"&&"scenario" in value)?String(value.scenario):"";
 if(scenario!=="reuniao"&&scenario!=="treinamento")return Response.json({error:"Cenário inválido"},{status:400,headers});
 const s=scenarios[scenario];
 return Response.json({mode:"synthetic-demo",provider:"gemini-2.5-flash-lite",externalCall:false,question:s.question,answer:s.answer,citations:[{id:s.id,title:s.title}]},{headers});
});