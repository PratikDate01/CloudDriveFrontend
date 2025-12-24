// frontend/src/services/billing.ts

const API_BASE_URL = `${import.meta.env.VITE_API_URL || "https://clouddrivebackend.onrender.com"}/api`;

function getBase() {
  const raw = API_BASE_URL;
  return raw.trim().replace(/\/$/, '');
}

function authHeaders() {
  const token = localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

export type Plan = {
  id: 'free' | 'pro' | 'business' | string;
  name: string;
  description: string;
  priceMonthly: number;
  currency: string;
  hasPrice: boolean; // backend hides priceId but exposes if present
  storageLimitBytes: number;
  fileCountLimit: number;
};

export async function getPlans(): Promise<Plan[]> {
  const url = `${getBase()}/billing/prices`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(await safeError(res));
  const json = await res.json();
  return json.plans as Plan[];
}

export async function createCheckout(planId: string): Promise<string> {
  const url = `${getBase()}/billing/checkout`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(authHeaders() || {}) },
    body: JSON.stringify({ planId }),
  });
  if (!res.ok) throw new Error(await safeError(res));
  const json = await res.json();
  return json.url as string; // Stripe-hosted Checkout URL
}

async function safeError(res: Response) {
  try {
    const data = await res.json();
    return data?.error || `HTTP ${res.status}`;
  } catch {
    return `HTTP ${res.status}`;
  }
}