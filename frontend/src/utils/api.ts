// Wrapper kolem fetch, který automaticky přidává hlavičku X-User-Id
// Předpokládá, že je userId uloženo v localStorage (spravováno v ProfilePicker.tsx)

export async function apiFetch(url: string, options: RequestInit = {}) {
  const userId = localStorage.getItem('userId');
  
  const headers = new Headers(options.headers || {});
  
  // Pokud je uživatel vybrán, pošli jeho ID. 
  // Pokud ne, backend si defaultně vezme userId = 1.
  if (userId) {
    headers.set('X-User-Id', userId);
  }
  
  // Pokud odesíláme JSON tělo a není nastaven Content-Type, přidáme ho
  if (options.body && typeof options.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const finalOptions: RequestInit = {
    ...options,
    headers
  };

  const response = await fetch(url, finalOptions);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error ${response.status}`);
  }
  
  return response.json();
}
