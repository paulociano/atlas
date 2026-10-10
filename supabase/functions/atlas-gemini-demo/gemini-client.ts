// Adaptador utilizado somente no modo real explicitamente autorizado.
// Recebe exclusivamente fontes sintéticas DEMO e mantém a chave no servidor.
export class GeminiProviderError extends Error {constructor(public code:string,public status:number){super(code)}}
type SyntheticPrompt={question:string;sourceId:string;sourceTitle:string;sourceText:string};
export async function generateFromSyntheticSources(input:SyntheticPrompt,apiKey:string){
 if(!apiKey)throw new Error('Chave Gemini não configurada');
 if(!input.sourceId.startsWith('DEMO-'))throw new Error('Somente fontes fictícias permitidas');
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),8000);
 try{
  const res=await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent',{
   method:'POST',signal:controller.signal,
   headers:{'Content-Type':'application/json','x-goog-api-key':apiKey},
   body:JSON.stringify({
    contents:[{role:'user',parts:[{text:'Responda em português usando somente esta fonte fictícia. Se não houver evidência, diga que não sabe. Pergunta: '+input.question+'\nFonte ['+input.sourceId+'] '+input.sourceTitle+': '+input.sourceText}]}],
    generationConfig:{temperature:0,maxOutputTokens:240}
   })
  });
  if(!res.ok){const code=res.status===429?'QUOTA':res.status===401||res.status===403?'AUTH':res.status===404?'MODEL':res.status===400?'REQUEST':res.status>=500?'PROVIDER':'OTHER';throw new GeminiProviderError(code,res.status)}
  const data=await res.json();
  const answer=data?.candidates?.[0]?.content?.parts?.map((p:{text?:string})=>p.text||'').join('').trim();
  if(!answer)throw new GeminiProviderError('EMPTY',502);
  return {answer,citations:[{id:input.sourceId,title:input.sourceTitle}]};
 }finally{clearTimeout(timer)}
}
