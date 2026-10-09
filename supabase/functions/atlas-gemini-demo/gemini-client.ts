// Adaptador preparado para ativação futura exclusivamente com chave de API
// confirmada no nível gratuito. Este módulo NÃO é importado pela função
// publicada atlas-gemini-demo; não realiza chamadas ao ser apenas versionado.
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
  if(!res.ok)throw new Error('Gemini indisponível ('+res.status+')');
  const data=await res.json();
  const answer=data?.candidates?.[0]?.content?.parts?.map((p:{text?:string})=>p.text||'').join('').trim();
  if(!answer)throw new Error('Resposta vazia');
  return {answer,citations:[{id:input.sourceId,title:input.sourceTitle}]};
 }finally{clearTimeout(timer)}
}
