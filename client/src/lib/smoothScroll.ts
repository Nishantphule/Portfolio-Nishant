type ScrollTarget = string | HTMLElement;
type Scroller = {
  scrollTo: (target: ScrollTarget, opts?: { offset?: number; duration?: number }) => void;
};

const HEADER_OFFSET = -72;
let scroller: Scroller | null = null;

export function registerScroller(instance: Scroller | null) {
  scroller = instance;
}

export function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  if (scroller) {
    scroller.scrollTo(el, { offset: HEADER_OFFSET, duration: 1.45 });
    return;
  }
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
