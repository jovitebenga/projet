'use client';
import { motion,useReducedMotion } from 'motion/react';
export default function Template({children}:{children:React.ReactNode}){const reduced=useReducedMotion();return <motion.div initial={reduced?false:{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{duration:.45,ease:[.22,1,.36,1]}}>{children}</motion.div>}
