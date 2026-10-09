'use client';
import {useEffect,useState} from 'react';
import {supabase} from './supabase';
import type {Entry} from './types';

const PAGE_SIZE=30;
export function useWorkspaceRecordSearch(workspaceId:string,section:string,term:string,revision:Entry[]){
 const [results,setResults]=useState<Entry[]>([]);
 const [page,setPage]=useState(0);
 const [total,setTotal]=useState(0);
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState('');
 useEffect(()=>{setPage(0)},[workspaceId,section,term]);
 useEffect(()=>{
  if(!supabase||!workspaceId||!['registros','reunioes','treinamentos','decisoes'].includes(section)){setResults([]);return}
  let active=true;
  setLoading(true);setError('');
  const timer=setTimeout(async()=>{
   let q=supabase!.from('entries').select('*',{count:'exact'}).eq('workspace_id',workspaceId);
   if(section==='reunioes')q=q.eq('kind','reuniao');
   if(section==='treinamentos')q=q.eq('kind','treinamento');
   if(section==='decisoes')q=q.in('kind',['decisao','regra','conduta']);
   const safe=term.trim().replace(/[%_,().]/g,' ').replace(/\s+/g,' ').slice(0,120);
   if(safe)q=q.or('title.ilike.%'+safe+'%,body.ilike.%'+safe+'%');
   const {data,count,error:requestError}=await q.order('occurred_at',{ascending:false}).order('id',{ascending:false}).range(page*PAGE_SIZE,page*PAGE_SIZE+PAGE_SIZE-1);
   if(!active)return;
   setResults((data||[]) as Entry[]);
   setTotal(count||0);
   setError(requestError?.message||'');
   setLoading(false);
  },250);
  return()=>{active=false;clearTimeout(timer)}
 },[workspaceId,section,term,page,revision]);
 return {results,page,setPage,total,loading,error,pageSize:PAGE_SIZE};
}
