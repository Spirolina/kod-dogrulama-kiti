export function oturumBaslat() {
  const token = localStorage.getItem('auth_token');

  if (!token) {
    window.location.href = '/login';
    return;
  }

  http.setAuthHeader(token);
}
