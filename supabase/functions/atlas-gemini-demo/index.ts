import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const examples = {
  reuniao: { question:"Quais foram os encaminhamentos da reunião fictícia?",sources:[{id:"DEMO-ATA-001",title:"Ata fictícia de planejamento",text:"A equipe fictícia decidiu revisar o cronograma na segunda-feira. A responsável fictícia Clara apresentará a nova proposta."}]},
  treinamento:{question:"O que foi definido no treinamento demonstrativo?",sources:[{id:"DEMO-TREINO-002",title:"Treinamento fictício",text:"O treinamento de exemplo estabeleceu uma rotina semanal de revisão, sem participantes ou dados reais."}]}
} as const;

Deno.serve(async(req)=>{
 const headers={"Content-Type":"application/json","Cache-Control":"no-store","Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, apikey, content-type"};
 if(req.method==="OPTIONS")return new Response(null,{headers,status:204});
 if(req.method!=="POST")return Response.json({error:"Método não permitido"},{status:405,headers});
 const auth=req.headers.get("Authorization")||"";
 if(!auth.startsWith("Bearer "))return Response.json({error:"Autenticação necessária"},{status:401,headers});
 const url=Deno.env.get("SUPABASE_URL");
 const anon=Deno.env.get("SUPABASE_ANON_KEY");
 if(!url||!anon)return Response.json({error:"Configuração indisponível"},{status:503,headers});
 const client=createClient(url,anon,{global:{headers:{Authorization:auth}},auth:{persistSession:false}});
 const {data:{user},error}=await client.auth.getUser();
 if(error||!user)return Response.json({error:"Sessão inválida"},{status:401,headers});
 let payload:{scenario?:string};
 try{payload=await req.json()}catch{return Response.json({error:"JSON inválido"},{status:400,headers})}
 const scenario=payload.scenario;
 if(scenario!=="reuniao"&&scenario!=="treinamento")return Response.json({error:"Cenário inválido"},{status:400,headers});
 const demo=examples[scenario];
 // No remote provider is called. Synthetic examples only, by construction.
 return Response.json({mode:"synthetic-demo",provider:"gemini-2.5-flash-lite",externalCall:false,question:demo.question,answer:demo.sources[0].text,citations:demo.sources.map(({id,title})=>({id,title}))},{headers});
});
