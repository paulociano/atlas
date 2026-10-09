'use client';
import {useEffect,useState} from 'react';
import {supabase} from './supabase';
export type WorkspaceCounts={records:number;decisions:number;trainings:number;openTasks:number};
export function useWorkspaceCounts(workspaceId:string,revision:unknown){
 const [counts,setCounts]=useState<WorkspaceCounts|null>(null);
 const [error,setError]=useState('');
 useEffect(()=>{
  if(!supabase||!workspaceId){setCounts(null);return}
  let active=true;
  const load=async()=>{
   const [records,decisions,trainings,openTasks]=await Promise.all([
    supabase!.from('entries').select('id',{count:'exact',head:true}).eq('workspace_id',workspaceId),
    supabase!.from('entries').select('id',{count:'exact',head:true}).eq('workspace_id',workspaceId).in('kind',['decisao','regra','conduta']),
    supabase!.from('entries').select('id',{count:'exact',head:true}).eq('workspace_id',workspaceId).eq('kind','treinamento'),
    supabase!.from('tasks').select('id',{count:'exact',head:true}).eq('workspace_id',workspaceId).eq('done',false)
   ]);
   if(!active)return;
   const failure=[records,decisions,trainings,openTasks].find(x=>x.error)?.error;
   setError(failure?.message||'');
   if(!failure)setCounts({records:records.count||0,decisions:decisions.count||0,trainings:trainings.count||0,openTasks:openTasks.count||0});
  };
  void load();
  return()=>{active=false}
 },[workspaceId,revision]);
 return {counts,error};
}
