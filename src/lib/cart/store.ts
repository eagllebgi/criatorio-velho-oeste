import type { CartItem } from "@/lib/cart/types";

const STORAGE_KEY = "cvo:cart";
const EMPTY: CartItem[] = [];

type Listener = () => void;

let state: CartItem[] = EMPTY;
let initialized = false;
const listeners = new Set<Listener>();

function readFromStorage(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persist(items: CartItem[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Armazenamento indisponível (modo privado, cota excedida etc). O
    // pedido continua funcionando durante a sessão, apenas não persiste.
  }
}

function ensureInitialized() {
  if (initialized || typeof window === "undefined") return;
  state = readFromStorage();
  initialized = true;
}

/**
 * Store externo mínimo (padrão useSyncExternalStore) para o carrinho
 * persistido em localStorage — evita divergência entre a renderização do
 * servidor (sem localStorage) e a do cliente.
 */
export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSnapshot(): CartItem[] {
  ensureInitialized();
  return state;
}

export function getServerSnapshot(): CartItem[] {
  return EMPTY;
}

export function setItems(
  updater: CartItem[] | ((prev: CartItem[]) => CartItem[]),
): void {
  ensureInitialized();
  const next = typeof updater === "function" ? updater(state) : updater;
  state = next;
  persist(next);
  listeners.forEach((listener) => listener());
}
