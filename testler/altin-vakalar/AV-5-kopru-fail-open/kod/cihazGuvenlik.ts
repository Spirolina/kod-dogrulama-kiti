export async function cihazGuvenliMi(): Promise<boolean> {
  try {
    const yanit = await window.webkit.messageHandlers.security.postMessage({
      action: 'checkDeviceIntegrity',
    });
    return yanit.secure;
  } catch (e) {
    console.log('Cihaz guvenlik kontrolu yapilamadi', e);
    return true;
  }
}
