'use client';
import {useState} from 'react';
import {supabase} from '../lib/supabase';
type Demo={mode:string;provider:string;externalCall:boolean;question:string;answer:string;citations:{id:string;title:string}[]};
export default function GeminiDemo(){
 const [mode,setMode]=useState<'demo'|'real'>('demo');
 const [scenario,setScenario]=useState<'reuniao'|'treinamento'>('reuniao');
 const [result,setResult]=useState<Demo|null>(null);
 const [error,setError]=useState('');
 const [loading,setLoading]=useState(false);
 async function run(){
  if(!supabase)return;
  setLoading(true);setError('');setResult(null);
  const {data,error}=await supabase.functions.invoke('atlas-gemini-demo',{body:{scenario,mode}});
  if(error)setError('A demonstração não pôde ser executada. Verifique a sessão e tente novamente.');
  else if((mode==='demo'&&(data?.mode!=='synthetic-demo'||data.externalCall!==false))||(mode==='real'&&(data?.mode!=='gemini-real-synthetic'||data.externalCall!==true)))setError('Resposta inesperada ou modo real não habilitado. Configure os secrets no Supabase.');
  else setResult(data as Demo);
  setLoading(false);
 }
 return <section className="panel attendance-form" aria-busy={loading}>
  <h3>Laboratório Gemini Flash-Lite</h3>
  <p>Simulação isolada, com dados inteiramente fictícios. Nenhum documento da organização é enviado ao Google. Nenhuma chamada ao modelo é realizada.</p>
  <label>Cenário de demonstração<select value={scenario} onChange={e=>{setScenario(e.target.value as 'reuniao'|'treinamento');setResult(null)}}>
   <option value="reuniao">Reunião fictícia</option><option value="treinamento">Treinamento fictício</option>
  </select></label>
  <label>Execução<select value={mode} onChange={e=>{setMode(e.target.value as 'demo'|'real');setResult(null)}}><option value="demo">Simulação sem chamadas externas</option><option value="real">Gemini real, apenas dados fictícios (requer ativação)</option></select></label><button className="secondary" disabled={loading} onClick={()=>void run()}>{loading?'Consultando laboratório...':mode==='real'?'Testar Gemini real com dados fictícios':'Executar demonstração sem IA paga'}</button>
  {error&&<p className="error" role="alert">{error}</p>}
  {result&&<div role="status"><p><strong>Pergunta:</strong> {result.question}</p><p><strong>Resposta simulada:</strong> {result.answer}</p><p><strong>Fonte fictícia:</strong> {result.citations.map(x=>x.title+' ('+x.id+')').join(', ')}</p><small>Modo: {result.mode}. Provedor: {result.provider}. Chamada externa: {result.externalCall?'sim':'não'}.</small></div>}
 </section>;
}
