/** Carrega o PNG do QR (data URI) como um <img> em memória, pra poder
 * desenhar ele dentro do canvas — precisa esperar o "load" porque a imagem
 * só fica disponível pro canvas depois de decodificada. Só roda no
 * navegador (chamado a partir de componentes "use client"). */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Monta uma única imagem PNG com o QR Code + um título/subtítulo escritos
 * embaixo — pra quando a pessoa baixar um QR avulso ainda dar pra reconhecer
 * do que se trata antes mesmo de escanear (baia específica, ver
 * BaiaQrCode.tsx, ou o lançamento mestre, ver MestreQrCode.tsx). Tudo feito
 * no navegador com canvas, sem depender de nada no servidor — compartilhado
 * entre os dois componentes pra manter o mesmo visual sem duplicar código. */
export async function buildQrDownloadImage({
  dataUrl,
  title,
  subtitle,
}: {
  dataUrl: string;
  title: string;
  subtitle: string;
}): Promise<string> {
  const img = await loadImage(dataUrl);
  const qrSize = 240;
  const margin = 24;
  const width = qrSize + margin * 2;
  const textTop = margin + qrSize + 18;
  const height = textTop + 46 + margin;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  // QR em si: sem suavização, pra manter os quadradinhos nítidos (importante
  // pra continuar lendo bem depois de impresso).
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, margin, margin, qrSize, qrSize);

  ctx.textAlign = "center";
  ctx.fillStyle = "#221b15";
  ctx.font = "600 18px system-ui, sans-serif";
  ctx.fillText(title, width / 2, textTop + 18, width - margin);

  ctx.fillStyle = "rgba(34, 27, 21, 0.6)";
  ctx.font = "400 13px system-ui, sans-serif";
  ctx.fillText(subtitle, width / 2, textTop + 38, width - margin);

  return canvas.toDataURL("image/png");
}
