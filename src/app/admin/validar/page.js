'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { Camera, CameraOff, CheckCircle2, XCircle, AlertTriangle, ScanLine } from 'lucide-react';
import { api } from '@/lib/api';

export default function ValidarPage() {
  const [codigo, setCodigo] = useState('');
  const [resultado, setResultado] = useState(null); // { ok, mensaje, aviso, detalle }
  const [validando, setValidando] = useState(false);
  const [camara, setCamara] = useState(false);
  const [errCamara, setErrCamara] = useState('');
  const videoRef = useRef(null);
  const ocupado = useRef(false);

  const validar = useCallback(async (texto, marcar = true) => {
    const code = (texto ?? '').trim();
    if (!code || ocupado.current) return;
    ocupado.current = true;
    setValidando(true);
    try {
      const r = await api('/tickets/validar', { method: 'POST', body: JSON.stringify({ code, marcar }) });
      setResultado({ ok: true, mensaje: r.message, aviso: r.aviso, detalle: r });
    } catch (e) {
      setResultado({ ok: false, mensaje: e.message, detalle: e.datos ?? null });
    } finally {
      setValidando(false);
      setTimeout(() => { ocupado.current = false; }, 1500); // evita leer el mismo QR varias veces seguidas
    }
  }, []);

  // Lector por cámara
  useEffect(() => {
    if (!camara) return;
    let stream; let timer; let activo = true;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (!activo) return stream.getTracks().forEach((t) => t.stop());
        const video = videoRef.current;
        video.srcObject = stream;
        await video.play();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        timer = setInterval(() => {
          if (video.readyState < 2) return;
          canvas.width = video.videoWidth; canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0);
          const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const qr = jsQR(img.data, img.width, img.height);
          if (qr?.data) { setCodigo(qr.data); validar(qr.data); }
        }, 300);
      } catch (e) {
        setErrCamara('No se pudo abrir la cámara. Revisa los permisos del navegador (requiere HTTPS o localhost).');
        setCamara(false);
      }
    })();
    return () => { activo = false; clearInterval(timer); stream?.getTracks().forEach((t) => t.stop()); };
  }, [camara, validar]);

  const d = resultado?.detalle;
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight">Validar entradas</h1>
        <p className="text-sm text-gray-400 mt-1">Escanea el QR del cliente o pega el código. Al validar, la entrada (o el pedido de dulcería) queda marcada como usada/entregada.</p>
      </div>

      <div className="bg-[#121318] border border-neutral-800/80 rounded-xl p-4 space-y-4">
        <form onSubmit={(e) => { e.preventDefault(); validar(codigo); }} className="flex gap-3">
          <input value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="NEBAJPOLIS|V1|T1|S1|XXXXXXXXXX" autoFocus
            className="flex-1 bg-[#0D0E12] border border-neutral-800 rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-purple-500" />
          <button disabled={validando || !codigo.trim()} className="px-5 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-bold uppercase tracking-wider disabled:opacity-50">
            {validando ? '...' : 'Validar'}
          </button>
        </form>

        <button onClick={() => { setErrCamara(''); setCamara((c) => !c); }}
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-300 hover:text-white">
          {camara ? <CameraOff size={16} /> : <Camera size={16} />} {camara ? 'Apagar cámara' : 'Escanear con la cámara'}
        </button>
        {errCamara && <p className="text-sm text-red-400">{errCamara}</p>}
        {camara && (
          <div className="relative rounded-xl overflow-hidden border border-purple-500/40 bg-black aspect-video">
            <video ref={videoRef} muted playsInline className="w-full h-full object-cover" />
            <ScanLine className="absolute inset-0 m-auto text-purple-400/70" size={120} />
          </div>
        )}
      </div>

      {resultado && (
        <div className={`rounded-xl border p-5 space-y-3 ${resultado.ok ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-red-500/40 bg-red-500/10'}`}>
          <div className="flex items-center gap-3">
            {resultado.ok ? <CheckCircle2 className="text-emerald-400" size={32} /> : <XCircle className="text-red-400" size={32} />}
            <p className="text-lg font-black">{resultado.mensaje}</p>
          </div>
          {resultado.aviso && <p className="flex items-center gap-2 text-sm text-amber-300"><AlertTriangle size={16} />{resultado.aviso}</p>}
          {d?.tipo === 'dulceria' && (
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm pt-2 border-t border-white/10">
              <div><dt className="text-[11px] uppercase text-neutral-400">Tipo</dt><dd className="font-bold text-purple-300">Pedido de dulcería</dd></div>
              <div><dt className="text-[11px] uppercase text-neutral-400">Cine</dt><dd className="font-bold">{d.cinema}</dd></div>
              <div className="col-span-2"><dt className="text-[11px] uppercase text-neutral-400">Productos a entregar</dt>
                <dd className="font-bold"><ul>{(d.items ?? []).map((i, k) => <li key={k}>{i.quantity} × {i.name}</li>)}</ul></dd></div>
              <div className="col-span-2"><dt className="text-[11px] uppercase text-neutral-400">Cliente</dt><dd className="font-bold">{d.customer}</dd></div>
              {d.validUntil && <div className="col-span-2"><dt className="text-[11px] uppercase text-neutral-400">Válido hasta</dt><dd className="font-bold">{new Date(d.validUntil).toLocaleDateString('es-GT', { dateStyle: 'long' })}</dd></div>}
              {(d.usedAt || d.pickedUpAt) && <div className="col-span-2"><dt className="text-[11px] uppercase text-neutral-400">Entregado el</dt><dd className="font-bold">{new Date(d.usedAt || d.pickedUpAt).toLocaleString('es-GT')}</dd></div>}
            </dl>
          )}
          {d?.movie && (
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm pt-2 border-t border-white/10">
              <div><dt className="text-[11px] uppercase text-neutral-400">Película</dt><dd className="font-bold">{d.movie}</dd></div>
              <div><dt className="text-[11px] uppercase text-neutral-400">Asiento</dt><dd className="font-bold text-purple-300">{d.seat}</dd></div>
              <div><dt className="text-[11px] uppercase text-neutral-400">Sala</dt><dd className="font-bold">{d.cinema} · {d.room}</dd></div>
              <div><dt className="text-[11px] uppercase text-neutral-400">Función</dt><dd className="font-bold">{new Date(d.showDatetime).toLocaleString('es-GT', { dateStyle: 'medium', timeStyle: 'short' })}</dd></div>
              <div className="col-span-2"><dt className="text-[11px] uppercase text-neutral-400">Cliente</dt><dd className="font-bold">{d.customer}</dd></div>
              {d.usedAt && <div className="col-span-2"><dt className="text-[11px] uppercase text-neutral-400">Usada el</dt><dd className="font-bold">{new Date(d.usedAt).toLocaleString('es-GT')}</dd></div>}
            </dl>
          )}
        </div>
      )}
    </div>
  );
}
