export type JiraiEmotion = 'neutral' | 'happy' | 'wink' | 'surprised' | 'sad' | 'annoyed' | 'sleepy' | 'excited'
export type Viseme = 'REST' | 'SMILE' | 'A' | 'E' | 'I' | 'O' | 'U'

export const JIRAI_EMOTIONS: JiraiEmotion[] = ['neutral','happy','wink','surprised','sad','annoyed','sleepy','excited']

export const EXPRESSION_ASSET: Record<JiraiEmotion,string> = {
  neutral: '/NE5-Deskpet-NEO/assets/jirai/expressions/neutral.png',
  happy: '/NE5-Deskpet-NEO/assets/jirai/expressions/happy.png',
  wink: '/NE5-Deskpet-NEO/assets/jirai/expressions/wink.png',
  surprised: '/NE5-Deskpet-NEO/assets/jirai/expressions/surprised.png',
  sad: '/NE5-Deskpet-NEO/assets/jirai/expressions/sad.png',
  annoyed: '/NE5-Deskpet-NEO/assets/jirai/expressions/annoyed.png',
  sleepy: '/NE5-Deskpet-NEO/assets/jirai/expressions/sleepy.png',
  excited: '/NE5-Deskpet-NEO/assets/jirai/expressions/excited.png'
}

export const MOUTHLESS_ASSET = '/NE5-Deskpet-NEO/assets/jirai/expressions/neutral_mouthless.png'
export const VISEME_ASSET: Record<Viseme,string> = Object.fromEntries(['REST','SMILE','A','E','I','O','U'].map(v => [v, `/NE5-Deskpet-NEO/assets/jirai/visemes/${v}.png`])) as Record<Viseme,string>

export interface JiraiFrame { emotion: JiraiEmotion; characterSrc: string; mouthSrc?: string; x:number; y:number; scaleX:number; scaleY:number; rotation:number; mouthScale:number; statusLabel:string }

const visemeCycle: Viseme[] = ['REST','A','E','I','O','U','A','SMILE']
export function sampleJirai(t:number, emotion:JiraiEmotion, speaking:boolean, talkLevel:number):JiraiFrame {
  const breath = Math.sin(t * (emotion === 'sleepy' ? 1.15 : 1.55))
  const excited = emotion === 'excited' ? Math.abs(Math.sin(t*3.2))*1.7 : 0
  const sad = emotion === 'sad' ? 1.2 : 0
  const speakingBob = speaking ? Math.sin(t*8.2)*0.55*talkLevel : 0
  let mouthSrc:string|undefined
  if (speaking) {
    const level = Math.max(0,Math.min(1,talkLevel))
    const index = level < .12 ? 0 : 1 + (Math.floor(t*9) % (visemeCycle.length-1))
    mouthSrc = VISEME_ASSET[visemeCycle[index]]
  }
  return {
    emotion,
    characterSrc: speaking ? MOUTHLESS_ASSET : EXPRESSION_ASSET[emotion],
    mouthSrc,
    x: 0,
    y: breath*.45 + speakingBob - excited + sad,
    scaleX: 1 + excited*.0015,
    scaleY: 1 + breath*.0028 + excited*.003,
    rotation: emotion === 'wink' ? -0.45 : emotion === 'annoyed' ? 0.35 : 0,
    mouthScale: .86 + Math.max(0,Math.min(1,talkLevel))*.16,
    statusLabel: `${emotion.toUpperCase()}${speaking?' / SPEAKING':''}`
  }
}
