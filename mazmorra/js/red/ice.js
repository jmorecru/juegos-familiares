// Diagnóstico: por dónde va una conexión WebRTC, según el par de candidatos ICE en uso.
//  host  = dirección local          → directa por la wifi
//  prflx = descubierta al recibir paquetes (habitual con iPhone, que oculta las locales) → sigue siendo la wifi
//  srflx = dirección pública del router → a través del router
//  relay = servidor TURN externo     → servidor externo
export async function tipoConexion(pc) {
  if (!pc || !pc.getStats) return 'desconocida';
  try {
    const stats = await pc.getStats();
    let par = null;
    stats.forEach(r => { if (r.type === 'transport' && r.selectedCandidatePairId) par = stats.get(r.selectedCandidatePairId); });
    if (!par) stats.forEach(r => { if (r.type === 'candidate-pair' && (r.selected || r.nominated) && r.state === 'succeeded') par = r; });
    if (!par) return 'desconocida';
    const tipos = [stats.get(par.localCandidateId), stats.get(par.remoteCandidateId)].map(c => c && c.candidateType);
    if (tipos.includes('relay')) return 'servidor externo';
    if (tipos.includes('srflx')) return 'a través del router (' + tipos.join('/') + ')';
    return 'directa por la wifi' + (tipos.includes('prflx') ? ' (' + tipos.join('/') + ')' : '');
  } catch (e) {
    return 'desconocida';
  }
}
