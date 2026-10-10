import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {createClient} from "npm:@supabase/supabase-js@2";
import {generateFromSyntheticSources} from "./gemini-client.ts";

const cases={
 reuniao:{question:"Quais encaminhamentos constam na reunião fictícia?",sourceId:"DEMO-ATA-001",sourceTitle:"Ata fictícia de planejamento",sourceText:"Uma equipe fictícia definiu que Clara entregará um cronograma revisado na segunda-feira."},
 treinamento:{question:"Qual rotina foi definida no treinamento fictício?",sourceId:"DEMO-TREINO-002",sourceTitle:"Treinamento de exemplo",sourceText:"O treinamento fictício decidiu estabelecer uma revisão semanal do conteúdo."}
} as const;
const headers={"Content-Type":"application/json","Cache-Control":"no-store","Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"POST, OPTIONS","Access-Control-Allow-Headers":"authorization,apikey,content-type,x-client-info,x-supabase-api-version"};
function reply(body:unknown,status=200){return Response.json(body,{status,headers})}
Deno.serve(async(req:Request)=>{
 if(req.method==="OPTIONS")return new Response(null,{headers,status:204});
 if(req.method!=="POST")return reply({error:"Método não permitido"},405);
 const auth=req.headers.get("Authorization")||"";
 if(!auth.startsWith("Bearer "))return reply({error:"Autenticação necessária"},401);
 const url=Deno.env.get("SUPABASE_URL"),key=Deno.env.get("SUPABASE_ANON_KEY");
 if(!url||!key)return reply({error:"Configuração incompleta"},503);
 const client=createClient(url,key,{global:{headers:{Authorization:auth}},auth:{persistSession:false}});
 const {data:{user},error}=await client.auth.getUser();
 if(error||!user)return reply({error:"Sessão inválida"},401);
 let body:unknown;try{body=await req.json()}catch{return reply({error:"JSON inválido"},400)}
 if(!body||typeof body!=="object")return reply({error:"Cenário obrigatório"},400);
 const scenario=("scenario" in body)?String(body.scenario):"";
 if(scenario!=="reuniao"&&scenario!=="treinamento")return reply({error:"Use cenário fictício"},400);
 const item=cases[scenario];
 const mode=("mode" in body)?String(body.mode):"demo";
 if(mode==="demo")return reply({mode:"synthetic-demo",provider:"gemini-2.5-flash-lite",externalCall:false,question:item.question,answer:item.sourceText,citations:[{id:item.sourceId,title:item.sourceTitle}]});
 if(mode!=="real")return reply({error:"Modo inválido"},400);
 // Double opt-in. Operators MUST verify free-tier billing status before setting the enable flag.
 if(Deno.env.get("GEMINI_REAL_DEMO_ENABLED")!=="true")return reply({error:"Gemini real ainda não ativado. Confirme o projeto gratuito e configure o secret de liberação."},409);
 const apiKey=Deno.env.get("GEMINI_API_KEY");
 if(!apiKey)return reply({error:"GEMINI_API_KEY não configurada no Supabase"},503);
 try{
  const result=await generateFromSyntheticSources(item,apiKey);
  return reply({mode:"gemini-real-synthetic",provider:"gemini-2.5-flash-lite",externalCall:true,question:item.question,...result});
 }catch{return reply({error:"Gemini indisponível ou quota gratuita esgotada. Nenhum dado real foi enviado."},502)}
});
