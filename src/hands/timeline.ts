import {clamp,smooth} from '../ocean/math';
export const EMERGE_SECONDS=1.8;
export const APPROACH_SECONDS=8;
export const EXPLOSION_SECONDS=2.2;
export const DARK_SECONDS=5;
export const LOOP_SECONDS=EMERGE_SECONDS+APPROACH_SECONDS+EXPLOSION_SECONDS+DARK_SECONDS;
export type ScenePhase='emerge'|'approach'|'explode'|'dark';
export interface SceneState {phase:ScenePhase;progress:number;reach:number;opacity:number;cycle:number;contactTime:number}
export function sceneAt(time:number):SceneState {const cycle=Math.floor(Math.max(0,time)/LOOP_SECONDS),local=Math.max(0,time)-cycle*LOOP_SECONDS,contactTime=cycle*LOOP_SECONDS+EMERGE_SECONDS+APPROACH_SECONDS;if(local<EMERGE_SECONDS){const progress=local/EMERGE_SECONDS;return {phase:'emerge',progress,reach:0,opacity:smooth(progress),cycle,contactTime}}if(local<EMERGE_SECONDS+APPROACH_SECONDS){const progress=(local-EMERGE_SECONDS)/APPROACH_SECONDS;return {phase:'approach',progress,reach:smooth(progress),opacity:1,cycle,contactTime}}if(local<EMERGE_SECONDS+APPROACH_SECONDS+EXPLOSION_SECONDS){const progress=clamp((local-EMERGE_SECONDS-APPROACH_SECONDS)/EXPLOSION_SECONDS);return {phase:'explode',progress,reach:1,opacity:(1-progress)**1.5,cycle,contactTime}}return {phase:'dark',progress:(local-EMERGE_SECONDS-APPROACH_SECONDS-EXPLOSION_SECONDS)/DARK_SECONDS,reach:0,opacity:0,cycle,contactTime}}
