let gsapMod: typeof import('gsap') | null = null;
let stMod: typeof import('gsap/ScrollTrigger') | null = null;

export async function loadGsap() {
  if (!gsapMod || !stMod) {
    const [g, st] = await Promise.all([import('gsap'), import('gsap/ScrollTrigger')]);
    gsapMod = g;
    stMod = st;
    g.default.registerPlugin(st.ScrollTrigger);
  }
  return { gsap: gsapMod.default, ScrollTrigger: stMod.ScrollTrigger };
}
