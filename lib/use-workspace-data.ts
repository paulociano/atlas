'use client';
import {useCallback,useEffect,useState} from 'react';
import {supabase} from './supabase';
import type {Entry} from './types';
export type WorkspaceTask={id:string;title:string;done:boolean;due_at:string|null;source_entry_id:string|null;assignee_user_id:string|null;priority:string;status:string};
export type WorkspaceAttendance={id:string;participant_name:string;present:boolean;entry_id:string};
export function useWorkspaceData(workspaceId:string){
 const [entries,setEntries]=useState<Entry[]>([]);
 const [tasks,setTasks]=useState<WorkspaceTask[]>([]);
 const [attendance,setAttendance]=useState<WorkspaceAttendance[]>([]);
 const [loadError,setLoadError]=useState('');
 const refresh=useCallback(async(id:string)=>{
  setEntries([]);setTasks([]);setAttendance([]);setLoadError('');
  if(!supabase||!id)return;
  const [e,t,a]=await Promise.all([
   supabase.from('entries').select('*').eq('workspace_id',id).order('occurred_at',{ascending:false}).limit(500),
   supabase.from('tasks').select('id,title,done,due_at,source_entry_id,assignee_user_id,priority,status').eq('workspace_id',id).order('created_at',{ascending:false}),
   supabase.from('attendance').select('id,participant_name,present,entry_id').eq('workspace_id',id)
  ]);
  if(e.error||t.error||a.error)setLoadError(e.error?.message||t.error?.message||a.error?.message||'');
  setEntries((e.data||[]) as Entry[]);
  setTasks((t.data||[]) as WorkspaceTask[]);
  setAttendance((a.data||[]) as WorkspaceAttendance[]);
 },[]);
 useEffect(()=>{void refresh(workspaceId)},[workspaceId,refresh]);
 return {entries,tasks,attendance,refresh,loadError};
}
